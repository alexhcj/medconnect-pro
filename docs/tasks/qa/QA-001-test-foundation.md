---
id: QA-001
type: task
area: qa
feature: test-foundation
status: planned
priority: high
estimate: 2
dependencies: [BE-001]
related_adrs: []
related_docs: [frontend-architecture.md,backend-architecture.md]
plane:
  work_item_id: null
  identifier: null
---

# QA-001 — Test foundation

## Objective

Establish deterministic test conventions for frontend/backend.

## Scope

Unit, integration, API and E2E configuration.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [ ] Test commands work
- [ ] Synthetic fixtures exist
- [ ] Critical path test conventions documented
- [ ] No real PHI in fixtures

## Implementation notes

Keep tests deterministic and isolated.

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
