---
id: FE-031
type: task
area: frontend
feature: billing
status: pending
priority: high
estimate: 3
dependencies: [FE-015, BE-007, FE-027]
related_adrs: [ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../contracts/api-endpoints.md,
    ../../contracts/data-contracts.md,
    ../../contracts/identity-and-access.md,
    ../../product/billing.md,
    ../../marketing/capability-matrix.md,
    ../../workflows/design-requirements.md,
    FE-008-billing-dashboard.md,
    FE-015-billing-ui-nest-api.md,
    FE-027-live-cookie-session-client.md,
    ../backend/BE-007-billing-api.md,
  ]
design:
  required: true
  tool: figma
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd"
  frame: ""
  status: not_started
implementation:
  status: not_started
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: aeb1c30e-68c1-4269-91e4-422999c93911
  identifier: MEDCONNECT-88
---

# FE-031 — Record demo payment on Nest payment adapter

## Objective

Enable Record payment against existing `POST /billing/payments` so an unpaid invoice can be marked
paid through the in-process demo adapter (method `stripe` | `ach` only; no card or bank data).

## Context

[FE-015](FE-015-billing-ui-nest-api.md) connected invoice list and detail to Nest. Payment and
claims cards stay labeled boundaries; Record payment is disabled. Nest already records synthetic
payments ([BE-007](../backend/BE-007-billing-api.md) `DemoPaymentGateway`). Live fetches must use
the cookie client from [FE-027](FE-027-live-cookie-session-client.md).

M13 is **Billing / Payments UX**. This task is the payments half of `billing.payments`. Claims
envelopes remain [FE-032](FE-032-claims-envelope-list.md).

Catalog `planned_next: hosted payments (Stripe/ACH)` describes work **after** this slice. This
task ships **demo adapter UX**, not a Stripe SDK or hosted processor.

Implements / extends `billing.payments`.

**Do not implement application code until `design.status` is `approved` on this task.**

Shared Figma file (repeat in Dependencies when approved):
https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd

## Scope

- Design on this task (shared Figma file): record-payment dialog/panel on invoice detail,
  method picker (`stripe` | `ach`), disabled (PROVIDER / paid invoice), success with opaque
  `processorRef`, 409 conflict. Tablet is first-class.
- Live + mock `recordPayment({ invoiceId, method })` via existing `POST /billing/payments`.
  Body is `invoiceId` and `method` only. Never send `practiceId` for authorization. Never send
  card or bank account numbers.
- Enable Record payment for UX roles that match Nest `canRecordPayment` (PRACTICE_ADMIN,
  RECEPTIONIST, SUPER_ADMIN, PATIENT). Disable for PROVIDER. NURSE remains off Billing nav.
- Paid invoices: control disabled.
- Success: invoice status becomes Paid; show opaque synthetic `processorRef`.
- 409 already-paid: `role="alert"`.
- Invalidate invoice list/detail queries after success.
- Keep the claims card static until FE-032.
- When shipped: [billing.md](../../product/billing.md) `billing.payments` → `shipped` /
  `public: qualified`; `planned_next` remains hosted Stripe/ACH. Module stays **partial**.
  Update the capability-matrix billing **payments** cell; claims cell waits for FE-032.

## Out of Scope

- Stripe SDK, Stripe keys, ACH origination, PAN/bank fields
- Invoice-create UI
- `GET /billing/claims` / claims envelope list (FE-032)
- Payment history API / nesting payment on `InvoiceRdo`
- PATIENT portal login as a product (no loginable portal user on seed)
- Nurse visit-context billing
- Billing notification producers
- M9 / AWS / OAuth / Redis

## Requirements

### UI / design

- Extend `/dashboard/billing/[invoiceId]`; do not invent a second billing information architecture
- States: default (unpaid, entitled), disabled (PROVIDER or paid), submitting, success, conflict
- Accessible method control and confirm; errors use `role="alert"`
- Repeat the approved Figma URL in Dependencies when design is approved

### Technical

- Frontend checks remain UX only; Nest is authoritative
- No client `practiceId` authorization
- Reuse `apiFetch` (`credentials: 'include'`, CSRF on POST)
- Mock Playwright stays on `NEXT_PUBLIC_USE_MOCKS=true`
- **Live e2e must not pay the seeded Avery Quinn $150 overdue invoice** (that row is the
  list/detail assertion). Create a throwaway invoice via existing `POST /billing/invoices` in
  the spec, then record payment against that UUID.

## Acceptance Criteria

- [ ] `design.status` is `approved` with `file_url` and `frame` before implementation
- [ ] Unpaid invoice: entitled role can record `stripe` or `ach`; invoice becomes Paid;
      `processorRef` is visible; no card or bank fields
- [ ] PROVIDER: Record payment is disabled
- [ ] Paid invoice: Record payment is disabled
- [ ] 409 already-paid is surfaced with `role="alert"`
- [ ] Mock Playwright records a payment on a mock unpaid invoice
- [ ] One `e2e:live` path creates a throwaway invoice then records payment (does not mutate the
      seeded overdue Avery Quinn row)
- [ ] Tablet viewport remains covered
- [ ] Catalog: `billing.payments` shipped (qualified); `planned_next` hosted Stripe/ACH.
      Module stays partial (`billing.claims` still planned until FE-032)

## Dependencies

- FE-015, BE-007, FE-027 (shipped)
- Design brief via [design-brief-prompt.md](../../processes/prompts/design-brief-prompt.md) on
  **this** task
- Blocks: FE-032 (shared billing chrome)

Suggested Figma (shared library; page **App / Billing**):
https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd

## Validation

- Vitest: Payment RDO mapping, live POST (cookie, no client `practiceId`, no PAN), mock
  mutation, `canRecordPayment` helper, dialog states (enabled/disabled/success/409)
- Mock Playwright: record payment on an unpaid mock invoice; list/detail still work
- `npm run e2e:live` billing spec: API-created invoice → record payment → Paid + processor ref
- Lint and type-check
- Manual tablet pass

## Risks / Considerations

- Design is a blocker until approved on this task.
- Paying the seeded overdue invoice in live e2e would break FE-015 list/detail assertions on
  reruns.
- Do not present demo record-payment as hosted Stripe, ACH origination, or “accept payments.”
- Nav visibility is not authorization.

## Implementation notes

Suggested order: after `design.status: approved`. Reuse
[payment-claims-boundaries.tsx](../../../apps/web/src/components/billing/payment-claims-boundaries.tsx),
[invoice-detail.tsx](../../../apps/web/src/components/billing/invoice-detail.tsx),
[billing-api.ts](../../../apps/web/src/lib/api/billing-api.ts),
[use-billing.ts](../../../apps/web/src/lib/hooks/use-billing.ts),
[billing-access.ts](../../../apps/web/src/lib/auth/billing-access.ts).
Follow `useMutation` + query invalidation like notifications. Headless UI `Dialog` already
exists in the dashboard. Do not add a Stripe package.

Writing this spec is not a version bump. Design-metadata approval is not a version bump.
Shipping this slice is **MINOR**.
