---
id: BE-005
type: task
area: backend
feature: ehr
status: planned
priority: high
estimate: 4
dependencies: [BE-003]
related_adrs: []
related_docs: [backend-architecture.md,../contracts/data-contracts.md,security-architecture.md]
plane:
  work_item_id: null
  identifier: null
---

# BE-005 — Clinical record API

## Objective

Implement the first FHIR R4-aligned clinical data boundary.

## Scope

Start with notes, diagnoses, vitals and medications.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [ ] Clinical records persist
- [ ] Provider/nurse permissions enforced
- [ ] Tenant scope enforced
- [ ] Audit events exist
- [ ] FHIR alignment is explicitly bounded

## Implementation notes

Do not claim full FHIR compliance.

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
