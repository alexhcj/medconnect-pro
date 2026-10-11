# HIPAA readiness (not certified)

Healthcare-oriented and HIPAA-oriented describe demonstrated engineering patterns. The demo is
**not** HIPAA certified, HIPAA compliant, or suitable for real patient data. Identity is **not**
production OAuth.

Catalog: `security.hipaa-certification` is **out_of_scope**
([product/security.md](../product/security.md)). Public copy must not exceed
[capability-matrix.md](../marketing/capability-matrix.md).

This page does **not** invent vendor BAAs, a compliance program, or a formal assessment.

## Implemented patterns (demo)

Engineering patterns in the repository. They are not a certification claim.

| Pattern | Where it is defined |
| --- | --- |
| Server-side RBAC | [identity-and-access.md](../contracts/identity-and-access.md), `security.rbac` |
| Tenant isolation including PostgreSQL RLS | [security-architecture.md](../architecture/security-architecture.md), `security.tenant-isolation` |
| Audit events | `security.audit-logging` |
| Document ACL | `security.document-acl` |
| Demo HttpOnly cookies, labeled mock MFA | [authentication-and-session.md](../security/authentication-and-session.md) |
| Tenant-scoped security-events (`auth.*`) | `administration.security-events-http` |

Synthetic data only ([ADR-005](../decisions/ADR-005-synthetic-demo-data.md)). Never introduce real
PHI.

## Demo retention

This is not a covered-entity retention schedule and not a HIPAA compliance claim.

- All persisted rows are synthetic demo data.
- Demo removal is a seed reset. There is no right-to-be-forgotten HTTP API.
- There is no `DELETE /patients/{id}`. Generated OpenAPI forbids that route.

## Deferred (not this demo)

Recorded so later work does not treat them as silent gaps. M17 does not implement them:

- OAuth unlink
- Zod `.strict()` on write schemas that are still plain objects (patient, clinical, appointment,
  auth, telehealth, documents). Billing, notifications, and role assignment are already strict.
- Role-assignment rate limit
- Payment idempotency
- CI SAST
- Patient-list and billing GET audit
- Playwright role matrix (authorization regression stays Nest HTTP)
- Idle keep-alive (do not add one; idle timeout stays 15 minutes)

## Not certified / not in this demo

- HIPAA certification, compliance attestation, or suitability for real patient data
- Organizational BAAs, privacy policies as a covered entity, or a full compliance program
- Production OAuth 2.0 / OIDC + PKCE or production MFA
- SIEM, HIPAA audit export, or session-policy editor (security-events is a demo list)

Remaining production work: [production-requirements.md](production-requirements.md).
