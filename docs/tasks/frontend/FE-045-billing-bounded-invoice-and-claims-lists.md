---
id: FE-045
type: task
area: frontend
feature: billing
status: complete
priority: medium
estimate: 3
dependencies: [FE-015, FE-032, BE-025, FE-042]
related_adrs: [ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../product/billing.md,
    ../../workflows/design-requirements.md,
    FE-015-billing-ui-nest-api.md,
    FE-032-claims-envelope-list.md,
    ../backend/BE-025-billing-and-user-list-pagination-contract.md,
  ]
design:
  required: true
  tool: figma
  file_url: https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd
  frame: 'Page "FE-045 Billing lists" (node 260:2): frames 01–14, components Claim row and List notice on the same page'
  status: approved
implementation:
  status: complete
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: 8379ff9a-e1bf-4f2f-a5d2-1486cd6fc030
  identifier: MEDCONNECT-123
---

# FE-045 — Billing bounded invoice and claims lists

## Objective

Invoices and claims envelopes render as bounded, paginated lists so large data sets do not
produce one long page.

## Context

`invoice-list.tsx` and `claims-envelope-list.tsx` render every row the API returns. BE-025 adds
paging and filters to both endpoints. Claims are derived from visible invoices.

## Scope

- Invoice list: pagination, status filter, sort by issued date.
- Claims list: its own pagination, independent of invoices.
- Mobile layout as stacked rows/cards.
- Loading, empty, error states.

## Out of Scope

- API changes (BE-025)
- Boundary card layout (FE-041) and status colours (FE-042)
- Invoice creation UI, claims submission

## Requirements

- One request per list per page; filters reset to page 1.
- Range and total labels; controls 44 px and keyboard accessible.
- PATIENT role sees paginated own data only.
- Payment and Claims envelopes cards are unaffected by list size.

## Acceptance Criteria

- [x] Only one page of invoices and one page of claims render at a time
- [x] Status filter and sort change the invoice list and reset to page 1
- [x] Claims paging does not affect invoice paging
- [x] A patient account sees only its own paginated rows
- [x] Layout works at 320 px without horizontal scroll
- [x] Tests cover both lists, including empty and error states

## Dependencies

- Blocked by: FE-015, FE-032, BE-025, FE-042
- Design: Figma file https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd, page "FE-045 Billing lists", frames 01–14 (https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=260-2); components Claim row and List notice on that page; status `approved`
- Related: FE-043, FE-044

## Validation

`npm run lint:web`, `type-check:web`, `test:web`; browser check with enough seeded invoices for
several pages.

## Risks / considerations

- Mock adapter must support the same paging params as BE-025 so mock mode matches live mode.
- Seed volume may need to grow to show paging.

## Implementation notes

MINOR bump while `0.x` if it ships a new list interaction; otherwise PATCH.

## Completion

- Shipped at 0.96.0. `/dashboard/billing` renders one page of 10 invoices (Status and Sort selects, "Clear filters", range label, numbered `Pagination`) and, in the Claims envelopes card, one page of 10 envelopes with its own pager (numbered when the card is at least 32 rem wide, via a container query; compact otherwise). Page, status and sort live in `invoicesPage`, `invoicesStatus`, `invoicesSort` and `claimsPage`; a filter or sort change drops `invoicesPage` and leaves `claimsPage`. Pager hidden when total ≤ 10; previous rows stay dimmed while the next page loads; states: loading, empty, filtered-empty, past the end, error.
- New or changed: `types/billing/billing-list.ts`, `lib/billing/list-params.ts`, `billingAPI.listInvoices/listClaims` (return `PagedResult`), `useInvoices/useClaims` (params, kept previous page), mock adapter paging/filter/sort plus 30 generated invoices (35 total, in the mock only), `Pagination pageSize` and `container`, `BILLING_PAGE_SIZE = 10`, `SelectField optionLabels`, `<Suspense>` around the lists. The Payment and Claims cards use a 1 : 2 grid from md. The Claims card is titled "Claims envelopes" everywhere (code, tests, Figma, docs, API descriptions); "Payment boundary" is unchanged. Decisions changed after review: 10 rows per page (the API default stays 25), the claims pager switches on container width instead of always being compact, and the card rename.
- Fix found by the full e2e run: `useListUrlState` built each change from its own stale URL snapshot, so paging invoices then claims quickly dropped the first change. It now builds on the last pushed query until the router catches up (test: `use-list-url-state.test.tsx`).
- Tests: billing mock, API client, list params, `invoice-list`, `claims-envelope-list`, `pagination` (compact), `list-filter-fields`, `use-list-url-state`; e2e `billing-dashboard.spec.ts` (paging, URL after reload, independent claims paging, filter and sort reset, patient own rows, 320 px no horizontal scroll). `lint:web` 0 errors, `type-check:web` clean, `test:web` 542 passed, `e2e:mocks` 31 passed, `build:web` compiled.
- Not verified: the live API path (`e2e:live`; the live seed holds about 6 invoices, so paging is only visible in mock mode), keyboard-only use and a 320 px screenshot in a real browser (covered by unit tests and the e2e overflow check). Security review not run: no auth, tenant or audit change; patient scope stays server-side.
- Notes: version 0.95.0 → 0.96.0 (MINOR: new list interaction and URL state). `docs/product/` and the capability matrix are unchanged (no new capability claim). Design: Figma page "FE-045 Billing lists".
