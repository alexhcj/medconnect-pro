---
id: FE-002
type: task
area: frontend
feature: patient-management
status: implemented
priority: high
estimate: 2
dependencies: [FE-001, FE-010]
related_adrs: []
related_docs: [frontend-architecture.md,../01-product-requirements.md,../contracts/api-endpoints.md]
plane:
  work_item_id: 0ab91d9c-8b6d-4b95-910b-61ced17eebb6
  identifier: MEDCONNECT-21
---

# FE-002 — Patient list

## Objective

Implement searchable, filterable patient list UI.

## Scope

Use TanStack Query and the API data layer; mock mode may supply synthetic data.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [x] List renders
- [x] Search works
- [x] Filters work
- [x] Pagination/infinite loading works
- [x] Loading/empty/error states exist
- [x] Accessible on tablet

## Implementation notes

Patient data must be synthetic.

## Completion

- Implementation: Patients route uses `usePatientSearch` over synthetic fixtures, with search, status filter, last-name sort, and load more.
- Tests: Vitest for mock paging/filter/sort; RTL for list states; Playwright tablet flow for search, filter, sort, and load more.
- PR:
- Notes: Mock list is not tenant-scoped. Practice and assigned-patient enforcement remain BE-003. Profile and create/edit stay FE-003 and FE-004.
