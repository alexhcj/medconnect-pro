---
id: FE-041
type: task
area: frontend
feature: billing
status: pending
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
  file_url: ""
  frame: "App / Billing — 02 Record payment dialog — tablet (174:2198) and the billing boundary cards"
  status: not_started
implementation:
  status: not_started
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

Recommended decisions, to be approved before `design.status: approved`:

1. **Radio:** keep the native radio inside the fieldset (keyboard, form semantics, screen readers).
   Restyle the Figma radio to match the code control. Where this departs from ADR-011 (Figma is
   canonical), record the accessibility exception here; do not edit the ADR.
2. **Method gap:** keep the code spacing if each method row meets a 44 px target height (the FE-037
   convention); otherwise set rows to 44 px. Update Figma to the chosen value.
3. **Payment boundary card:** height fits content (`self-start` / `h-fit`) and is not stretched by
   the Claims boundary card.

## Acceptance Criteria

- [ ] Radio appearance is identical in the Figma frame and the rendered dialog
- [ ] Method rows are at least 44 px tall and spacing matches Figma at tablet and mobile
- [ ] Payment boundary card height equals its content when the Claims card is taller
- [ ] Dialog remains keyboard operable with correct radio group semantics
- [ ] Each of the three decisions is written in Completion
- [ ] Existing record-payment and boundary tests updated and passing

## Dependencies

- Blocked by: FE-031, FE-032, FE-018
- Design: Figma file https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd (frame above; status `not_started`)
- Related: FE-042, FE-045

## Validation

Update `record-payment-dialog.test.tsx` and `payment-claims-boundaries.test.tsx`. Run
`npm run lint:web`, `type-check:web`, `test:web`. Compare the dialog to Figma at tablet and mobile.

## Risks / considerations

- The radio and gap decisions need human approval before implementation.

## Implementation notes

Likely a PATCH bump.
