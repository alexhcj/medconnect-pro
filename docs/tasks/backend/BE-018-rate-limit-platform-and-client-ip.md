---
id: BE-018
type: task
area: backend
feature: api-protection
status: implemented
priority: high
estimate: 3
dependencies: [SEC-007, DATA-004, BE-001]
related_adrs: [ADR-015-rate-limiting-and-api-protection.md]
related_docs:
  [
    ../../architecture/api-architecture.md,
    ../../contracts/data-contracts.md,
    ../../contracts/environment-configuration.md,
    ../security/SEC-007-rate-limit-and-api-protection-contract.md,
    DATA-004-rate-limit-bucket-persistence.md,
  ]
implementation:
  status: done
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: 29e5d738-2c5a-4d62-97a7-8e262aab2885
  identifier: MEDCONNECT-96
---

# BE-018 — Rate-limit platform and trusted client IP

## Objective

Add the reusable limiter (port, adapters, guard, decorator, error envelopes) and a safe client-IP
resolver, without applying route policies yet.

## Scope

- `RateLimitStore` port; PostgreSQL adapter (DATA-004) as default, in-memory adapter for tests.
  Injectable so tests can reset state; no production bypass flag.
- `TRUST_PROXY` in [env.schema.ts](../../../apps/api/src/platform/env.schema.ts) (integer hop
  count, default `0`); `app.set('trust proxy', n)` in
  [configure-app.ts](../../../apps/api/src/platform/configure-app.ts). `.env.example` placeholder.
- Client-IP helper uses Express `req.ip` only (never reads `X-Forwarded-For` directly).
- `RateLimitGuard` + `@RateLimit(policy)`; opt-in; ordered before `AuthGuard` for public routes.
- Key hashing (HMAC/SHA-256) per ADR-015.
- 429 `RATE_LIMITED` with `details.retryAfterSeconds` and `Retry-After`; 503
  `RATE_LIMIT_UNAVAILABLE` for fail-closed policies, both via `EnvelopeExceptionFilter`.
- OpenAPI helper decorator that documents 429 on limited routes.
- Fail-open path logs a warning without the key or IP.

## Out of Scope

- Applying policies to routes (BE-019)
- Security headers (BE-020)
- Redis adapter

## Acceptance Criteria

- [x] Probe route: N requests allowed, request N+1 returns 429 with envelope and `Retry-After`
- [x] Count resets after the window (injected clock)
- [x] With `TRUST_PROXY=0`, varying `X-Forwarded-For` does not change the key
- [x] With `TRUST_PROXY=1`, the right-most untrusted hop is used
- [x] Store failure: fail-closed policy returns 503; fail-open policy passes and logs no key/IP
- [x] Invalid `TRUST_PROXY` fails env validation at boot
- [x] Logs and audit contain no raw IP, email, or token
- [x] OpenAPI regenerated; contract test passes; existing suites pass

## Dependencies

- SEC-007, DATA-004, BE-001
- Blocks: BE-019

## Validation

- `npm run lint`, `npm run type-check`, `npm test` in `apps/api`
- `npm run openapi:generate` + `openapi.contract.spec.ts`
- Probe controller pattern: `test/validation-probe.controller.ts`

## Risks / Considerations

- Misconfigured `TRUST_PROXY` in hosted envs enables spoofing or a shared bucket; hosted check
  deferred to INFRA-014.
- MINOR version bump (new API error contract).

## Completion

Shipped in 0.78.0. `apps/api/src/rate-limit/`: `RateLimitStore` port (PostgreSQL default,
in-memory for tests), `@RateLimit(...policies)` + `ApiRateLimited`, HMAC-SHA-256 keys
(`RATE_LIMIT_KEY_SECRET`), `clientIp` via `req.ip` and `TRUST_PROXY`, and 429/503 mapping in
`EnvelopeExceptionFilter`. `ErrorBody.details` now also accepts an object
(`{retryAfterSeconds}`). Guard order: `RateLimitGuard` is a global guard after `AuthGuard` and
before `PermissionsGuard`; `AuthGuard` is a no-op on `@Public` routes, so public routes are
limited before any auth work and session-user keys resolve on authenticated routes. Tests:
`test/rate-limit.http.spec.ts` (probe controller), `src/rate-limit/rate-limit.spec.ts`, env and
filter specs. No route policies applied (BE-019). Hosted secret injection waits on M9.
