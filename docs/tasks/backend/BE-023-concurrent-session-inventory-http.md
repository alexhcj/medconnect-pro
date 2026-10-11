---
id: BE-023
type: task
area: backend
feature: identity-access
status: implemented
priority: high
estimate: 3
dependencies: [SEC-009, BE-014]
related_adrs: [ADR-003-authentication.md, ADR-015-rate-limiting-and-api-protection.md]
related_docs:
  [
    ../../architecture/security-architecture.md,
    ../../architecture/backend-architecture.md,
    ../../contracts/api-endpoints.md,
    ../../contracts/identity-and-access.md,
    ../../contracts/data-contracts.md,
    ../../product/identity-access.md,
    ../security/SEC-009-m17-security-findings-and-contract-reconciliation.md,
    BE-014-httponly-cookie-session-http.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: 550412e3-d5a2-480a-85a5-c4b37ff01286
  identifier: MEDCONNECT-105
---

# BE-023 — Concurrent session inventory HTTP

## Objective

Expose Nest session inventory and selective revoke so a user can see their other sessions and
end them without signing out of the current one.

## Context

The identity contract requires concurrent sessions to be detectable and other sessions
terminable. [BE-014](BE-014-httponly-cookie-session-http.md) ships logout and logout-all.
[FE-027](../frontend/FE-027-live-cookie-session-client.md) deferred list HTTP; live
`checkConcurrentSessions` returns `[]`, and `terminateSessions` calls `POST /auth/logout-all`
(would end the current session). `auth_sessions` already stores id, timestamps, and `revokedAt`
— no UA/IP columns. Frontend chrome exists but never opens in live mode.

The contract is [SEC-009](../security/SEC-009-m17-security-findings-and-contract-reconciliation.md)
(ADR-016 does not change session ownership: list is always the authenticated user). Live UI is
[FE-036](../frontend/FE-036-live-concurrent-session-chrome.md).

Implements / extends planned `identity-access.concurrent-sessions` (HTTP). Catalog stays
`planned` until FE-036 ships.

## Scope

- `GET /auth/sessions` — cookie or Bearer. Non-revoked sessions for the caller only. RDO:
  `sessionId`, `createdAt`, `lastActivityAt`, `isCurrent`, optional coarse device class
  (`desktop` | `mobile` | `unknown`). **Never return IP, location, or raw user-agent.**
- `POST /auth/sessions/:id/revoke` — cookie or Bearer; CSRF on cookie mutations (same as logout).
  Revoke another of the caller’s sessions without clearing current cookies. Revoking the current
  session equals logout (clear cookies). Unknown / other-user ids → same `NOT_FOUND` (no oracle).
- Keep `POST /auth/logout` and `POST /auth/logout-all`.
- Optional nullable coarse device-class column on `auth_sessions` if the dialog needs it; do not
  persist raw IP or UA for display.
- `@RateLimit` fail-open session-user policies per SEC-009 / ADR-015 additive rows.
- Audit `auth.session.revoked` (no tokens, no IP). Do not audit every list call.
- OpenAPI via `npm run openapi:generate` and [api-endpoints.md](../../contracts/api-endpoints.md).

## Out of Scope

- Practice switcher / SUPER_ADMIN cross-practice
- Session-policy editor, production MFA
- Storing or returning raw IP, geo, or full user-agent
- Mock-mode rewrite (FE-036)
- Recreating BE-014 cookie/refresh platform

## Requirements

- Authorization is the authenticated user only. Tenant from the session; no client `practiceId`
  for this surface.
- Meeting tokens, refresh hashes, and IPs must not appear in RDOs, audit, or logs.
- Hosted cookie revoke sends `X-CSRF-Token` like other cookie mutations.

## Acceptance Criteria

- [x] Two live sessions for one user → list length 2 with exactly one `isCurrent`
- [x] Other-user or unknown session id on get/revoke → 404 with no existence oracle
- [x] Revoke other keeps current cookies; revoke current clears cookies (logout)
- [x] `logout-all` still revokes every session and clears cookies
- [x] RDO has no `ipAddress`, location, or raw user-agent
- [x] 429 uses existing `RATE_LIMITED` envelope; limiter failure fail-open
- [x] OpenAPI includes both routes; identity HTTP tests cover the cases above

## Dependencies

- SEC-009, BE-014
- Blocks: FE-036
- Does not wait on BE-022, QA-005, or M9

## Validation

- HTTP: [`identity.http.spec.ts`](../../../apps/api/test/identity.http.spec.ts) (or dedicated
  session-inventory spec)
- Unit: auth service revoke/list
- `npm run test:api`, lint, type-check, `npm run openapi:generate`

## Risks / Considerations

- Shipping this slice is **MINOR** (new public session API).
- Coarse device class is optional; timestamps + `isCurrent` are enough if UA persistence is
  declined.
- Do not add an idle keep-alive endpoint.

## Implementation notes

Reuse `auth_sessions` and [`AuthService`](../../../apps/api/src/identity/auth.service.ts)
logout helpers. Do not return token hashes.

Writing this spec is not a version bump.

## Completion

Shipped in 0.83.0 (MINOR). `GET /auth/sessions` lists the caller’s issued, non-revoked sessions
(`sessionId`, timestamps, `isCurrent`; no IP, location, or user-agent). `POST /auth/sessions/:id/revoke`
ends another of those sessions without clearing the current cookies. Revoking the current session
clears cookies, the same as logout. Unknown, other-user, and already-revoked ids return the same
`NOT_FOUND`. Selective revoke audits `auth.session.revoked`. List calls are not audited. Session-user
rate limits fail open. Live dialog wiring remains FE-036; the capability stays `planned`.
