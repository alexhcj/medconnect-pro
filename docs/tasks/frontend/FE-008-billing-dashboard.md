---
id: FE-008
type: task
area: frontend
feature: billing
status: implemented
priority: medium
estimate: 3
dependencies: [FE-001]
related_adrs: []
related_docs: [frontend-architecture.md,../01-product-requirements.md,../contracts/api-endpoints.md]
plane:
  work_item_id: cc6bd0e7-346b-493a-8fc4-2992ea4a3067
  identifier: MEDCONNECT-27
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

- [x] Billing dashboard route exists
- [x] Synthetic invoices render
- [x] Payment/claims boundaries are labeled as boundaries
- [x] Loading/empty/error states exist
- [x] Accessible on tablet

## Implementation notes

Do not process real payments. Backend billing API is BE-007.

## Completion

- Implementation: Billing dashboard at `/dashboard/billing` with invoice list/detail from `docs/mocks/invoices.json`. Payment (Stripe/ACH) and claims (EDI 837) cards are labeled boundaries; Record payment is disabled. Live mode returns 404 until BE-007. Access matches Billing nav roles (NURSE denied in UX).
- Tests: Vitest for mock list/get, live reject, access helper, list/detail/boundary UI, and query states. Playwright tablet flow covers list, detail, and boundary labels.
- PR:
- Notes: Nav visibility is not authorization. Nurse visit-context billing, Nest `/billing`, and real payments stay out of scope.
