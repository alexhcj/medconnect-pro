---
id: FE-027
type: task
area: frontend
feature: identity-access
status: implemented
priority: high
estimate: 3
dependencies: [FE-010, BE-014]
related_adrs: [ADR-003-authentication.md]
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../architecture/security-architecture.md,
    ../../contracts/identity-and-access.md,
    ../../contracts/api-endpoints.md,
    ../../product/identity-access.md,
    ../../workflows/deploy.md,
    FE-010-mock-authentication-ui.md,
    ../backend/BE-014-httponly-cookie-session-http.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: 68e00cab-89c1-46f5-a9b7-4c09ec7f939b
  identifier: MEDCONNECT-81
---

# FE-027 — Live cookie session client

## Objective

Switch live Next.js API calls to credentialed cookies and stop storing Nest access/refresh
tokens in web storage. Mock mode keeps `localStorage`.

## Context

[FE-010](FE-010-mock-authentication-ui.md) established mock login and the dashboard gate.
Live mode today writes tokens via [session-real.ts](../../../apps/web/src/lib/api/session-real.ts)
and attaches Bearer in [http.ts](../../../apps/web/src/lib/api/http.ts). [BE-014](../backend/BE-014-httponly-cookie-session-http.md)
sets Nest cookies. M10 parked this cutover on FE-024 / FE-025 / FE-026.

No new screens. Design is not required.

## Scope

- Live `fetch` uses `credentials: 'include'`
- Stop persisting access/refresh in `localStorage` / session storage (`writeLiveSession` token
  keys). Non-secret session metadata (role UX hints) may remain client-side
- Logout must end the Nest session (cookies cleared by BE-014)
- If existing concurrent-session chrome terminates sessions, call `POST /auth/logout-all`; do
  **not** add a list-sessions API
- Mock mode unchanged (`localStorage` stand-in)
- Stop using Next `/api/auth/*` 501 stubs; delete them if unused
- When this ships, update the “do not rewrite identity to cookies” sentences in
  [frontend-architecture.md](../../architecture/frontend-architecture.md) and
  [deploy.md](../../workflows/deploy.md). Do not rewrite completed INFRA-009 history.

## Out of Scope

- Mock MFA challenge UI (FE-028)
- NextAuth or a Next.js identity BFF
- Rewriting mock mode onto cookies
- Hosted Amplify verification (M9)
- Concurrent-session **list** HTTP (live `checkConcurrentSessions` may stay empty)
- Security-events UI (FE-029)

## Requirements

- Frontend checks remain UX only; Nest is authoritative
- Do not hash passwords or verify JWTs in the browser
- Do not add Next.js Route Handlers as a second identity stack (FE-010)

## Acceptance Criteria

- [x] After live login, DevTools storage has no access or refresh tokens
- [x] Dashboard live calls succeed with cookies (`credentials: 'include'`)
- [x] Logout ends the Nest session
- [x] Mock Playwright still uses mocks
- [x] One `e2e:live` login → dashboard still passes
- [x] frontend-architecture.md and deploy.md no longer forbid the live cookie model

## Dependencies

- FE-010 (shipped), BE-014
- Blocks: FE-028
- Does not wait on BE-015

## Validation

- Vitest for `session-real` / live `apiFetch` cookie credentials and no token persistence
- `npm run e2e:live` auth spec
- Mock `e2e` unchanged

## Risks / Considerations

- Every live `fetch` that bypasses `apiFetch` must also send credentials (login/refresh today
  use raw `fetch`).
- Do not treat frontend hiding of tokens as authorization.

## Implementation notes

Suggested order: after BE-014; before FE-028. No Figma work.

Writing this spec is not a version bump. Shipping this slice is **MINOR** (security-model UX).

## Completion

- Implementation: Live `apiFetch`, login, and document blob download send `credentials: 'include'`
  and do not attach Bearer from storage. Hosted mutations send `X-CSRF-Token` when `mcp_csrf` is
  present. `mcp_live_session` keeps role UX metadata only. Logout calls Nest `POST /auth/logout`;
  concurrent-session terminate / Log Out Everywhere call `POST /auth/logout-all`. Unused Next
  `/api/auth/*` 501 stubs deleted.
- Tests: Vitest for `session-real`, `apiFetch` credentials/CSRF, and domain APIs. Playwright
  `e2e/auth-live.spec.ts` asserts no stored tokens after live login and that sign-out returns to
  login. Mock `e2e/auth.spec.ts` unchanged.
- PR:
- Notes: MINOR 0.67.0 → 0.68.0 (security-model UX). Hosted Amplify verification remains M9.
