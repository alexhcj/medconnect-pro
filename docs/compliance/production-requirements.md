# Production requirements (remaining)

What would still be required to treat this as production identity and operations. The demo is
**not** HIPAA certified and **not** production OAuth.

Cookie sessions, labeled mock MFA, and security-events are **demo surfaces**
([authentication-and-session.md](../security/authentication-and-session.md)). They do not close
this list.

Do not duplicate the deploy runbook ([deploy.md](../workflows/deploy.md)) or the permission
catalog. Non-security product gaps (live video, hosted payments) stay on
[post-mvp-baseline.md](../roadmap/post-mvp-baseline.md).

## Remaining

| Gap | Notes |
| --- | --- |
| OAuth 2.0 / OIDC + PKCE | Target in [ADR-003](../decisions/ADR-003-authentication.md). Catalog `identity-access.oauth-oidc-pkce` is planned. |
| Hosted / production MFA | TOTP or WebAuthn. Labeled mock MFA on `/login` is not this. |
| Rate limiting | Named in [security-review.md](../workflows/security-review.md); not implemented as an API control. |
| Organizational BAAs and policies | Out of this demo. Do not invent vendor BAAs. See [hipaa-readiness.md](hipaa-readiness.md). |
| Monitoring / observability | Infrastructure target; not a live demo platform service. |
| M9 hosted first-apply | [INFRA-014](../tasks/infrastructure/INFRA-014-aws-account-setup-and-hosted-first-apply.md) pending; blocks [INFRA-013](../tasks/infrastructure/INFRA-013-v1.0.0-production-release-readiness.md). M9 is paused. |
| Redis / custom KMS hierarchy | Intentionally incomplete on the post-MVP baseline. |

Public claims: [capability-matrix.md](../marketing/capability-matrix.md).
