# Data Architecture

## Primary store

PostgreSQL.

## Supporting stores

- Redis for cache/session/rate-limit/short-lived coordination where justified.
- S3 for documents and other objects.
- KMS for cryptographic key management.

## Tenant model

```text
Practice
 ├── Users
 ├── Providers
 ├── Patients
 ├── Appointments
 ├── Clinical Records
 ├── Documents
 └── Billing Data
```

Tenant-owned rows persist `practice_id` (FK to `practices`, `ON DELETE RESTRICT`) with tenant-aware
indexes. The NestJS API stores this in PostgreSQL via TypeORM migrations
([ADR-010](../decisions/ADR-010-postgresql-typeorm.md)). Repositories filter by server-resolved
tenant context; they must not trust client-supplied `practice_id`.

The current persistence slice includes `practices`, `users` (synthetic identity keys, no passwords),
`practice_memberships`, `auth_sessions` (opaque mock session hashes, not passwords), `patients`
(demographics, assigned provider, and optional portal user), `patient_assignments` for
assigned-patient reads, `appointments` (schedule, type, and state, with provider overlap exclusion),
and write-only `audit_events` for appointment mutations. Patient demographics HTTP is
[BE-003](../tasks/backend/BE-003-patient-api.md). Appointment HTTP is
[BE-004](../tasks/backend/BE-004-appointment-api.md). The structured audit viewer remains
[SEC-003](../tasks/security/SEC-003-audit-event-model.md).
PostgreSQL row-level security is deferred to
[SEC-002](../tasks/security/SEC-002-tenant-isolation.md).

## Clinical data

Use FHIR R4-aligned boundaries where useful.

Do not claim full FHIR compliance simply because a DTO resembles a FHIR resource.

Document exactly which resources and workflows are supported.

## Data lifecycle

Sensitive data requires:

- authorization;
- auditability;
- retention policy;
- deletion/archival rules where appropriate;
- backup/restore strategy.

## Synthetic demo data

All fixtures are fictional and must not resemble identifiable real patients.
