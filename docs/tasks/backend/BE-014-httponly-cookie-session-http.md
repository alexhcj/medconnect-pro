---
id: BE-014
type: task
area: backend
feature: identity-access
status: implemented
priority: high
estimate: 5
dependencies: [BE-009]
related_adrs: [ADR-003-authentication.md]
related_docs:
  [
    ../../architecture/backend-architecture.md,
    ../../architecture/security-architecture.md,
    ../../contracts/api-endpoints.md,
    ../../contracts/identity-and-access.md,
    ../../product/identity-access.md,
    BE-009-identity-and-access-http.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: 7387e8ab-87a6-468d-8429-4924cc4e2261
  identifier: MEDCONNECT-80
---

# BE-014 — HttpOnly cookie session HTTP

## Objective

Make Nest the live cookie session authority: `Set-Cookie` on mock IdP auth routes, CORS
credentials, and an `AuthGuard` that accepts a session cookie **or** the existing Bearer token.

## Context

[BE-009](BE-009-identity-and-access-http.md) shipped opaque hashed sessions, idle/absolute TTLs,
refresh rotation, logout/logout-all, and MFA verify as JSON token pairs. Live Next still stores
those tokens in `localStorage`. The identity contract already names HttpOnly / Secure / SameSite
cookies as the real-mode browser session.

M10 left cookie/BFF out of scope ([BE-011](BE-011-dashboard-overview-api.md)). This task is the
Nest half of that cutover. Frontend live client is [FE-027](../frontend/FE-027-live-cookie-session-client.md).

Does not implement production OAuth ([ADR-003](../../decisions/ADR-003-authentication.md)).

## Scope

- `Set-Cookie` on `POST /auth/login`, `/auth/refresh`, `/auth/mfa/verify`; clear cookies on
  logout / logout-all
- Cookie flags by `APP_ENV`: `HttpOnly`; `Secure` outside local; `SameSite=Lax` local,
  `SameSite=None` when the web origin is cross-site (hosted)
- CORS `credentials: true` with the existing origin allowlist
  ([configure-app.ts](../../../apps/api/src/platform/configure-app.ts))
- `AuthGuard` accepts session cookie **or** `Authorization: Bearer` (do not strip Bearer)
- CSRF posture for cookie-authenticated browser calls: JSON `Content-Type` plus CORS allowlist
  locally; extra CSRF cookie/header if hosted `SameSite=None` requires it
- OpenAPI documents cookie + bearer
- HTTP tests with a cookie jar; existing auth tests still pass via cookie and/or bearer
- Optionally an HttpOnly MFA-challenge cookie so the browser never holds `mfaToken` in storage
- Update the identity-contract session “real mode” wording from target to implemented-demo when
  this ships

## Out of Scope

- Next.js identity BFF or NextAuth
- Production OAuth 2.0 / OIDC + PKCE
- Redis or a new session store (`auth_sessions` stays)
- Rate limiting
- Frontend live client (FE-027)
- Mock MFA UI (FE-028)
- Security-events HTTP (BE-015)
- Stripping Bearer support (API tests, OpenAPI, INFRA-013 smoke)

## Requirements

- Nest remains the session authority. Do not add Next Route Handlers as a second identity stack.
- JSON token pair may remain for machine clients. Cookies are the intended live browser mechanism.
- Do not return refresh tokens as the intended live frontend storage path.
- Idle 15m, absolute 24h, and refresh-reuse revoke stay as in
  [session-policy.ts](../../../apps/api/src/identity/session-policy.ts).
- Do not invent a new catalog permission string.

## Acceptance Criteria

- [x] Login, refresh, and MFA verify set HttpOnly session cookies
- [x] Cookies are `Secure` when `APP_ENV` is not local; `SameSite` matches local vs hosted
- [x] Logout (and logout-all) clear the session cookies
- [x] Refresh rotation still revokes reuse
- [x] CORS allows credentialed requests from the existing web origin allowlist
- [x] `AuthGuard` authenticates from cookie or Bearer
- [x] OpenAPI documents cookie and bearer schemes
- [x] Existing auth HTTP tests pass via cookie and/or bearer (`npm run test:api`)

## Dependencies

- BE-009 (shipped)
- Blocks: FE-027
- Does not wait on BE-015 or FE-028

## Validation

- `npm run test:api` including auth HTTP and OpenAPI contract tests
- Cookie-jar coverage for login → authenticated request → logout
- No browser e2e in this task

## Risks / Considerations

- Hosted Amplify (web) and ECS API are cross-site; `SameSite=None; Secure` is required there.
  M9 is paused; still set flags correctly by `APP_ENV`.
- XSS can still read tokens if JSON bodies keep returning them; cookies must not be the only
  theater if the live client ignores them (FE-027 must not persist tokens).
- Creating a Next BFF instead of Nest cookies would require a new ADR; do not do that.

## Implementation notes

Suggested order: first M11 backend task. Files:
[auth.controller.ts](../../../apps/api/src/identity/auth.controller.ts),
[auth.guard.ts](../../../apps/api/src/identity/auth.guard.ts),
[configure-app.ts](../../../apps/api/src/platform/configure-app.ts).

Writing this spec is not a version bump. Shipping this slice is **MINOR** (auth/security-model
change on 0.x).

## Completion

- Implementation: Nest `Set-Cookie` on login/refresh/MFA verify (`mcp_access`, `mcp_refresh`,
  `mcp_mfa`); logout/logout-all clear cookies. CORS `credentials: true`. `AuthGuard` accepts
  cookie or Bearer (Bearer wins). Hosted cookie-auth CSRF is `mcp_csrf` + `X-CSRF-Token`. JSON
  token pairs remain for machine clients. Not OAuth, not a Next BFF.
- Tests: session-cookie and CSRF unit tests; identity HTTP cookie-jar coverage; existing Bearer
  auth tests; OpenAPI cookie-or-bearer contract (`npm run test:api`).
- PR:
- Notes: Live Next storage cutover remains FE-027. Frontend-architecture.md and deploy.md cookie
  forbid sentences are owned by FE-027.
