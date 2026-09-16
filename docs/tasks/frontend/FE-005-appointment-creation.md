---
id: FE-005
type: task
area: frontend
feature: scheduling
status: planned
priority: high
estimate: 2
dependencies: [FE-003]
related_adrs: []
related_docs: [frontend-architecture.md,../01-product-requirements.md]
plane:
  work_item_id: null
  identifier: null
---

# FE-005 — Appointment creation

## Objective

Create appointment workflow linking patient and provider.

## Scope

Provider, patient, time, type and appointment state.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [ ] Appointment form works
- [ ] Conflict feedback exists
- [ ] Validation works
- [ ] Accessible workflow exists

## Implementation notes

Backend conflict detection is authoritative.

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
