---
id: identity-access
type: capability-module
name: Identity and access
area: identity-access
marketing_path: /login
status: partial
claim: "Mock IdP sessions and labeled mock MFA. Not production OAuth or production MFA."
related_tasks: [FE-010, BE-009, BE-014, SEC-001, FE-027, FE-028, SEC-006, DATA-003, BE-017, FE-033, BE-019]
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
    demo: Demo OIDC + PKCE (Google or Fake). Not a production IdP. Nest Authorization Code + PKCE issues the existing HttpOnly session; live /login provider button, /login/oauth/complete hydrates from GET /auth/session
    public: qualified
    related_tasks: [SEC-006, DATA-003, BE-017, FE-033]
  - id: identity-access.auth-rate-limiting
    name: Demo auth and sensitive-route rate limiting
    status: shipped
    demo: Nest limits login (per IP + email and per IP), MFA verify, refresh, OAuth start/callback, media-token, document download, and payments; 429 RATE_LIMITED with Retry-After; auth.rate_limited in security events. /login, mock MFA, and the OAuth landing announce "Too many attempts. Try again in N seconds." (FE-034). Not a WAF or production abuse protection
    public: qualified
    planned_next: Redis / edge limits later
    related_tasks: [SEC-007, DATA-004, BE-018, BE-019, FE-034]
---

# Identity and access

Mock IdP HTTP sessions for the demo. Nest issues HttpOnly cookies and still returns opaque bearer
JSON for machine clients. Live Next uses those cookies and does not persist access or refresh
tokens. Public copy may describe mock identity, labeled mock MFA, and demo OIDC + PKCE sign-in
(Google or Fake). It must not describe production OAuth, a production IdP, or production MFA.

Demo entry is existing `/login` ([FE-010](../tasks/frontend/FE-010-mock-authentication-ui.md)),
not a marketing `/sign-in` route.

| ID | Name | Status | Demo | Public |
| --- | --- | --- | --- | --- |
| `identity-access.mock-idp-sessions` | Sign in with mock identity | shipped | mock IdP sessions; Nest HttpOnly cookies | qualified |
| `identity-access.mfa-challenge` | MFA challenge | shipped | labeled mock MFA on live `/login` | qualified |
| `identity-access.oauth-oidc-pkce` | Demo OAuth 2.0 / OIDC + PKCE sign-in | shipped | Demo OIDC + PKCE (Google or Fake) on live `/login`; not a production IdP | qualified |
| `identity-access.auth-rate-limiting` | Demo auth and sensitive-route rate limiting | shipped | Nest 429 `RATE_LIMITED` on login, MFA, refresh, OAuth, media-token, document download, payments; `auth.rate_limited` security event; accessible "too many attempts" message on login, MFA, and OAuth landing | qualified |
