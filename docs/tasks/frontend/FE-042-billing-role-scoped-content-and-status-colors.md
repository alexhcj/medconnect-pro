---
id: FE-042
type: task
area: frontend
feature: billing
status: complete
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
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=229-80"
  frame: "App / Billing — FE-042 frames: 01 Invoice list tablet (229:81); 02 list mobile (229:110); 03 Detail Issued tablet (230:70); 04 Detail Overdue tablet (230:108); 05 Detail after payment Paid + notification tablet (230:146); 06 same mobile (230:196); 07 Status tone and notification spec (231:74); component Invoice list row (229:79); token color/text/success-strong"
  status: approved
implementation:
  status: complete
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

Figma highlights `paid` in green. Code renders status as plain text (`lib/billing/format.ts`,
`invoice-list.tsx`), and the Payment recorded text lives in `payment-claims-boundaries.tsx`.
Approved design: Payment recorded becomes a transient in-page notification instead of text in the
Payment boundary card.

## Scope

- Mock billing adapter links a portal user to a patient and filters invoices, invoice detail,
  payments and claims by role, mirroring the API scope rules and `billing-access.ts`.
- Verify and document per-role billing content (admin, receptionist: practice-wide; patient: own
  only; provider, nurse: per `billing-access.ts`).
- Colour-only status highlighting with design-system tokens in invoice list and detail (approved):
  `paid` `color/text/success-strong` (new token, green-700 `#15803d`), `overdue`
  `color/text/danger`, `issued` `color/text/secondary` (neutral awaiting tone). Weight unchanged
  (`font-medium`). No new badge component. Claims status stays uncoloured.
- Payment recorded is a transient notification (toast) shown only right after recording: no
  stored payment details, no inbox item, no new notification type or contract. `role="status"`,
  decorative icon, 44 px dismiss, auto-dismiss after 6 s paused on hover and focus; top right on
  tablet, full width at the top on mobile. The Payment boundary card no longer repeats it.
- A payment recorded in mock mode marks the invoice paid after refetch within the same page
  session. The mock stays in memory; no localStorage persistence (reload or sign-out resets it).

## Out of Scope

- API or contract changes (live API already scopes)
- Hosted payments, invoice creation UI, claims submission
- Pagination (FE-045)

## Requirements

- Never rely on client role checks as the only enforcement; this task fixes mock parity only.
- Status text label remains; colour is an added cue.
- Use existing semantic tokens; add tokens in the design system only if none exists. The one
  approved addition is `color/text/success-strong` (`--color-text-success-strong`), because
  `color/text/success` is 3.30:1 on white. Map it in `tokens.css` and `@theme`.
- Dark theme is out of scope (apps/web has none).

## Acceptance Criteria

- [x] In mock mode, a patient account sees only invoices linked to its patient, in list, detail and Claims boundary
- [x] Requesting another patient's invoice as a patient returns not-found in the mock, as the API does
- [x] Staff roles keep practice-wide billing views; provider and nurse follow `billing-access.ts`
- [x] `paid` text is green (`success-strong`), `overdue` red, `issued` neutral grey (`text-secondary`), in list and detail
- [x] Status colours meet 4.5:1 contrast on surface and canvas backgrounds in the light theme
- [x] Payment recorded confirmation appears as the transient notification per the Figma frames, only right after recording
- [x] After a demo payment is recorded in mock mode, that invoice shows as paid after refetch in the same page session (mock state is in memory and resets on reload or sign-out; no persistence added)
- [x] Tests cover mock role scoping and status colour mapping

## Dependencies

- Blocked by: FE-015, FE-031, DATA-005
- Design: Figma file https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=229-80 (frames above; status `approved`)
- Related: FE-041, FE-045, billing.invoices, billing.payments

## Validation

Extend `billing-mock.test.ts` and billing component tests. Browser check as Avery Carter on mocks
(own invoices only) and as staff. `npm run lint:web`, `type-check:web`, `test:web`.

## Risks / considerations

- Mock and API scoping can drift; share the scope rule or test against the same cases.
- Invoice statuses today are `issued`, `paid`, `overdue`; add colours for new statuses with them.

## Implementation notes

Mock-only change with no API contract change; likely a PATCH bump.

## Completion

- Decisions (source of truth): issued is neutral grey (`text-secondary`), weight unchanged; new token `color/text/success-strong` (green-700 `#15803d`, 5.02:1 on white, 4.80:1 on canvas) because `color/text/success` is 3.30:1; Payment recorded is a transient toast shown only right after recording (no storage, no inbox type, no contract); Claims status colour and dark theme out of scope; AC7 narrowed to same-session refetch (mock state in memory, no persistence).
- Implementation: `apps/web/src/lib/api/mocks/billing-mock.ts` (role scope mirroring Nest `billing-access.ts`; portal user `77777777-…` linked to `demo-patient-001`; list/get return copies so TanStack Query sees a payment), `lib/billing/format.ts` (`invoiceStatusTextClass`), `invoice-list.tsx`, `invoice-detail.tsx`, `payment-recorded-notice.tsx` (new), `payment-claims-boundaries.tsx`, `styles/tokens.css`.
- Tests: `billing-mock.test.ts` (role scoping per role, own-scope 404, nurse 403, provider cannot pay, unlinked patient, copies, same cases as `billing-access.spec.ts`), `format.test.ts` (tone map and 4.5:1 check on tokens), `invoice-list.test.tsx`, `invoice-detail.test.tsx`, `payment-recorded-notice.test.tsx`, `payment-claims-boundaries.test.tsx`, e2e `billing-dashboard.spec.ts` (4 tests: patient scope and not-found, status colours, payment flow with toast). Lint 0 errors and type-check clean.
- Browser check (local mocks): patient sees only Avery Carter invoices and two claim envelopes; computed status colours `rgb(75, 85, 99)` / `rgb(21, 128, 61)` / `rgb(220, 38, 38)`; after paying, detail status reads Paid; toast at x 384, y 16, 360 px wide at 768 px (as in Figma) and 343 px wide at x 16, y 16 at 375 px with a 44 px dismiss and no horizontal scroll.
- Security review: no blocking findings; the mock does not mimic the API tenant-mismatch check because the web client sends no practice id.
- Deviations: fixed the shared e2e `signIn` helper (`getByLabel` exact) because the login page demo panel adds "Copy email" buttons that broke every spec using it; the same exact-label fix was applied to `e2e/auth.spec.ts` (6/6 pass). Mock bug fixed: in-place invoice mutation hid a payment from TanStack Query.
- Notes: Version 0.91.2 → 0.91.3 (PATCH, mock parity and UI cue, no API or contract change). Full `test:web`: 442 passed, 2 flaky `patient-form.test.tsx` timeouts that pass alone.
