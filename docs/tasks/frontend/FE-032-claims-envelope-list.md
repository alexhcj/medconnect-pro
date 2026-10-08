---
id: FE-032
type: task
area: frontend
feature: billing
status: implemented
priority: high
estimate: 2
dependencies: [FE-031, FE-015, BE-007, FE-027]
related_adrs: [ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../contracts/api-endpoints.md,
    ../../contracts/data-contracts.md,
    ../../product/billing.md,
    ../../marketing/capability-matrix.md,
    ../../roadmap/post-mvp-baseline.md,
    ../../workflows/design-requirements.md,
    FE-008-billing-dashboard.md,
    FE-015-billing-ui-nest-api.md,
    FE-031-record-demo-payment.md,
    ../backend/BE-007-billing-api.md,
  ]
design:
  required: true
  tool: figma
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd"
  frame: "App / Billing — 01 Claims envelopes — tablet (174:2260)"
  status: approved
implementation:
  status: complete
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: 2e10ab97-4c0d-4f50-9d58-8cc45c7f7985
  identifier: MEDCONNECT-89
---

# FE-032 — Claims envelope list on Nest claims API

## Objective

Replace the static “EDI 837 is not connected” card with the existing `GET /billing/claims`
envelopes, still labeled as not claim submission.

## Context

[BE-007](../backend/BE-007-billing-api.md) returns `not_submitted` / `edi837` envelopes derived
from visible invoices. [FE-015](FE-015-billing-ui-nest-api.md) left the claims card as a labeled
boundary. [FE-031](FE-031-record-demo-payment.md) enables demo record-payment on the same
dashboard chrome.

M13 is **Billing / Payments UX**. This task is `billing.claims`. Do not add `POST /billing/claims`.
`planned_next: claims submission / EDI 837` remains **after** this slice.

Implements / extends `billing.claims`.

**Do not implement application code until `design.status` is `approved` on this task.**

Shared Figma file (repeat in Dependencies when approved):
https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd

## Scope

- Design on this task (shared Figma file; may share the FE-031 App / Billing page): claims
  envelope list, loading/empty/error, labeled not submission. Tablet is first-class.
- Live + mock `listClaims` against `GET /billing/claims`. Unwrap `ClaimListRdo.claims`.
- Render envelope identity, linked invoice, `not_submitted`, processor `edi837`, `synthetic`.
- Loading, empty, and error states (`role="alert"` on errors).
- Copy must not claim X12 generation, claim submission, or denial workflow.
- Update [billing-demo-notice.ts](../../../apps/web/src/components/billing/billing-demo-notice.ts)
  so it no longer says payments and claims are unprocessed after FE-031 records demo payments.
- When shipped: [billing.md](../../product/billing.md) `billing.claims` → `shipped` /
  `public: qualified`; `planned_next` remains claims submission / EDI 837. Module stays
  **partial**. [capability-matrix.md](../../marketing/capability-matrix.md); marketing billing
  copy (home, platform, feature page, demo); [README.md](../../../README.md) billing row;
  [post-mvp-baseline.md](../../roadmap/post-mvp-baseline.md) incomplete line (“Payments, claims
  submission” → “Hosted Stripe/ACH and claims submission / EDI 837”).

## Out of Scope

- `POST /billing/claims` / EDI 837 generation / status / denial workflow
- Invoice-create UI
- Stripe SDK or hosted payments
- Recreating FE-031 record-payment
- PATIENT portal login as a product
- Nurse visit-context billing
- M9 / AWS / OAuth / Redis

## Requirements

### UI / design

- Stay on `/dashboard/billing` (and invoice detail if the claims card remains there)
- States: populated, loading, empty, error
- Accessible list; errors use `role="alert"`
- Repeat the approved Figma URL in Dependencies when design is approved

### Technical

- Frontend checks remain UX only; Nest is authoritative
- No client `practiceId` authorization
- Reuse `apiFetch` (`credentials: 'include'`)
- Mock Playwright stays on `NEXT_PUBLIC_USE_MOCKS=true`
- Marketing tests that forbid `/accept payments/i` stay; replace “labeled boundary only” with
  qualified demo-envelope language

## Acceptance Criteria

- [x] `design.status` is `approved` with `file_url` and `frame` before implementation
- [x] Billing dashboard shows envelopes derived from visible invoices
- [x] Loading, empty, and error states exist
- [x] Copy does not claim claim submission, X12, or denial workflow
- [x] Mock Playwright asserts envelope list
- [x] `e2e:live` asserts envelope list plus FE-031 payment UX
- [x] Tablet viewport remains covered
- [x] Catalog: `billing.claims` shipped (qualified). Marketing, matrix, README, and
      post-mvp-baseline incomplete line match. Module stays partial.

## Dependencies

- FE-031, FE-015, BE-007, FE-027 (FE-031 must ship first so shared billing chrome is not
  half-migrated)
- Design brief via [design-brief-prompt.md](../../processes/prompts/design-brief-prompt.md) on
  **this** task

Figma (shared library; approved page **App / Billing**, primary frame
**01 Claims envelopes — tablet** (`174:2260`)):
https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=174-2260

## Validation

- Vitest: Claim RDO mapping, live GET unwrap, mock list, UI loading/empty/error
- Mock Playwright billing flow includes envelopes
- `npm run e2e:live` billing spec asserts envelopes
- Marketing honesty tests updated
- Lint and type-check
- Manual tablet pass

## Risks / Considerations

- Design is a blocker until approved on this task.
- Do not present envelopes as claims submission or hosted clearinghouse.
- Nav visibility is not authorization.

## Implementation notes

Suggested order: after FE-031 and `design.status: approved`. Reuse the billing dashboard
components and [billing-api.ts](../../../apps/web/src/lib/api/billing-api.ts). Do not add a
claims POST. Marketing copy lives in
[marketing-feature-pages-copy.ts](../../../apps/web/src/components/marketing/marketing-feature-pages-copy.ts)
and related home/platform/demo copy files.

Writing this spec is not a version bump. Design-metadata approval is not a version bump.
Shipping this slice is **MINOR**.

## Completion

- Implementation: Billing dashboard and invoice detail list `GET /billing/claims` envelopes
  (`not_submitted` / `edi837` / `synthetic`). Copy labels this as not claim submission, X12, or
  denial workflow. Loading, empty, and error (`role="alert"`) states exist. Catalog
  `billing.claims` is shipped as qualified. Marketing, matrix, README, and post-mvp-baseline
  incomplete line match. Module stays partial (hosted Stripe/ACH and EDI 837 remain planned).
- Tests: Vitest for Claim RDO mapping, live GET unwrap, mock list, and UI loading/empty/error.
  Mock Playwright asserts the envelope list. Live Playwright asserts envelopes plus FE-031
  record-payment on an API-created invoice.
- PR:
- Notes: Version 0.74.0 → 0.75.0 (MINOR). Plane update is human.
