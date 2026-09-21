# Security Architecture

## Status

Security is modeled as a portfolio-quality architecture, not a production compliance certification.

The canonical role catalog, permission strings, tenant-resolution steps, resource-authorization
rules, and session policy live in
[identity-and-access.md](../contracts/identity-and-access.md). This page summarizes boundaries only.

## Identity

- OAuth 2.0
- OpenID Connect
- Authorization Code + PKCE
- MFA/TOTP
- access-token lifecycle
- refresh-token rotation
- secure session handling

Mock identity/session is allowed for the demo and must not be described as production identity
infrastructure. See [ADR-003](../decisions/ADR-003-authentication.md).

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
- PostgreSQL RLS where appropriate ([SEC-002](../tasks/security/SEC-002-tenant-isolation.md));
- tenant-aware indexes;
- tenant-aware cache keys;
- tenant-aware object-storage paths;
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
- billing changes;
- administrative security changes.

## Encryption

At rest:

- PostgreSQL encrypted storage;
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

Use environment variables locally and AWS Secrets Manager/Parameter Store in the planned cloud
environment.
