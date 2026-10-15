---
id: identity-access
type: capability-module
name: Identity and access
area: identity-access
marketing_path: /login
status: partial
claim: "Mock IdP sessions and labeled mock MFA. Not production OAuth or production MFA."
related_tasks: [FE-010, BE-009, BE-014, SEC-001, FE-027, FE-028, SEC-006, DATA-003, BE-017, FE-033, SEC-007, DATA-004, BE-018, BE-019, BE-020, FE-034, SEC-009, BE-023, FE-036, DATA-005, FE-037, FE-039]
related_docs:
  - ../01-product-requirements.md
  - ../marketing/capability-matrix.md
  - ../roadmap/post-mvp-baseline.md
  - ../decisions/ADR-003-authentication.md
  - ../contracts/identity-and-access.md
  - ../security/authentication-and-session.md
  - ../compliance/production-requirements.md
capabilities:
  - id: identity-access.mock-idp-sessions
    name: Sign in with mock identity
    status: shipped
    demo: mock IdP login/logout; Nest issues HttpOnly cookies and still returns opaque bearer JSON for machine clients; live Next uses cookies and does not persist tokens
    public: qualified
    planned_next: OAuth 2.0 / OIDC + PKCE (ADR-003)
    related_tasks: [FE-010, BE-009, BE-014, SEC-001, FE-027]
  - id: identity-access.mfa-challenge
    name: MFA challenge
    status: shipped
    demo: labeled mock MFA on live /login after Nest mfaRequired; not production TOTP or WebAuthn
    public: qualified
    planned_next: production MFA
    related_tasks: [SEC-001, FE-028]
  - id: identity-access.oauth-oidc-pkce
    name: Demo OAuth 2.0 / OIDC + PKCE sign-in
    status: shipped
    demo: Demo OIDC + PKCE (Google or Fake). Not a production IdP. Nest Authorization Code + PKCE issues the existing HttpOnly session; live /login provider button, /login/oauth/complete hydrates from GET /auth/session. The public Render demo currently offers Fake and the preview API rejects it.
    public: qualified
    planned_next: FE-039 hides the provider button on the public demo until OAuth is configured. Real Google credentials stay later.
    related_tasks: [SEC-006, DATA-003, BE-017, FE-033, FE-039]
  - id: identity-access.auth-rate-limiting
    name: Demo auth and sensitive-route rate limiting
    status: shipped
    demo: Nest limits login (per IP + email, per IP, and account-wide failures), MFA verify, refresh, OAuth start/callback, telehealth create/join/media-token, document download, and payments; 429 RATE_LIMITED with Retry-After; auth.rate_limited in security events. /login and mock MFA announce "Too many attempts. Try again in N seconds."; the OAuth landing announces "Too many attempts. Try again later." (FE-034). Not a WAF or production abuse protection
    public: qualified
    planned_next: Redis / edge limits later
    related_tasks: [SEC-007, DATA-004, BE-018, BE-019, FE-034]
  - id: identity-access.concurrent-sessions
    name: Concurrent session review
    status: shipped
    demo: Live dialog lists Nest sessions and revokes other sessions without signing out. Live rows omit IP, location, and browser. Mock fixtures may show labeled demo location and IP. Not a session-policy editor, IP/geo oracle, or production session manager
    public: qualified
    related_tasks: [SEC-009, BE-023, FE-036]
  - id: identity-access.patient-demo-sign-in
    name: Patient demo sign-in
    status: planned
    demo: not in the demo
    public: no
    planned_next: one synthetic PATIENT linked to Avery Quinn
    related_tasks: [DATA-005]
  - id: identity-access.demo-account-panel
    name: Demo account panel
    status: planned
    demo: not in the demo; login currently prints two accounts as plain text
    public: no
    planned_next: demo-only panel with role labels, copy actions, and the MFA code
    related_tasks: [FE-037, DATA-005]
---

# Identity and access

Mock IdP HTTP sessions for the demo. Nest issues HttpOnly cookies and still returns opaque bearer
JSON for machine clients. Live Next uses those cookies and does not persist access or refresh
tokens. Public copy may describe mock identity, labeled mock MFA, demo OIDC + PKCE sign-in
(Google or Fake) where that adapter is actually configured, and demo concurrent-session review.
The public Render demo does not complete Google or Fake sign-in. Patient demo sign-in and the
demo account panel are planned (M18) and are not in the demo yet. Do not describe production
OAuth, a production IdP, production MFA, or a production session manager.

Demo entry is existing `/login` ([FE-010](../tasks/frontend/FE-010-mock-authentication-ui.md)),
not a marketing `/sign-in` route.

| ID | Name | Status | Demo | Public |
| --- | --- | --- | --- | --- |
| `identity-access.mock-idp-sessions` | Sign in with mock identity | shipped | mock IdP sessions; Nest HttpOnly cookies | qualified |
| `identity-access.mfa-challenge` | MFA challenge | shipped | labeled mock MFA on live `/login` | qualified |
| `identity-access.oauth-oidc-pkce` | Demo OAuth 2.0 / OIDC + PKCE sign-in | shipped | Demo OIDC + PKCE (Google or Fake) on live `/login`; not a production IdP | qualified |
| `identity-access.auth-rate-limiting` | Demo auth and sensitive-route rate limiting | shipped | Nest 429 `RATE_LIMITED` on login (including account-wide failures), MFA, refresh, OAuth, telehealth create/join/media-token, document download, payments; `auth.rate_limited` security event; "too many attempts" on login and MFA (with N seconds when known) and on the OAuth landing ("later") | qualified |
| `identity-access.concurrent-sessions` | Concurrent session review | shipped | Live dialog lists and revokes other Nest sessions; live rows omit IP and location; mock location and IP stay labeled demo data; not a session-policy editor or production session manager | qualified |
| `identity-access.patient-demo-sign-in` | Patient demo sign-in | planned | not in the demo | no |
| `identity-access.demo-account-panel` | Demo account panel | planned | not in the demo | no |
