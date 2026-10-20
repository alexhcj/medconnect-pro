---
id: FE-045
type: task
area: frontend
feature: billing
status: pending
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
- Payment and Claims boundary cards are unaffected by list size.

## Acceptance Criteria

- [ ] Only one page of invoices and one page of claims render at a time
- [ ] Status filter and sort change the invoice list and reset to page 1
- [ ] Claims paging does not affect invoice paging
- [ ] A patient account sees only its own paginated rows
- [ ] Layout works at 320 px without horizontal scroll
- [ ] Tests cover both lists, including empty and error states

## Dependencies

- Blocked by: FE-015, FE-032, BE-025, FE-042
- Design: Figma file https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd (frame to be set; status `not_started`)
- Related: FE-043, FE-044

## Validation

`npm run lint:web`, `type-check:web`, `test:web`; browser check with enough seeded invoices for
several pages.

## Risks / considerations

- Mock adapter must support the same paging params as BE-025 so mock mode matches live mode.
- Seed volume may need to grow to show paging.

## Implementation notes

MINOR bump while `0.x` if it ships a new list interaction; otherwise PATCH.
