---
id: FE-033
type: task
area: frontend
feature: identity-access
status: implemented
priority: high
estimate: 3
dependencies: [BE-017, FE-027]
related_adrs: [ADR-003-authentication.md, ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../contracts/identity-and-access.md,
    ../../contracts/api-endpoints.md,
    ../../product/identity-access.md,
    ../../marketing/capability-matrix.md,
    ../../workflows/design-requirements.md,
    FE-010-mock-authentication-ui.md,
    FE-027-live-cookie-session-client.md,
    FE-028-mock-mfa-challenge-ui.md,
    ../backend/BE-017-oidc-client-and-session-issuance.md,
  ]
design:
  required: true
  tool: figma
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=182-2184"
  frame: "App / Login — FE-033 frames (182:2184)"
  status: approved
implementation:
  status: complete
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: f9e563a9-fd07-4ae7-b08d-7fa33ceb14c1
  identifier: MEDCONNECT-93
---

# FE-033 — OAuth login UX and session hydration

## Objective

Add a “Continue with Google” (or labeled Fake) sign-in path to live `/login`, complete the redirect
round-trip, and hydrate the dashboard session from Nest instead of demo fixtures.

## Context

[BE-017](../backend/BE-017-oidc-client-and-session-issuance.md) provides start/callback and
`GET /auth/session`. The live client ([FE-027](FE-027-live-cookie-session-client.md)) uses cookies
but builds `SessionInfo` from `fixtureDemoUsers`, which cannot represent an OAuth user.
`/login?reason=` is currently ignored.

Implements `identity-access.oauth-oidc-pkce`.

**Do not implement application code until `design.status` is `approved` on this task.**

Shared Figma file: https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd

## Scope

- Design (shared file): provider button and divider on the existing login card; redirecting
  state; OAuth failure message; unavailable state (mocks on / not configured); complete screen.
- Live: provider button navigates (top-level) to Nest `/auth/oauth/{provider}/start?returnTo=/dashboard`.
- `/login/oauth/complete`: call `GET /auth/session`, write the live session store, go to dashboard;
  on 401 go to `/login?reason=oauth_failed`.
- `/login` shows accessible messages for `reason` values (`oauth_failed`, `unauthorized`,
  `signed_out`).
- Live `getCurrentSession`: when the store is empty, try `GET /auth/session` before returning 401.
- Mock mode: password flow unchanged; provider button labeled unavailable.
- When shipped: `identity-access.oauth-oidc-pkce` → `shipped`, `public: qualified`, claim “Demo
  OIDC + PKCE (Google or Fake). Not a production IdP.”; marketing matrix in lockstep.

## Design Brief

Frames for the shared Figma file:

- `/login` default at 1440, 768, and 375. Mobile variants for redirecting, unavailable, and
  `reason` banners.
- `/login/oauth/complete` loading screen (same card shell, `role="status"`).

States and copy:

- Provider button (`Button` outline, full width, at least 44px tall) above a divider labeled
  "or sign in with email". The existing password form and demo account box stay as they are.
- Redirecting: the button shows `isLoading` and the password form is disabled.
- Unavailable (mocks on or not configured): button disabled, with helper text linked by
  `aria-describedby`.
- `oauth_failed`: danger `role="alert"` banner that receives focus and shows no provider detail.
  `unauthorized` / `signed_out`: `role="status"` banner. Unknown `reason` values show nothing.
- The mock-IdP note covers both paths and stays within the capability-matrix claim.

Approved decisions:

- Provider is chosen by a `NEXT_PUBLIC_OIDC_PROVIDER=google|fake` env flag (no new API surface).
- Provider button sits above the email form.
- Fake label: "Continue with Fake OIDC (demo)" with a neutral icon.
- Unavailable: disabled with helper text, not hidden.
- Google button follows Google sign-in branding (white button, official G mark).
- Redirecting also disables the password form.
- Note copy: "Demo identity. Google/Fake OIDC sign-in is a demo integration, not a production
  IdP. Email sign-in uses a mock identity provider."

## Out of Scope

- Redesigning the password form, MFA form, register, or password reset
- Account linking/unlinking UI, multiple providers
- Storing any token in the browser

## Acceptance Criteria

- [x] Live provider button starts the Nest flow; loading/disabled while redirecting
- [x] Complete route lands a Fake-provider user on `/dashboard` with the server role
- [x] Failure returns to `/login` with an accessible error; no provider detail shown
- [x] Password login and mock MFA still work (existing tests pass)
- [x] Reload with valid cookies but empty store recovers the session
- [x] Logout clears cookies and the store
- [x] Nothing written to `localStorage` contains a token
- [x] Tablet and mobile layouts; keyboard and screen-reader accessible
- [x] Capability registry and marketing matrix updated together

## Dependencies

- BE-017, FE-027 (shipped)
- Design approval on this task (Figma URL above once approved)

## Validation

- Vitest component/API-client tests
- Playwright live e2e against the Fake adapter (`e2e:live`)
- Browser check of `/login`, complete, failure, dashboard, logout

## Risks / Considerations

- Public copy must stay qualified; mock IdP remains a shipped coexisting path.
