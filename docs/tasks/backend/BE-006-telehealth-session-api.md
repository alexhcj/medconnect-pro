---
id: BE-006
type: task
area: backend
feature: telehealth
status: planned
priority: high
estimate: 4
dependencies: [BE-004]
related_adrs: []
related_docs: [backend-architecture.md,security-architecture.md]
plane:
  work_item_id: 3744ca66-6a0d-4185-afed-92a06e370a87
  identifier: MEDCONNECT-15
---

# BE-006 — Telehealth session API

## Objective

Create appointment-linked telehealth sessions.

## Scope

Session creation, participant authorization, state, waiting room and timeout/grace logic.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [ ] Session can be created
- [ ] Participants authorized
- [ ] Session state tracked
- [ ] Timeout/grace logic documented
- [ ] Audit events exist

## Implementation notes

Media transport is separate from application authorization.

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
