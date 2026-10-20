---
id: FE-041
type: task
area: frontend
feature: billing
status: complete
priority: medium
estimate: 2
dependencies: [FE-031, FE-032, FE-018]
related_adrs: [ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../workflows/design-requirements.md,
    FE-031-record-demo-payment.md,
    FE-032-claims-envelope-list.md,
  ]
design:
  required: true
  tool: figma
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=174-2198"
  frame: "App / Billing — 02 Record payment dialog — tablet (174:2198); 06 dialog — mobile (219:33); 07 Boundary cards — tablet (219:55); 08 Method radio and row spec (219:70); component Method radio (218:25)"
  status: approved
implementation:
  status: complete
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: 7d031161-5eab-4409-a69c-dcbd93bc5bfd
  identifier: MEDCONNECT-118
---

# FE-041 — Billing design/code sync

## Objective

Make the billing page match its Figma frames for the payment method radio, method row spacing, and
the Payment boundary card, with one recorded decision for each.

## Context

Figma and code differ in three places: the radio selector in the record-payment dialog
(`record-payment-dialog.tsx`, native `<input type="radio">` in a fieldset), the vertical gap
between payment methods, and the Payment boundary card (`payment-claims-boundaries.tsx`), which
stretches to the height of the longer Claims boundary card.

## Scope

- Pick one radio design and sync Figma and code.
- Pick one method row spacing and sync Figma and code.
- Make the Payment boundary card hug its content.
- Record each decision in this task's Completion section as the source of truth.

## Out of Scope

- New payment methods, hosted payments, or dialog behaviour changes
- Billing role scoping and status colours (FE-042)
- List bounding (FE-045)

## Requirements

Approved decisions (design approved):

1. **Radio:** keep the native radio inside the fieldset (keyboard, form semantics, screen readers).
   Restyle the Figma radio to match the code control. Where this departs from ADR-011 (Figma is
   canonical), record the accessibility exception here; do not edit the ADR.
2. **Method rows:** approved. Rows are 44 px tall (`min-h-11`; the FE-037 convention; code is
   40 px today) with a 2 px gap between rows (`space-y-0.5`), leaving room for the focus ring.
   Figma is updated to these values.
3. **Payment boundary card:** height fits content (`self-start` / `h-fit`) and is not stretched by
   the Claims boundary card.

## Acceptance Criteria

- [x] Radio appearance is identical in the Figma frame and the rendered dialog
- [x] Method rows are at least 44 px tall and spacing matches Figma at tablet and mobile
- [x] Payment boundary card height equals its content when the Claims card is taller
- [x] Dialog remains keyboard operable with correct radio group semantics
- [x] Each of the three decisions is written in Completion
- [x] Existing record-payment and boundary tests updated and passing

## Dependencies

- Blocked by: FE-031, FE-032, FE-018
- Design: Figma file https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=174-2198 (frames above; status `approved`)
- Related: FE-042, FE-045

## Validation

Update `record-payment-dialog.test.tsx` and `payment-claims-boundaries.test.tsx`. Run
`npm run lint:web`, `type-check:web`, `test:web`. Compare the dialog to Figma at tablet and mobile.

## Risks / considerations

- Figma frames stacked the two boundary cards while code uses `md:grid-cols-2`. Resolved: frames
  `01`, `03`, `04` and `07` now show two columns.

## Implementation notes

Likely a PATCH bump.

## Completion

- Decisions (source of truth):
  1. **Radio:** native `<input type="radio">` kept inside the fieldset/legend, styled to match the Figma `Method radio` component (16 px, `accent-brand`, 2 px `outline-ring` focus-visible outline with 2 px offset, 50% opacity when disabled). Accessibility exception to ADR-011 (Figma canonical): a custom visual radio was rejected to keep native keyboard, form and screen-reader semantics; the ADR is unchanged.
  2. **Method rows:** `min-h-11` (44 px, `--control-height-lg`) with a 2 px gap (`space-y-0.5`). Code was `h-10` plus `space-y-2` (40 px rows, 8 px gap). The 2 px gap leaves room for the focus outline of adjacent rows.
  3. **Payment boundary card:** `self-start` on the Payment `Card`, so it hugs its content beside a taller Claims boundary card.
- Implementation: `record-payment-dialog.tsx`, `payment-claims-boundaries.tsx`.
- Tests: `record-payment-dialog.test.tsx` (radio group semantics, ArrowDown selection, row classes, pending disables radios), `payment-claims-boundaries.test.tsx` (Payment card `self-start`). Lint and type-check clean.
- Figma: tablet dialog `174:2198`, mobile dialog `219:33`, boundary cards `219:55`, spec `219:70`, component `218:25` on page "App / Billing".
- Browser check (local mocks, practice admin, `/dashboard/billing`): at 1024 px the Payment card is 204 px tall beside a 786 px Claims card; dialog rows measure 44 px with a 2 px gap, radio 16 px, accent `rgb(37, 99, 235)` (the Figma brand blue); at 375 px rows are 44 px with no horizontal scroll. Figma frames `01`, `03` and `04` now show the boundary cards in two columns as in code; FE-032 frames (Claims only) are unchanged.
- Notes: Version 0.91.1 → 0.91.2 (PATCH, UI polish, no API or contract change).
