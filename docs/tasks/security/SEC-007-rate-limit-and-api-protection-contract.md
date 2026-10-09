---
id: SEC-007
type: task
area: security
feature: api-protection
status: pending
priority: high
estimate: 2
dependencies: [SEC-006, BE-014, BE-015]
related_adrs: [ADR-014-oidc-bff-and-external-identity.md]
related_docs:
  [
    ../../architecture/security-architecture.md,
    ../../architecture/api-architecture.md,
    ../../contracts/data-contracts.md,
    ../../contracts/identity-and-access.md,
    ../../contracts/environment-configuration.md,
    ../../compliance/production-requirements.md,
  ]
implementation:
  status: not_started
validation:
  responsive: false
  accessibility: false
  tests_required: false
plane:
  work_item_id: a831c860-be06-4961-9b6d-af10d4b52188
  identifier: MEDCONNECT-94
---

# SEC-007 — Rate-limit, proxy-trust, and API-header contract (ADR-015)

## Objective

Record the M15 decisions before code: limiter storage, key strategy, trusted client IP, 429/503
envelopes, failure modes, audit rule, and API security headers. Docs only.

## Context

No rate limiting, `trust proxy`, or security-header middleware exists in `apps/api`
([configure-app.ts](../../../apps/api/src/platform/configure-app.ts)). `/auth/login` and
`/auth/mfa/verify` accept unbounded attempts. Redis is not in `docker-compose.yml`; ADR-014 chose
PostgreSQL for short-lived auth state. The gap is listed in
[production-requirements.md](../../compliance/production-requirements.md).

## Scope

- `docs/decisions/ADR-015-rate-limiting-and-api-protection.md`:
  - Fixed-window counters behind a `RateLimitStore` port; PostgreSQL `rate_limit_buckets` default;
    in-memory adapter for unit tests; Redis named as a future adapter, not a dependency.
  - Custom Nest guard + `@RateLimit(policy)` decorator vs `@nestjs/throttler` 12.x — decide based on
    custom keys, async store, and envelope fit. Opt-in per route; no global blanket limit.
  - Keys hashed (HMAC/SHA-256); raw IP, email, or token never stored or logged.
  - `TRUST_PROXY` hop count (default `0` = ignore `X-Forwarded-For`).
  - Failure mode: auth routes fail closed (503 `RATE_LIMIT_UNAVAILABLE`); others fail open with a
    key-free warning log.
  - `rate_limit_buckets` holds no tenant data; RLS not applicable.
- Policy table (limits, windows, keys) for: `POST /auth/login` (IP + normalized email),
  `POST /auth/mfa/verify` (MFA session + IP), `POST /auth/refresh` (IP),
  `GET /auth/oauth/:provider/start`, `/callback`, and Fake authorize (IP),
  `POST /telehealth/sessions/:id/media-token`, document download, `POST /billing/payments`
  (session user).
- 429 envelope `{error:{code:'RATE_LIMITED',message,details:{retryAfterSeconds}}}` + `Retry-After`
  in [data-contracts.md](../../contracts/data-contracts.md) and the identity contract.
- Audit rule: `auth.rate_limited` only when a known practice user resolves; at most once per key
  per window.
- Header list: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` / `frame-ancestors`,
  HSTS outside `APP_ENV=local`; `Cache-Control: no-store` on auth/OAuth/media-token responses.
  Decide direct middleware vs `helmet`.
- `TRUST_PROXY` in [environment-configuration.md](../../contracts/environment-configuration.md).
- Security and API architecture docs reference ADR-015.

## Out of Scope

- Any code, migration, or dependency change
- Redis, WAF, CloudFront/ALB rate rules (M9)
- Permanent account lockout, production MFA, new IdP

## Acceptance Criteria

- [ ] ADR-015 accepted with alternatives (Redis, in-memory only, throttler) and consequences
- [ ] Policy table lists every target route with limit, window, key, and failure mode
- [ ] 429 and 503 envelopes documented as additive contract changes
- [ ] `TRUST_PROXY` semantics and spoofing risk documented
- [ ] Header list and `no-store` route set documented
- [ ] No application code changed; no secrets or PHI in docs

## Dependencies

- Shipped: SEC-006, BE-014, BE-015
- Blocks: DATA-004, BE-018, BE-020

## Validation

- Doc review against the policy table and `apps/api` routes

## Risks / Considerations

- Docs-only: no version bump (ADR-007).
- Hosted hop count is unverifiable until INFRA-014; keep it configurable.

## Completion
