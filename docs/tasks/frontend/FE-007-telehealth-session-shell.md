---
id: FE-007
type: task
area: frontend
feature: telehealth
status: planned
priority: medium
estimate: 3
dependencies: [FE-005]
related_adrs: []
related_docs: [frontend-architecture.md,../01-product-requirements.md,../contracts/api-endpoints.md]
plane:
  work_item_id: 77c97f7a-4104-45bf-b7ba-fbe7307e5047
  identifier: MEDCONNECT-26
---

# FE-007 — Telehealth session shell

## Objective

Create the appointment-linked telehealth session shell for M5.

## Scope

Join/leave UI, waiting-room presentation, and media-control placeholders. Do not claim a production
telehealth deployment.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [ ] Session shell route exists
- [ ] Appointment linkage is visible
- [ ] Join/leave controls exist
- [ ] Loading/error states exist
- [ ] Accessible on tablet

## Implementation notes

Media behavior is bounded by the selected telehealth architecture. Backend session API is BE-006.

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
