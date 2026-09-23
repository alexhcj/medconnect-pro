---
id: FE-011
type: task
area: frontend
feature: patient-management
status: planned
priority: high
estimate: 3
dependencies: [FE-004, BE-003, BE-009]
related_adrs: [ADR-003-authentication.md]
related_docs: [frontend-architecture.md,../contracts/api-endpoints.md,../contracts/data-contracts.md,../tasks/backend/BE-003-patient-api.md,../tasks/backend/BE-009-identity-and-access-http.md]
plane:
  work_item_id:
  identifier:
---

# FE-011 — Patient UI on the Nest patient API

## Objective

Connect the existing patient list, profile, and create/edit UI to the Nest patient API when mocks are off.

## Scope

Demographics list, profile, create, and edit against [BE-003](../backend/BE-003-patient-api.md), authenticated with the [BE-009](../backend/BE-009-identity-and-access-http.md) bearer session. Enough synthetic patients that the live list is demonstrable. One non-mock browser check for list plus create or edit.

History, vitals, medications, and documents stay on mocks or stay hidden in live mode. Those routes are not implemented.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.
- Do not reopen FE-002, FE-003, FE-004, or QA-002. Existing Playwright specs stay on `NEXT_PUBLIC_USE_MOCKS=true`.

## Acceptance criteria

- [ ] With mocks off, list, profile, create, and edit call the Nest patient API using the BE-009 session
- [ ] `PatientRdo` maps onto the UI patient type
- [ ] History, vitals, medications, and documents are not requested from Nest
- [ ] A synthetic seed or create path makes the live list demonstrable
- [ ] One non-mock browser check covers list plus create or edit

## Implementation notes

`medicalRealAPI` currently calls Next paths such as `/api/patients`. Nest serves `GET`/`POST /patients` and `GET`/`PATCH /patients/:id` with no global prefix. Login is still the FE-010 local mock session; Nest expects the bearer from `POST /auth/login`. `npm run seed:mock-identity` seeds the practice admin only.

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
