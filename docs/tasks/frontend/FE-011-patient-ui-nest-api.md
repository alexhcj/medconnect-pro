---
id: FE-011
type: task
area: frontend
feature: patient-management
status: implemented
priority: high
estimate: 3
dependencies: [FE-004, BE-003, BE-009]
related_adrs: [ADR-003-authentication.md]
related_docs: [frontend-architecture.md,../contracts/api-endpoints.md,../contracts/data-contracts.md,../tasks/backend/BE-003-patient-api.md,../tasks/backend/BE-009-identity-and-access-http.md]
plane:
  work_item_id:7d11b6e1-2399-4396-80c0-c44ae7b7e153
  identifier:MEDCONNECT-41
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

- [x] With mocks off, list, profile, create, and edit call the Nest patient API using the BE-009 session
- [x] `PatientRdo` maps onto the UI patient type
- [x] History, vitals, medications, and documents are not requested from Nest
- [x] A synthetic seed or create path makes the live list demonstrable
- [x] One non-mock browser check covers list plus create or edit

## Implementation notes

With mocks off, the browser calls Nest at `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:3001`). Login stores the opaque bearer from `POST /auth/login`. List, profile, create, and edit use `/patients`. Clinical sections stay hidden. `npm run seed:mock-identity` also inserts provider `11111111-1111-4111-8111-111111111111` and synthetic patients. The live provider dropdown uses that id. It is not a Nest providers route.

## Completion

- Implementation: Live patient demographics UI on the Nest patient API with the BE-009 bearer session. Mock Playwright specs stay on `NEXT_PUBLIC_USE_MOCKS=true`.
- Tests: Vitest covers bearer session persistence, `PatientRdo` mapping, and clinical methods that do not call `fetch`. `npm run e2e:live` covers list plus create with the API and seed already running.
- PR:
- Notes: The dashboard `SessionInfo` role is UI gating for the labeled practice admin. Nest still authorizes from the membership. A Next route `401` does not clear that session; a Nest `401` does.
