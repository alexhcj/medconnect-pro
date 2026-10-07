# Authentication and session (demo)

Demo identity and session surfaces after M11. This is **not** production OAuth and **not** a
HIPAA-certified control. Session policy detail lives in
[identity-and-access.md](../contracts/identity-and-access.md). Architecture summary:
[security-architecture.md](../architecture/security-architecture.md). Product claims:
[identity-access.md](../product/identity-access.md).

Healthcare-oriented and HIPAA-oriented describe demonstrated engineering patterns. The demo is
**not** HIPAA certified, HIPAA compliant, or suitable for real patient data.

## Implemented (demo)

| Surface | What it is | What it is not |
| --- | --- | --- |
| Mock IdP | Email/password against synthetic accounts ([BE-009](../tasks/backend/BE-009-identity-and-access-http.md), [FE-010](../tasks/frontend/FE-010-mock-authentication-ui.md)) | Production identity provider |
| HttpOnly cookies | Nest `mcp_access` / `mcp_refresh` / `mcp_mfa` ([BE-014](../tasks/backend/BE-014-httponly-cookie-session-http.md)). Live Next uses cookies and does not persist tokens ([FE-027](../tasks/frontend/FE-027-live-cookie-session-client.md)) | OIDC + PKCE, NextAuth, or an IdP-backed BFF |
| Opaque bearer JSON | Still returned for machine clients, Postman, and smoke tests | Production OAuth access tokens |
| Labeled mock MFA | Challenge on live `/login` when Nest returns `mfaRequired` ([FE-028](../tasks/frontend/FE-028-mock-mfa-challenge-ui.md)) | Production TOTP or WebAuthn |
| Security-events | Tenant-scoped `auth.*` rows (`GET /admin/security-events` + administration viewer; [BE-015](../tasks/backend/BE-015-security-events-http.md), [FE-029](../tasks/frontend/FE-029-security-events-ui.md)) | SIEM, HIPAA audit export, or session-policy editor |

Mock-mode `localStorage` is still not the cookie model.

## Target (not implemented)

[ADR-003](../decisions/ADR-003-authentication.md): OAuth 2.0 + OpenID Connect with Authorization
Code + PKCE, and production MFA. Catalog row
`identity-access.oauth-oidc-pkce` is **planned**.

Remaining production list: [production-requirements.md](../compliance/production-requirements.md).
