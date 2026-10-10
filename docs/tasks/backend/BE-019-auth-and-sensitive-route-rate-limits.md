---
id: BE-019
type: task
area: backend
feature: api-protection
status: implemented
priority: high
estimate: 3
dependencies: [BE-018, BE-015, BE-017]
related_adrs: [ADR-015-rate-limiting-and-api-protection.md, ADR-014-oidc-bff-and-external-identity.md]
related_docs:
  [
    ../../contracts/identity-and-access.md,
    ../../contracts/api-endpoints.md,
    ../../product/identity-access.md,
    ../security/SEC-007-rate-limit-and-api-protection-contract.md,
    BE-018-rate-limit-platform-and-client-ip.md,
  ]
implementation:
  status: done
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: d200efd8-7790-4914-94ef-020a5e7e3717
  identifier: MEDCONNECT-97
---

# BE-019 — Auth and sensitive-route rate-limit policies

## Objective

Apply the SEC-007 policy table to authentication and expensive routes, and audit throttling as a
security event.

## Scope

- [auth.controller.ts](../../../apps/api/src/identity/auth.controller.ts): `login` (IP + normalized
  email, independent buckets), `mfa/verify` (MFA session + IP), `refresh` (IP). Fail closed.
- [oauth.controller.ts](../../../apps/api/src/identity/oauth.controller.ts): `:provider/start`,
  `:provider/callback`, `fake/authorize` (IP). Callback throttling redirects to the existing
  generic `/login?reason=...` failure path rather than JSON.
- Session-user policies, fail open: `POST /telehealth/sessions/:id/media-token`, document
  download, `POST /billing/payments`.
- Audit `auth.rate_limited` (resource `session`, no email/IP/token) only when a known practice
  user resolves; once per key per window. Visible in `GET /admin/security-events`.
- Update the product registry (`docs/product/identity-access.md`) and capability matrix with
  demo rate limiting wording; no HIPAA claim.

## Out of Scope

- Global limits on every route; permanent lockout; CAPTCHA
- Frontend (FE-034)

## Acceptance Criteria

- [x] Per-account login limit holds while the source IP rotates (`TRUST_PROXY=1` test): the
  account-wide failure bucket (ADR-015 amendment) holds across real IP changes; the per-device
  bucket holds while forged untrusted `X-Forwarded-For` hops rotate
- [x] Per-IP login limit holds across different emails
- [x] MFA verify is blocked well before the fixture code space is exhausted
- [x] Refresh and OAuth routes return 429 (or the generic redirect for callback) past the limit
- [x] A normal Fake OAuth flow (`test/oauth-flow.ts`) and normal login still succeed
- [x] Media-token, document download, and payment return 429 past the limit
- [x] Security-events shows `auth.rate_limited` with no email, IP, or token
- [x] Authorization matrix and all existing HTTP suites pass
- [x] OpenAPI documents 429 on every policy route; contract test passes

## Dependencies

- BE-018, BE-015, BE-017
- Blocks: FE-034

## Validation

- `npm test` in `apps/api` (HTTP specs with in-memory store reset per test)
- `npm run openapi:generate`

## Risks / Considerations

- Shared-NAT clinics: account keys plus generous IP limits.
- Existing suites that log in repeatedly must reset the injected store.
- MINOR version bump.

## Completion

Shipped in 0.79.0. Policies live in `apps/api/src/rate-limit/rate-limit.policies.ts` (ADR-015
values) and are applied with `@RateLimit` on the auth, OAuth, media-token, document content
(`GET /patients/:id/documents/:documentId/content`), and payment routes. `RateLimitGuard` is now
request-scoped: Nest runs static global guards before request-scoped ones, so it previously ran
before `AuthGuard` and session-user keys never resolved. The guard calls `RATE_LIMIT_AUDITOR`
(`IdentityRateLimitAuditor`) on the first rejection in a window (`count === limit + 1`). It
writes `auth.rate_limited` only for a resolvable practice user. Session-user routes also audit.
A throttled OAuth callback redirects to `/login?reason=oauth_failed` (since FE-034:
`/login?reason=rate_limited`) with `Retry-After`
(`OAuthCallbackRateLimitFilter`). HTTP specs override `RATE_LIMIT_STORE` with a shared in-memory
store that `vitest.setup.ts` resets before each test. Tests: `test/auth-rate-limit.http.spec.ts`
and key unit tests in `src/rate-limit/rate-limit.spec.ts`. The OpenAPI check asserts 429 on every
policy route.

The per-account conflict was resolved by the ADR-015 amendment (BE-019, layered option C). A
third login control, `auth.login.account_failures`, counts failed password attempts per
normalized email from any IP (10 per 15 min, approved). `AuthService.login`
checks it before credentials via `RateLimitStore.peek` (`AccountLoginLimiter`) and increments it
on every invalid-credentials outcome, unknown emails included, so a 429 reveals nothing. It fails
closed, and successful logins do not count. `auth.rate_limited` is written once, when a failure
starts the cooldown for a known user. Tests: real IP rotation, legitimate user, cooldown
recovery, no enumeration, per-device and per-IP limits, and atomic concurrent counting on
PostgreSQL (`test/account-login-limiter.persistence.spec.ts`).
