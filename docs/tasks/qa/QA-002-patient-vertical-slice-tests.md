---
id: QA-002
type: task
area: qa
feature: patient-management
status: planned
priority: high
estimate: 2
dependencies: [FE-002,BE-003,QA-001]
related_adrs: [ADR-002-tenant-isolation.md]
related_docs: [../01-product-requirements.md,../contracts/api-endpoints.md]
plane:
  work_item_id: 4194b9ed-7bd1-4580-b113-0a962b1c4ab0
  identifier: MEDCONNECT-34
---

# QA-002 — Patient vertical-slice tests

## Objective

Validate the patient workflow end-to-end.

## Scope

List, profile, create/edit and authorization.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [ ] Patient list test
- [ ] Create patient test
- [ ] Edit patient test
- [ ] Unauthorized access test
- [ ] Cross-tenant test

## Implementation notes

Use synthetic patients only.

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
