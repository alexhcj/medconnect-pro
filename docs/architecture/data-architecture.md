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
 ├── Telehealth Sessions
 ├── Clinical Records
 ├── Documents
 ├── Billing Data
 └── Notifications
```

Tenant-owned rows persist `practice_id` (FK to `practices`, `ON DELETE RESTRICT`) with tenant-aware
indexes. The NestJS API stores this in PostgreSQL via TypeORM migrations
([ADR-010](../decisions/ADR-010-postgresql-typeorm.md)). Repositories filter by server-resolved
tenant context; they must not trust client-supplied `practice_id`.

The current persistence slice includes `practices`, `users` (synthetic identity keys, no passwords),
`practice_memberships`, `auth_sessions` (opaque mock session hashes, not passwords), `patients`
(demographics, assigned provider, and optional portal user), `patient_assignments` for
assigned-patient reads, `appointments` (schedule, type, and state, with provider overlap exclusion),
`telehealth_sessions` (one application session per telehealth appointment, with waiting/in-session/ended
state and join timestamps), `clinical_history`, `clinical_conditions`, `vitals`, and `medications`
(tenant-owned clinical collections keyed by `practice_id` and `patient_id`), `invoices`,
`invoice_line_items`, and `payments` (tenant-owned billing rows keyed by `practice_id` and
`patient_id` / `invoice_id`; payments store a synthetic processor reference, never card or bank
account numbers), `patient_documents` (tenant-owned file metadata keyed by `practice_id` and
`patient_id`; bytes live in an object store, not in PostgreSQL), `notifications` and
`notification_preferences` (tenant-owned in-app inbox and channel flags keyed by `practice_id`
and recipient/user; email/SMS ledger rows are not a live carrier), and `audit_events` (actor,
tenant, action, resource type/id, correlation; no payload). Authentication, authenticated denials, patient
access/mutations, appointment mutations, clinical creates, telehealth session create/join/end,
billing invoice create and payment records, document list/upload/download, and notification
preference updates write rows. Restricted HTTP list is
[SEC-003](../tasks/security/SEC-003-audit-event-model.md) (`GET /admin/audit-events`,
`admin:practice`). Practice user directory HTTP is
[BE-010](../tasks/backend/BE-010-practice-user-directory-api.md) (`GET /admin/users`,
`admin:users`). The administration UI is
[FE-009](../tasks/frontend/FE-009-administration-security-ui.md) (mocks) plus
[FE-016](../tasks/frontend/FE-016-administration-ui-nest-api.md) (live Nest). Patient
demographics HTTP is [BE-003](../tasks/backend/BE-003-patient-api.md). Appointment HTTP is
[BE-004](../tasks/backend/BE-004-appointment-api.md). Clinical HTTP is
[BE-005](../tasks/backend/BE-005-clinical-record-api.md). Telehealth session HTTP is
[BE-006](../tasks/backend/BE-006-telehealth-session-api.md). Billing HTTP is
[BE-007](../tasks/backend/BE-007-billing-api.md). Document HTTP is
[SEC-004](../tasks/security/SEC-004-document-access-control.md). Notification HTTP is
[BE-008](../tasks/backend/BE-008-notification-domain.md).
PostgreSQL row-level security is enabled on tenant-owned business tables
([SEC-002](../tasks/security/SEC-002-tenant-isolation.md)). Policies compare `practice_id` (or
`practices.id`) to the server-set GUC `app.current_practice_id`. Identity-resolution tables
(`users`, `auth_sessions`, `practice_memberships`) have no RLS so login can derive tenant
before that GUC is set. The Nest runtime connects as non-owner role `medconnect_app`;
migrations, seed, and test fixtures use table-owner `DATABASE_ADMIN_URL`. Cache keys remain
future work until Redis exists. Document objects use tenant-prefixed paths
(`practices/{practiceId}/patients/{patientId}/{documentId}`) on a local filesystem adapter
until S3 SSE-KMS is available.

## Clinical data

Use FHIR R4-aligned boundaries where useful.

Do not claim full FHIR compliance simply because a DTO resembles a FHIR resource.

Document exactly which resources and workflows are supported. The bounded mapping for history
entries, conditions, vitals, and medications lives in
[data-contracts.md](../contracts/data-contracts.md). History entries are longitudinal events
(visit, consultation, procedure) and are not a bucket for other clinical entities. Clinical columns
do not belong on `patients`.

## Data lifecycle

Sensitive data requires:

- authorization;
- auditability;
- retention policy;
- deletion/archival rules where appropriate;
- backup/restore strategy.

## Environment databases

Three named PostgreSQL instances, all synthetic/demo only ([ADR-005](../decisions/ADR-005-synthetic-demo-data.md),
[ADR-012](../decisions/ADR-012-deployment-topology.md)):

- **local** — Docker Compose database `medconnect` (current).
- **preview/demo** — isolated hosted RDS instance for the shared preview API
  ([INFRA-007](../tasks/infrastructure/INFRA-007-preview-and-production-demo-databases.md)).
- **production/demo** — isolated hosted RDS instance for production
  ([INFRA-007](../tasks/infrastructure/INFRA-007-preview-and-production-demo-databases.md)).

They must never contain real PHI. Preview must not point at the production database; production
must not point at preview or local URLs. Hosted boot fails closed on missing or Compose
`DATABASE_*` URLs ([environment-configuration.md](../contracts/environment-configuration.md)).

## Synthetic demo data

All fixtures are fictional and must not resemble identifiable real patients. Never introduce real
PHI into local, preview/demo, or production/demo databases.
