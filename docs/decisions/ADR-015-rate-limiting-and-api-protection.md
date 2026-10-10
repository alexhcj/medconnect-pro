# ADR-015 — Rate limiting and API protection

## Status

Accepted (SEC-007). Implementation: M15 ([DATA-004](../tasks/backend/DATA-004-rate-limit-bucket-persistence.md),
[BE-018](../tasks/backend/BE-018-rate-limit-platform-and-client-ip.md),
[BE-019](../tasks/backend/BE-019-auth-and-sensitive-route-rate-limits.md),
[BE-020](../tasks/backend/BE-020-api-security-headers.md),
[FE-034](../tasks/frontend/FE-034-rate-limited-auth-ux.md)).

## Context

`apps/api` has no rate limiting, no `trust proxy` setting, and no security-header middleware.
`POST /auth/login` and `POST /auth/mfa/verify` accept unbounded attempts. Redis is not part of
local Compose, and [ADR-014](ADR-014-oidc-bff-and-external-identity.md) already keeps short-lived
auth state in PostgreSQL. The gap is listed in
[production-requirements.md](../compliance/production-requirements.md).

## Decision



### Limiter

- **Algorithm:** fixed-window counters. A request increments the bucket for
`(policy, keyHash, windowStart)`; when the count exceeds the policy limit the request is
rejected with 429.
- **Storage:** behind a `RateLimitStore` port.
  - Default adapter: PostgreSQL table `rate_limit_buckets` (DATA-004). One atomic
  `INSERT ... ON CONFLICT DO UPDATE SET count = count + 1 RETURNING count` per check, with an
  `expires_at` column so expired rows can be pruned.
  - In-memory adapter for unit tests only. Not used by running processes.
  - Redis is a possible future adapter. It is not a dependency.
- **Enforcement:** a custom Nest `RateLimitGuard` with a `@RateLimit(policyName)` decorator.
Opt-in per route; there is no global blanket limit. The guard runs after session resolution
where the key needs the session user, and before the handler.
- **Keys:** composed per policy (see table), then hashed with HMAC-SHA-256 using
`RATE_LIMIT_KEY_SECRET`. Raw IPs, emails, MFA session IDs, and tokens are never stored or
logged. Emails are normalized (trimmed, lowercased) before hashing.
- **Tenant data:** `rate_limit_buckets` holds only policy name, key hash, window, count, and
expiry. It holds no tenant data, so RLS does not apply.



### Trusted client IP

- `TRUST_PROXY` is an integer hop count. Default `0`: `X-Forwarded-For` is ignored and the
socket address is the client IP.
- At `N > 0`, Express `trust proxy` is set to `N`, and the client IP is the address `N` hops back
in `X-Forwarded-For`.
- **Spoofing risk:** if `N` is larger than the real number of proxies in front of the API, a
client can prepend arbitrary `X-Forwarded-For` values and choose its own rate-limit key. Set
`N` to exactly the number of trusted proxies. The hosted value (ALB, and CloudFront if present)
cannot be verified until INFRA-014, so it stays an operator setting.



### Responses and failure modes

- **429:** `{error:{code:'RATE_LIMITED',message,details:{retryAfterSeconds}},correlationId}` plus a
`Retry-After` header in seconds (time until the window resets). Additive contract change.
- **Store failure:**
  - Auth and OAuth routes fail closed: HTTP 503
  `{error:{code:'RATE_LIMIT_UNAVAILABLE',message},correlationId}`.
  - Other routes fail open and log a warning that contains the policy name and correlation ID
  only, never key material.



### Audit

`auth.rate_limited` is written to `audit_events` (surfaced through security events) only when the
rejected request resolves to a known practice user, and at most once per key per window. Unknown
emails and IP-only keys produce no practice row. No IP, email, or key hash is stored in the event.

### Policy table


| Route                                                                 | Limit | Window | Key                          | Store failure |
| --------------------------------------------------------------------- | ----- | ------ | ---------------------------- | ------------- |
| `POST /auth/login` (per device)                                       | 5     | 15 min | client IP + normalized email | fail closed   |
| `POST /auth/login` (per IP)                                           | 20    | 15 min | client IP                    | fail closed   |
| `POST /auth/login` (per account; failed attempts only, checked before credentials) | 10 | 15 min | normalized email | fail closed |
| `POST /auth/mfa/verify`                                               | 5     | 10 min | MFA session + client IP      | fail closed   |
| `POST /auth/refresh`                                                  | 30    | 5 min  | client IP                    | fail closed   |
| `GET /auth/oauth/:provider/start`                                     | 20    | 5 min  | client IP                    | fail closed   |
| `GET /auth/oauth/:provider/callback`                                  | 20    | 5 min  | client IP                    | fail closed   |
| `GET /auth/oauth/fake/authorize` (Fake adapter, local/tests)          | 20    | 5 min  | client IP                    | fail closed   |
| `POST /telehealth/sessions/:id/media-token`                           | 30    | 5 min  | session user                 | fail open     |
| `GET /patients/:id/documents/:documentId/content` (document download) | 60    | 5 min  | session user                 | fail open     |
| `POST /billing/payments`                                              | 10    | 5 min  | session user                 | fail open     |


