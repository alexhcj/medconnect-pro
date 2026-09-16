---
id: FE-002
type: task
area: frontend
feature: patient-management
status: planned
priority: high
estimate: 2
dependencies: [FE-001]
related_adrs: []
related_docs: [frontend-architecture.md,../01-product-requirements.md,../contracts/api-endpoints.md]
plane:
  work_item_id: null
  identifier: null
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

- [ ] List renders
- [ ] Search works
- [ ] Filters work
- [ ] Pagination/infinite loading works
- [ ] Loading/empty/error states exist
- [ ] Accessible on tablet

## Implementation notes

Patient data must be synthetic.

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
