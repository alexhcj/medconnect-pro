# Security (demo vs production)

Interviewer index for what MedConnect Pro **demonstrates** versus what remains a production or
HIPAA-oriented gap. This folder does **not** replace the permission catalog, RLS policies, or
deploy runbook.

Healthcare-oriented and HIPAA-oriented describe demonstrated engineering patterns. The demo is
**not** HIPAA certified, HIPAA compliant, or suitable for real patient data. Identity is a mock
IdP with demo cookies and labeled mock MFA. It is **not** production OAuth 2.0 / OIDC + PKCE.

## In this folder

- [authentication-and-session.md](authentication-and-session.md) — mock IdP and HttpOnly cookies
  vs OIDC+PKCE; mock MFA vs production MFA; security-events as a demo surface.

## Compliance gap

- [hipaa-readiness.md](../compliance/hipaa-readiness.md) — implemented patterns vs not certified.
- [production-requirements.md](../compliance/production-requirements.md) — remaining production
  list (production IdP, hosted MFA, production/edge rate limits, BAAs/policies, monitoring,
  M9 hosting). Demo Nest rate limits are M15, not this remaining list.

## Canonical sources (do not duplicate here)

- [ADR-003](../decisions/ADR-003-authentication.md) — target OAuth 2.0 / OIDC + PKCE.
- [identity-and-access.md](../contracts/identity-and-access.md) — roles, permissions, session
  policy.
- [security-architecture.md](../architecture/security-architecture.md) — boundaries only.
- [product/security.md](../product/security.md) and
  [product/identity-access.md](../product/identity-access.md) — statused claims.
- Public-claim ceiling: [capability-matrix.md](../marketing/capability-matrix.md).