All three `POST /auth/login` policies apply; the first to exceed rejects. Limits are code
constants in BE-019 and may be tuned there without a new ADR.

### Amendment (BE-019, 2026-10-10): account-wide login failures

**Root cause.** The original table had only the per-device key (client IP + normalized email).
A real change of client IP starts a new bucket, so an attacker rotating real IPs (botnet,
proxies) got unbounded guesses against one account. Forged `X-Forwarded-For` entries were
already harmless: the client IP comes from `req.ip` under `TRUST_PROXY`.

**Threat cases.**

- Forged forwarding headers: ignored beyond `TRUST_PROXY` hops (unchanged).
- Legitimate client IP change: the user keeps their account budget; only their own failures count.
- One account from many IPs: bounded by the new per-account failure bucket.
- One IP against many accounts: bounded by the per-IP bucket (unchanged).

**Options.**

- A. Per-device bucket only: no cross-IP bound. Rejected.
- B. Email-only bucket counting every request: bounds guessing but lets anyone who knows an
  email trip it cheaply and counts the owner's successful logins. Rejected.
- C. Layered (chosen): keep per-IP and per-device buckets, and add a per-account bucket keyed
  on the HMAC of the normalized email that counts **failed** password attempts only, from any IP.
  It is checked before credentials, so a correct password is refused during cooldown.

**Mechanics.** `AuthService.login` peeks the account bucket before the password check
(`RateLimitStore.peek`) and increments it on every invalid-credentials outcome, including
unknown emails, so the 429 does not reveal whether an account exists. Store failure fails
closed (503). The counter is the same atomic PostgreSQL upsert, shared across instances.
`auth.rate_limited` follows the audit rule above (first rejection per window, known users only).

**Consequences.** A targeted account can be held in cooldown for at most the rest of one
15-minute window per 10 failures. There is no permanent lockout, successful logins do not
consume the budget, and OAuth sign-in (not keyed by email) remains a recovery path. The
threshold of 10 failures per 15 minutes is approved.

### Amendment (FE-034, 2026-10-10): OAuth callback landing reason

A throttled `GET /auth/oauth/:provider/callback` redirects to `/login?reason=rate_limited` (with
`Retry-After`) instead of the generic `oauth_failed`. Throttling is keyed per client IP and is
already reported openly as a JSON 429 on login, MFA, and OAuth start, so naming it reveals no
account or provider detail. Provider, state, and ID-token failures, and a limiter-store outage
(503 path), still land on the generic `oauth_failed`. The web shows "Too many attempts. Try again
later." because a 302 cannot pass the retry seconds to the page.

### API security headers

Set by a small direct Nest middleware (BE-020), not `helmet`:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `X-Frame-Options: DENY` and `Content-Security-Policy: frame-ancestors 'none'`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` only when `APP_ENV` is not
`local`

`Cache-Control: no-store` applies to every `/auth/*` response (including `/auth/oauth/*`) and to
`POST /telehealth/sessions/:id/media-token`.

## Alternatives considered

- **Redis store:** standard for distributed limiters, but adds a service to Compose and hosted
infrastructure for demo traffic. Kept as a future `RateLimitStore` adapter.
- **In-memory only:** no persistence and no sharing across ECS tasks; limits reset on deploy and
multiply with task count. Rejected except for tests.
- `@nestjs/throttler` **12.x:** its storage interface and tracker hooks can be extended, but
composite keys (IP + email, MFA session + IP), fail-closed behavior on auth routes, and the
project error envelope all need overrides. A small custom guard is clearer and adds no
dependency.
- `helmet`**:** mostly covers HTML-oriented headers (CSP, COEP, and others) that a JSON API does
not need. Four headers do not justify a dependency.
- **Edge / WAF / CloudFront rules:** correct for production, but blocked with M9 and invisible in
  local Compose. Complementary later; not a replacement for application limits.



## Consequences

- One PostgreSQL write per protected request. Acceptable at demo volume; protected routes are
opt-in.
- Expired buckets need pruning (opportunistic delete or a periodic job; DATA-004 / BE-018).
- Concurrent first requests in a window are serialized by the unique constraint and the upsert.
- Fixed windows allow up to twice the limit across a window boundary. Accepted for the demo.
- A misconfigured `TRUST_PROXY` either collapses all clients onto the proxy IP (too low) or lets
clients pick their key (too high).
- A new secret, `RATE_LIMIT_KEY_SECRET`, is introduced; see
[environment-configuration.md](../contracts/environment-configuration.md).
- This is a demo control. It is not production DDoS protection, account lockout, or WAF.

