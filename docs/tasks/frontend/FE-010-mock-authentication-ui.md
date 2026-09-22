---
id: FE-010
type: task
area: frontend
feature: identity-access
status: implemented
priority: critical
estimate: 3
dependencies: [FE-001, SEC-001]
related_adrs: [ADR-003-authentication.md]
related_docs:
  [
    frontend-architecture.md,
    security-architecture.md,
    ../contracts/identity-and-access.md,
    ../contracts/api-endpoints.md,
    ../roadmap/release-roadmap.md,
  ]
plane:
  work_item_id: null
  identifier: null
---

# FE-010 — Mock authentication UI and session gate

## Objective

Close M1 Identity on the frontend: a labeled mock IdP login/logout that establishes the session the
dashboard shell uses, and a dashboard route gate for unauthenticated users.

## Scope

Mock login at `/login`, logout, persist a mock session, redirect unauthenticated `/dashboard/**`
traffic to `/login`. Slim leftover v0 MFA/register theater. Do not add Next.js Route Handlers as a
second identity stack.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.
- Do not add NextAuth, hash passwords in the browser, or verify JWTs in the browser.
- Label mock authentication as mock; it is not production identity infrastructure ([ADR-003](../../decisions/ADR-003-authentication.md)).

## Acceptance criteria

- [x] Login as a labeled mock IdP establishes the session the dashboard reads
- [x] Logout clears the mock session
- [x] Unauthenticated `/dashboard` access redirects to `/login`
- [x] Canonical login path is `/login` (no mixed `/auth/login` redirects)
- [x] Register, email-verification, and password-reset are parked as out-of-milestone stubs
- [x] Session chrome (idle warning, extend, concurrent-session) is scoped to the authenticated tree
- [x] Next.js `/api/auth/*` 501 stubs are not used as the mock identity source
- [x] Vitest covers login/session mock behavior
- [x] Playwright covers login → dashboard and unauthenticated dashboard → login

## Implementation notes

Browser checks remain UX only. Server-side Identity HTTP is [BE-009](../backend/BE-009-identity-and-access-http.md).
Do not default a missing session role to `PRACTICE_ADMIN` as an access grant.

## Completion

- Implementation: Mock IdP login at `/login` (synthetic `docs/mocks/demo-users.json`), localStorage
  session, dashboard `DashboardAuthGate`, SessionProvider scoped to the authenticated tree, parked
  register/reset/email-verification stubs. Next `/api/auth/*` 501 routes unused in mock mode.
- Tests: Vitest session mock, login form, auth gate; Playwright auth + dashboard navigation.
- PR:
- Notes: NestJS Identity HTTP remains BE-009. Frontend checks are still not authorization.
