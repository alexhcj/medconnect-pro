---
id: BE-004
type: task
area: backend
feature: scheduling
status: implemented
priority: high
estimate: 3
dependencies: [BE-001,DATA-001,BE-003,BE-009]
related_adrs: [ADR-002-tenant-isolation.md]
related_docs: [backend-architecture.md,../contracts/api-endpoints.md]
plane:
  work_item_id: 587128bc-5dbe-4087-ac7b-05f838664bb9
  identifier: MEDCONNECT-13
---

# BE-004 — Appointment API

## Objective

Implement appointment CRUD, availability and conflict detection.

## Scope

Provider schedules, availability and appointment state.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [x] CRUD works
- [x] Availability works
- [x] Conflicts rejected
- [x] Tenant scope enforced
- [x] Audit events emitted where applicable

## Implementation notes

Conflict detection must be server-side.

Do not start authorization acceptance criteria until [BE-009](BE-009-identity-and-access-http.md)
ships. Frontend appointment mocks (FE-005, FE-006) stay on mocks until a later connect task.

## Completion

- Implementation: NestJS scheduling module with `GET`/`POST /appointments`, `GET`/`PATCH`/`DELETE /appointments/:id`, and `GET /providers/:id/availability`. Appointments persist with tenant scope and a provider overlap exclusion constraint. Availability uses demo Monday–Friday 09:00–17:00 UTC. Mutations write `audit_events` without notes. `synthetic` is always true. Frontend live client still 404s appointments.
- Tests: Overlap, access, availability, and service units; HTTP tests for anonymous access, receptionist CRUD, provider conflict (including cancelled reuse and concurrent insert), nurse/patient write denial, assigned/portal read scope, cross-tenant not-found, and client `practiceId` mismatch (`npm run test:api` with Compose Postgres).
- PR:
- Notes: No `read:appointments` catalog string; reads use `write:appointments`, `read:assigned_patients`, or `read:own_patient`. SEC-003 is not complete (no audit HTTP). Waitlist, reminders, and frontend wiring stay out of scope.
