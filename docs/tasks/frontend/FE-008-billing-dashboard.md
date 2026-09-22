---
id: FE-008
type: task
area: frontend
feature: billing
status: planned
priority: medium
estimate: 3
dependencies: [FE-001]
related_adrs: []
related_docs: [frontend-architecture.md,../01-product-requirements.md,../contracts/api-endpoints.md]
plane:
  work_item_id: null
  identifier: null
---

# FE-008 — Billing dashboard

## Objective

Create the billing dashboard and payment/claims UI boundaries for M6.

## Scope

Invoice list/detail presentation and payment/claims placeholders using synthetic data.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [ ] Billing dashboard route exists
- [ ] Synthetic invoices render
- [ ] Payment/claims boundaries are labeled as boundaries
- [ ] Loading/empty/error states exist
- [ ] Accessible on tablet

## Implementation notes

Do not process real payments. Backend billing API is BE-007.

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
