---
id: BE-005
type: task
area: backend
feature: ehr
status: implemented
priority: high
estimate: 4
dependencies: [BE-003]
related_adrs: [ADR-001-modular-backend.md,ADR-002-tenant-isolation.md,ADR-010-postgresql-typeorm.md]
related_docs: [backend-architecture.md,../contracts/api-endpoints.md,../contracts/data-contracts.md,security-architecture.md]
plane:
  work_item_id: 9ee526a8-a52f-48e5-ad88-bf2b1d4a268a
  identifier: MEDCONNECT-14
---

# BE-005 — Clinical record API

## Objective

Implement the first FHIR R4-aligned clinical data boundary.

## Scope

Start with notes, diagnoses, vitals and medications.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [x] Clinical records persist
- [x] Provider/nurse permissions enforced
- [x] Tenant scope enforced
- [x] Audit events exist
- [x] FHIR alignment is explicitly bounded

## Implementation notes

Do not claim full FHIR compliance. Bounded mapping is in
[data-contracts.md](../../contracts/data-contracts.md).

Task “notes” map to **history entries** at `GET`/`POST /patients/:id/history` (visit, consultation,
or procedure events). Diagnoses map to `GET`/`POST /patients/:id/conditions`. History entries must
not bucket conditions, vitals, or medications. Narrative notes attached to an event are out of
scope. Documents stay unimplemented. Writes are `POST` only. Mutation audit reuses `audit_events`
without an audit HTTP viewer ([SEC-003](../security/SEC-003-audit-event-model.md)).

## Completion

- Implementation: NestJS EHR module with `GET`/`POST /patients/:id/history`, `/conditions`, `/vitals`, and `/medications`. Rows persist on `clinical_history`, `clinical_conditions`, `vitals`, and `medications` with `practice_id`. `write:medical_records` covers history/conditions/medications; `write:vitals` covers vitals. Assigned nurses write vitals only. Portal users GET their own records. Mutations write `audit_events` without clinical payloads. `synthetic` is always true. Frontend live clinical client stays on mocks. Documents are not implemented.
- Tests: Access and service units; HTTP tests for anonymous access, validation, provider create/list, nurse vitals vs medical-record denial, unassigned nurse not-found, receptionist/practice-admin denial, portal self-read, cross-tenant not-found, and client `practiceId` mismatch (`npm run test:api` with Compose Postgres). Tenant isolation covers vital repository scoping.
- PR:
- Notes: FHIR alignment is documented in data-contracts only (not a FHIR server). SEC-003 is not complete (no audit HTTP). PATCH/DELETE, documents, and frontend wiring stay out of scope. Audit repository moved to a shared `AuditModule` used by scheduling and EHR.
