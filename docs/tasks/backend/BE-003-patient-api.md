---
id: BE-003
type: task
area: backend
feature: patient-management
status: implemented
priority: high
estimate: 4
dependencies: [BE-001, DATA-001, BE-009]
related_adrs: [ADR-002-tenant-isolation.md]
related_docs: [backend-architecture.md,../contracts/api-endpoints.md,../contracts/data-contracts.md]
plane:
  work_item_id: 81cc51a8-20ac-4dd4-afc6-a80a41ee3b1e
  identifier: MEDCONNECT-12
---

# BE-003 — Patient API

## Objective

Implement patient endpoints with validation, authorization and tenant scope.

## Scope

CRUD/search/filter/pagination plus authorized profile access.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [x] CRUD endpoints exist
- [x] DTO validation exists
- [x] Tenant scope enforced
- [x] Role/resource authorization enforced
- [x] OpenAPI documented
- [x] Tests cover denied access

## Implementation notes

Never trust browser-supplied practice_id.

Do not start authorization acceptance criteria until [BE-009](BE-009-identity-and-access-http.md)
ships. Frontend patient mocks (FE-002+) may proceed after FE-010.

## Completion

- Implementation: NestJS patient module with `GET`/`POST /patients` and `GET`/`PATCH /patients/:id`. Demographics persist on `patients`. `patient_assignments` limits `read:assigned_patients`. `portal_user_id` limits `read:own_patient`. `synthetic` is always true. No delete route and no clinical subresources.
- Tests: Role policy and service units; HTTP tests for anonymous access, validation, receptionist create/filter/update, provider write denial, unassigned nurse, portal self-scope, cross-tenant not-found, and client `practiceId` mismatch (`npm run test:api` with Compose Postgres).
- PR:
- Notes: Frontend patient UI remains on mocks. Nurse assignment has no admin HTTP API. Full role matrix remains QA-004. DELETE is not in the endpoint index.
