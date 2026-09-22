---
id: QA-004
type: task
area: qa
feature: security
status: planned
priority: critical
estimate: 3
dependencies: [SEC-001,SEC-002,BE-003]
related_adrs: [ADR-002-tenant-isolation.md,ADR-003-authentication.md]
related_docs: [security-architecture.md]
plane:
  work_item_id: d3781561-4aca-445f-821d-188bab5230ed
  identifier: MEDCONNECT-36
---

# QA-004 — Authorization and tenant tests

## Objective

Create reusable authorization and tenant-isolation test matrix.

## Scope

Cover role × resource × tenant boundaries.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [ ] Provider access tested
- [ ] Nurse access tested
- [ ] Receptionist restrictions tested
- [ ] Patient self-scope tested
- [ ] Cross-tenant access denied

## Implementation notes

This is one of the highest-value portfolio security demonstrations.

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
