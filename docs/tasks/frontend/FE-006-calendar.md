---
id: FE-006
type: task
area: frontend
feature: scheduling
status: planned
priority: high
estimate: 3
dependencies: [FE-005]
related_adrs: []
related_docs: [frontend-architecture.md,../01-product-requirements.md]
plane:
  work_item_id: 4e8cc0ab-c90c-4303-8337-7a1c08852146
  identifier: MEDCONNECT-25
---

# FE-006 — Calendar

## Objective

Implement calendar views and appointment interaction.

## Scope

Use React Big Calendar with healthcare-oriented responsive behavior.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [ ] Calendar renders
- [ ] Day/week/month views work as applicable
- [ ] Appointment selection works
- [ ] Tablet layout works
- [ ] Loading/error states exist

## Implementation notes

Keep calendar state distinct from server state.

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
