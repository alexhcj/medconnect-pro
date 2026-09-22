---
id: FE-009
type: task
area: frontend
feature: administration
status: planned
priority: medium
estimate: 3
dependencies: [FE-001, FE-010]
related_adrs: []
related_docs: [frontend-architecture.md,../01-product-requirements.md,../contracts/api-endpoints.md]
plane:
  work_item_id: e3121a3e-056b-424d-9350-a4cdcc62b66a
  identifier: MEDCONNECT-28
---

# FE-009 — Administration/security UI

## Objective

Create practice/user administration and audit-viewer UI for M7.

## Scope

User/role presentation and an audit event viewer using synthetic data. Permission management beyond
default grants is out of M1.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [ ] Administration route exists
- [ ] User/role list renders
- [ ] Audit viewer renders synthetic events
- [ ] Loading/empty/error states exist
- [ ] Navigation visibility is not treated as authorization

## Implementation notes

Server authorization remains authoritative (BE-009, SEC-002–004, QA-004).

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
