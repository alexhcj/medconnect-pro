---
id: BE-007
type: task
area: backend
feature: billing
status: planned
priority: medium
estimate: 4
dependencies: [BE-001,DATA-001]
related_adrs: []
related_docs: [backend-architecture.md,../contracts/api-endpoints.md]
plane:
  work_item_id: 10ca6d71-df69-4ac6-84e1-604ee2076265
  identifier: MEDCONNECT-16
---

# BE-007 — Billing API

## Objective

Implement billing account/invoice/payment boundaries.

## Scope

Keep external Stripe/ACH integration behind an adapter boundary.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [ ] Invoice endpoints exist
- [ ] Payment boundary exists
- [ ] Tenant scope enforced
- [ ] Audit events exist

## Implementation notes

Do not store raw payment card data.

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
