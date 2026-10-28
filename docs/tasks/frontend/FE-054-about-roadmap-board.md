---
id: FE-054
type: task
area: frontend
feature: marketing
status: pending
priority: medium
estimate: 2
dependencies: [FE-022, FE-051]
related_adrs: [ADR-007-semantic-versioning.md]
related_docs:
  [
    ../../roadmap/release-roadmap.md,
    ../../marketing/capability-matrix.md,
    FE-022-security-about-and-demo-pages.md,
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
  work_item_id: eb64fd34-24ff-4a15-8e4b-6b5ea9e8bebf
  identifier: MEDCONNECT-145
---

# FE-054 — About: implementation state as a roadmap board

## Objective

`/about` shows what is shipped, in progress and up next, in a form that is easy to update when a
milestone changes state.

## Context

"Implementation state" is four status cards in a three-column grid, so one card sits alone on the
last row. It doesn't show what is being worked on or what comes next. The Zed roadmap's state
grouping is the inspiration; the visuals stay in this design system.

## Scope

- Replace the four cards with three columns, **Shipped**, **In progress** and **Up next**, plus one
  "Paused" line for AWS production hosting.
- Items are capability-level, never task IDs. Examples: "Application demo", "Security patterns",
  "PR previews and delivery lanes", "Marketing design refresh", "1.0.0 demo release".
- Reshape the data in `MARKETING_ABOUT_STATE` (`marketing-about-copy.ts`). Column headers use
  `Badge`.
- Add a rule to step 6 of the progress trackers in `.claude/rules/documentation.md`: update the
  About roadmap board when a milestone changes state.
- Update the About frame in Figma.

## Out of Scope

- Generating the board automatically from the roadmap file.
- Dates or percentages.

## Requirements

- Every item is allowed by `capability-matrix.md`, and nothing planned is presented as shipped.
- On mobile the columns stack in the order Shipped → In progress → Up next. Each column is a list
  with a heading.

## Acceptance Criteria

- [ ] `/about` shows the three columns and the Paused line with current content.
- [ ] No card sits alone on a row at any width.
- [ ] The documentation rule is updated.
- [ ] The Figma frame matches.

## Dependencies

- Blocked by: FE-051. Related: FE-022.
- Design: Figma file https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System
  (page "Security / About / Demo" 41:2).

## Validation

Run `npm run test:marketing` (`marketing-about.test.tsx`), lint, type-check and
`npm run docs:marketing-sync`.
