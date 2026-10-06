---
id: identity-access
type: capability-module
name: Identity and access
area: identity-access
marketing_path: /login
status: partial
claim: "Mock IdP sessions. Labeled mock identity, not production OAuth."
related_tasks: [FE-010, BE-009, BE-014, SEC-001, FE-027, FE-028]
related_docs:
  - ../01-product-requirements.md
  - ../marketing/capability-matrix.md
  - ../roadmap/post-mvp-baseline.md
  - ../decisions/ADR-003-authentication.md
  - ../contracts/identity-and-access.md
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
    status: partial
    demo: challenge exists; not completed in the live UI
    public: no
    planned_next: production MFA
    related_tasks: [SEC-001, FE-028]
  - id: identity-access.oauth-oidc-pkce
    name: Production OAuth 2.0 / OIDC + PKCE
    status: planned
    demo: not in the demo
    public: no
    related_tasks: []
---

# Identity and access

Mock IdP HTTP sessions for the demo. Nest issues HttpOnly cookies and still returns opaque bearer
JSON for machine clients. Live Next uses those cookies and does not persist access or refresh
tokens. Public copy may describe mock identity. It must not describe production OAuth, OIDC, or completed MFA.

Demo entry is existing `/login` ([FE-010](../tasks/frontend/FE-010-mock-authentication-ui.md)),
not a marketing `/sign-in` route.

| ID | Name | Status | Demo | Public |
| --- | --- | --- | --- | --- |
| `identity-access.mock-idp-sessions` | Sign in with mock identity | shipped | mock IdP sessions; Nest HttpOnly cookies | qualified |
| `identity-access.mfa-challenge` | MFA challenge | partial | not completed in live UI | no |
| `identity-access.oauth-oidc-pkce` | Production OAuth 2.0 / OIDC + PKCE | planned | not in the demo | no |
