---
id: identity-access
type: capability-module
name: Identity and access
area: identity-access
marketing_path: /login
status: partial
claim: "Mock IdP sessions and labeled mock MFA. Not production OAuth or production MFA."
related_tasks: [FE-010, BE-009, BE-014, SEC-001, FE-027, FE-028, SEC-006, DATA-003, BE-017, FE-033]
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
    name: Production OAuth 2.0 / OIDC + PKCE
    status: partial
    demo: Nest demo OIDC Authorization Code + PKCE (Google + local Fake adapter) issues the existing HttpOnly session; no login UI yet (FE-033); not production OAuth
    public: no
    related_tasks: [SEC-006, DATA-003, BE-017, FE-033]
---

# Identity and access

Mock IdP HTTP sessions for the demo. Nest issues HttpOnly cookies and still returns opaque bearer
JSON for machine clients. Live Next uses those cookies and does not persist access or refresh
tokens. Public copy may describe mock identity and labeled mock MFA. It must not describe
production OAuth, OIDC, or production MFA.

Demo entry is existing `/login` ([FE-010](../tasks/frontend/FE-010-mock-authentication-ui.md)),
not a marketing `/sign-in` route.

| ID | Name | Status | Demo | Public |
| --- | --- | --- | --- | --- |
| `identity-access.mock-idp-sessions` | Sign in with mock identity | shipped | mock IdP sessions; Nest HttpOnly cookies | qualified |
| `identity-access.mfa-challenge` | MFA challenge | shipped | labeled mock MFA on live `/login` | qualified |
| `identity-access.oauth-oidc-pkce` | Production OAuth 2.0 / OIDC + PKCE | partial | Nest demo OIDC routes (BE-017); login UI pending (FE-033) | no |
