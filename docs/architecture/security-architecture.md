# Security Architecture

## Status

Security is modeled as a portfolio-quality architecture, not a production compliance certification.

## Identity

- OAuth 2.0
- OpenID Connect
- Authorization Code + PKCE
- MFA/TOTP
- access-token lifecycle
- refresh-token rotation
- secure session handling

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

## Tenant isolation

Every tenant-owned record should have `practice_id` or an equivalent server-resolved tenant
boundary.

Never trust a browser-supplied tenant ID for authorization.

Use:

- repository/service tenant scoping;
- PostgreSQL RLS where appropriate;
- tenant-aware indexes;
- tenant-aware cache keys;
- tenant-aware object-storage paths;
- cross-tenant authorization tests.

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
