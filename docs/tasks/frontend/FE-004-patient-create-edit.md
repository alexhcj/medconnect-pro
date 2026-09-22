---
id: FE-004
type: task
area: frontend
feature: patient-management
status: planned
priority: high
estimate: 2
dependencies: [FE-003]
related_adrs: []
related_docs: [frontend-architecture.md,../contracts/data-contracts.md]
plane:
  work_item_id: 03ef2931-641a-4abe-b62c-497ce6b1dd34
  identifier: MEDCONNECT-23
---

# FE-004 — Patient create/edit

## Objective

Implement patient create/edit forms.

## Scope

React Hook Form + Zod; accessible validation and error handling.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [ ] Create form works
- [ ] Edit form works
- [ ] Validation works
- [ ] Server errors are represented
- [ ] Accessible field errors exist

## Implementation notes

Client validation is not the authorization layer.

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
