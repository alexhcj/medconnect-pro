# Security Architecture

## Status

Security is modeled as a portfolio-quality architecture, not a production compliance certification.

The canonical role catalog, permission strings, tenant-resolution steps, resource-authorization
rules, and session policy live in
[identity-and-access.md](../contracts/identity-and-access.md). This page summarizes boundaries only.

## Identity

**Implemented (demo):** mock IdP email/password, opaque bearer sessions **and** Nest HttpOnly
session cookies (`mcp_access` / `mcp_refresh`, optional `mcp_mfa`), refresh-token rotation,
idle/absolute expiry, mock MFA challenge, demo OIDC + PKCE (Google or Fake). See
[ADR-003](../decisions/ADR-003-authentication.md),
[ADR-014](../decisions/ADR-014-oidc-bff-and-external-identity.md), and
[BE-014](../tasks/backend/BE-014-httponly-cookie-session-http.md). Live Next uses those
cookies (`credentials: 'include'`) and does not persist access or refresh tokens
([FE-027](../tasks/frontend/FE-027-live-cookie-session-client.md)).

**Target, not implemented:**

- production OAuth / IdP (ADR-003)
- production MFA/TOTP or WebAuthn
- production cookie/BFF identity (NextAuth or an IdP-backed BFF)

Mock identity/session must not be described as production identity infrastructure.

## Authorization

```text
Identity
  ↓
Practice / tenant
  ↓
Role
  ↓
Permission
  ↓
Resource ownership / assignment
```

Frontend checks are UX controls only. Backend authorization is authoritative.

## Roles

- SUPER_ADMIN
- PRACTICE_ADMIN
- PROVIDER
- NURSE
- RECEPTIONIST
- PATIENT

Role scopes and default permission grants are defined in the identity contract.

## Tenant isolation

Every tenant-owned record should have `practice_id` or an equivalent server-resolved tenant
boundary.

Never trust a browser-supplied tenant ID for authorization.

Use:

- repository/service tenant scoping (implemented in `apps/api`);
- PostgreSQL RLS on tenant-owned business tables ([SEC-002](../tasks/security/SEC-002-tenant-isolation.md));
- a non-owner application database role (`medconnect_app`) so table owners cannot be the runtime role;
- tenant-aware indexes;
- tenant-aware cache keys when Redis exists;
- tenant-aware object-storage paths (`practices/{practiceId}/patients/{patientId}/{documentId}`
  on the local document adapter; the same prefix applies when S3 exists);
- cross-tenant authorization tests.

Resolution order and `SUPER_ADMIN` vs practice vs patient rules are in the identity contract.

## Audit

Audit sensitive actions such as:

- authentication events;
- denied access;
- patient record access;
- clinical changes;
- document access;
- appointment changes;
- telehealth session create, join, media-token mint, room delete, and end;
- billing changes;
- notification preference updates (no title or body in the audit row);
- administrative security changes.

## API protection

**Implemented (demo)** in M15 per [ADR-015](../decisions/ADR-015-rate-limiting-and-api-protection.md).
Not production DDoS protection, account lockout, or WAF.

- Opt-in per-route fixed-window rate limits (custom guard + `@RateLimit` decorator) on a
  PostgreSQL `rate_limit_buckets` store. No Redis.
- Client IP from `TRUST_PROXY` hop count (default `0`, `X-Forwarded-For` ignored).
- HMAC-hashed keys; no raw IP, email, or token stored or logged.
- 429 `RATE_LIMITED` + `Retry-After`; auth routes fail closed with 503 `RATE_LIMIT_UNAVAILABLE`.
- `auth.rate_limited` security event for resolvable known users only.
- API security headers (`nosniff`, `no-referrer`, frame denial, HSTS outside local) and
  `Cache-Control: no-store` on auth, OAuth, and media-token responses.

Edge/WAF rate rules remain M9 / production work.

## Encryption

Target infrastructure properties (not demonstrated in local Compose):

At rest:

- PostgreSQL encrypted storage (local Compose is unencrypted demo disk; hosted RDS uses
  AWS-managed encryption at rest, not a custom KMS key);
- S3 SSE-KMS;
- KMS-managed keys.

In transit:

- HTTPS/TLS;
- secure WebSockets;
- WebRTC DTLS/SRTP through the selected media architecture.

KMS manages keys; S3/PostgreSQL store data.

## Secrets

Secrets never belong in:

- Git;
- documentation;
- frontend bundles;
- mock data;
- Plane task descriptions.

Classification (public / environment-specific / secret) is
[environment-configuration.md](../contracts/environment-configuration.md). Current application
secrets are `DATABASE_URL`, `DATABASE_ADMIN_URL`, and optional `DAILY_API_KEY` (API-only; unset
uses the Fake Daily adapter), plus the optional API-only `OIDC_CLIENT_SECRET` for the demo OIDC
client ([ADR-014](../decisions/ADR-014-oidc-bff-and-external-identity.md); unset uses the Fake
OIDC adapter locally). Do not invent JWT or payment secrets that the application does not use.
Meeting tokens, provider OAuth tokens, `DAILY_API_KEY`, and `OIDC_CLIENT_SECRET` must not appear
in audit rows, logs, Git, or docs.

Use environment variables locally (`APP_ENV=local`). Hosted preview and production retrieve
`DATABASE_URL` and `DATABASE_ADMIN_URL` from AWS Secrets Manager JSON secrets
`medconnect/preview/api` and `medconnect/production/api` (distinct names; preview IAM cannot
read production). ECS injects those keys as process env
([INFRA-008](../tasks/infrastructure/INFRA-008-nestjs-api-container-and-ecs-fargate.md)).
Parameter Store is unused. GitHub Actions uses OIDC, not long-lived AWS access keys. Amplify
holds public `NEXT_PUBLIC_*` and server `API_BASE_URL` only — no database URLs and no Secrets
Manager ARNs. Preview
secrets and the preview/demo database must not be the production pair; production must not use
local Compose or preview credentials
([ADR-012](../decisions/ADR-012-deployment-topology.md)). Hosted RDS is private-subnet only;
runtime `DATABASE_URL` must be `medconnect_app` and must not equal `DATABASE_ADMIN_URL`.
First-init migrate/seed uses an SSM tunnel ([deploy.md](../workflows/deploy.md)). Routine hosted
migrate is an ECS `RunTask` from the production deploy workflow on `main`. Rotation:
[deploy.md](../workflows/deploy.md).
