---
id: FE-054
type: task
area: frontend
feature: marketing
status: implemented
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
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System"
  frame: "Security / About / Demo (41:2) — About / Desktop 1440 (41:7), Tablet 768 (44:522), Mobile 390 (44:584); components Roadmap item (352:1487), Roadmap paused row (352:1490)"
  status: approved
implementation:
  status: complete
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

- [x] `/about` shows the three columns and the Paused line with current content.
- [x] No card sits alone on a row at any width.
- [x] The documentation rule is updated.
- [x] The Figma frame matches.

## Dependencies

- Blocked by: FE-051. Related: FE-022.
- Design: Figma file https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System
  (page "Security / About / Demo" 41:2; About frames 41:7, 44:522, 44:584; components
  "Roadmap item" 352:1487 and "Roadmap paused row" 352:1490). Approved.

## Validation

Run `npm run test:marketing` (`marketing-about.test.tsx`), lint, type-check and
`npm run docs:marketing-sync`.

## Completion

- Shipped at 0.99.6 (2026-10-29).
- Implementation:
  - `marketing-about-copy.ts`: `MARKETING_ABOUT_STATE` holds `columns` (Shipped, In progress,
    Up next) with capability-level `{title, description}` items, and a `paused` line.
  - `marketing-roadmap-board.tsx`: new `MarketingRoadmapBoard`. Each column is an h3 `Badge`
    (dot, tone from `marketingStatusTone`) over a labelled `<ul>`; `grid gap-4 lg:grid-cols-3`;
    the Paused line is a full-width `bg-subtle` row with a warning `Badge`.
  - `marketing-status-tones.ts`: adds `Up next` (neutral).
  - `.claude/rules/documentation.md` step 6 and a `capability-matrix.md` "About roadmap board"
    note (user-approved) on what each column may claim.
- Tests: `marketing-about.test.tsx` checks the three h3 column headings in order, each list's
  items, that 1.0.0 is only under Up next, the Paused line, and that no task ID appears.
- Visual check (dev server `/about`): 1440 px shows three equal-height 352 px columns; 768 and
  375 px stack Shipped → In progress → Up next with no horizontal overflow and no console errors.
  This matches Figma frames 41:7, 44:522 and 44:584.
