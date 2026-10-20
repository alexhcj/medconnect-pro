---
id: FE-042
type: task
area: frontend
feature: billing
status: pending
priority: high
estimate: 2
dependencies: [FE-015, FE-031, DATA-005]
related_adrs: [ADR-002-tenant-isolation.md, ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../product/billing.md,
    ../../workflows/design-requirements.md,
    FE-015-billing-ui-nest-api.md,
    FE-031-record-demo-payment.md,
    FE-032-claims-envelope-list.md,
    ../backend/DATA-005-synthetic-patient-portal-account.md,
  ]
design:
  required: true
  tool: figma
  file_url: ""
  frame: ""
  status: not_started
implementation:
  status: not_started
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: ce77de28-6b39-46b1-8dbd-f7c567ab11a8
  identifier: MEDCONNECT-119
---

# FE-042 — Billing role-scoped content and status colours

## Objective

Each role sees only its own billing scope in mock mode, and invoice/payment status is readable at a
glance through colour, so staff can tell paid from unpaid after a payment is recorded.

## Context

Reported behaviour: signed in as Avery Carter with mocks, the billing page lists invoices for
Taylor Bennett, Jordan Brooks and others, and the Claims boundary shows other patients' invoices.
Signed in as Avery Quinn against the real API, the problem does not appear. The API already scopes
PATIENT to own invoices (`resolveBillingReadScope`, `Patient.portalUserId`), so the cause is the
mock adapter and fixtures (`apps/web/src/lib/api/mocks/billing-mock.ts`, `fixtures.ts`), which
apply no role scope.

Figma highlights `paid` in green and places the Payment recorded block above Details. Code renders
status as plain text (`lib/billing/format.ts`, `invoice-list.tsx`), and the Payment recorded text
lives in `payment-claims-boundaries.tsx`.

## Scope

- Mock billing adapter links a portal user to a patient and filters invoices, invoice detail,
  payments and claims by role, mirroring the API scope rules and `billing-access.ts`.
- Verify and document per-role billing content (admin, receptionist: practice-wide; patient: own
  only; provider, nurse: per `billing-access.ts`).
- Colour-only status highlighting with design-system tokens in invoice list and detail:
  `paid` green, `overdue` red, `issued` a neutral/amber awaiting tone (final tone chosen in design
  for a healthcare app). No new badge component.
- Place the Payment recorded block as shown in Figma.
- A payment recorded by a patient or staff marks the invoice paid for staff views after refetch.

## Out of Scope

- API or contract changes (live API already scopes)
- Hosted payments, invoice creation UI, claims submission
- Pagination (FE-045)

## Requirements

- Never rely on client role checks as the only enforcement; this task fixes mock parity only.
- Status text label remains; colour is an added cue.
- Use existing semantic tokens; add tokens in the design system only if none exists.

## Acceptance Criteria

- [ ] In mock mode, a patient account sees only invoices linked to its patient, in list, detail and Claims boundary
- [ ] Requesting another patient's invoice as a patient returns not-found in the mock, as the API does
- [ ] Staff roles keep practice-wide billing views; provider and nurse follow `billing-access.ts`
- [ ] `paid` text is green, `overdue` red, `issued` the approved awaiting tone, in list and detail
- [ ] Status colours meet 4.5:1 contrast on their backgrounds in light and dark themes
- [ ] Payment recorded block position matches Figma
- [ ] After a patient records a demo payment in mock mode, staff see that invoice as paid
- [ ] Tests cover mock role scoping and status colour mapping

## Dependencies

- Blocked by: FE-015, FE-031, DATA-005
- Design: Figma file https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd (frame to be set; status `not_started`)
- Related: FE-041, FE-045, billing.invoices, billing.payments

## Validation

Extend `billing-mock.test.ts` and billing component tests. Browser check as Avery Carter on mocks
(own invoices only) and as staff. `npm run lint:web`, `type-check:web`, `test:web`.

## Risks / considerations

- Mock and API scoping can drift; share the scope rule or test against the same cases.
- Invoice statuses today are `issued`, `paid`, `overdue`; add colours for new statuses with them.

## Implementation notes

Mock-only change with no API contract change; likely a PATCH bump.
