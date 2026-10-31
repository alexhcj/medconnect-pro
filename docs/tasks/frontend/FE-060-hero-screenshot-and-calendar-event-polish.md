---
id: FE-060
type: task
area: frontend
feature: marketing
status: implemented
priority: medium
estimate: 1
dependencies: [FE-052, QA-012, FE-057]
related_adrs: [ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../workflows/design-requirements.md,
    ../../product/scheduling.md,
    FE-052-homepage-refresh.md,
    ../qa/QA-012-marketing-screenshot-capture.md,
  ]
design:
  required: true
  tool: figma
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=319-297"
  frame: "Homepage / Desktop 1440 (FE-052) (319:297) hero visual; Tablet 768 (FE-052) (321:622)"
  status: approved
implementation:
  status: complete
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: 707a0b41-87ce-4ebb-b334-9a7c00792fe9
  identifier: MEDCONNECT-152
---

# FE-060 — Hero chip fit, appointments screenshot, two-row calendar event

## Objective

Fix three small visual defects before 1.0.0: the homepage hero claim chips, the marketing appointments
screenshot, and the appointment block in the week/day calendar.

## Context

- **Hero chips.** The two claim chips over the hero image in
  [marketing-home-hero.tsx](../../../apps/marketing/src/components/marketing/marketing-home-hero.tsx)
  ("RBAC and tenant isolation", "Synthetic data only") are a white pill `<li>` around a grey badge.
  The gap between pill and badge is larger at the top than on the other sides, so the chip does not
  match FE-052 (319:331 / 319:335: even gap, 30 px chip). Clarified by the user on 2026-10-31; the
  first draft described a white strip under `dashboard.png`, which does not exist.
- **Appointments screenshot.** In `apps/marketing/public/marketing/appointments.png` the column
  line between 16 Fri and 17 Sat is offset at the right edge (header vs. body), most likely the
  react-big-calendar scrollbar gutter.
- **Calendar event.** `AppointmentEvent` in
  [appointment-calendar.tsx](../../../apps/web/src/components/appointments/appointment-calendar.tsx)
  renders "Patient · Provider · State". In week/day view react-big-calendar lays out the time label
  and content in a wrapping column, so on a short block the name wraps sideways next to the time
  and is mostly hidden.

## Scope

1. Hero chips: each chip hugs its badge with the same gap on every side, 30 px tall, as in FE-052
   319:331 / 319:335.
2. Appointments screenshot: header and body column lines align through the 17 Sat column. If the
   offset also exists in the live app, fix it in the `.appointment-calendar` CSS. Retake with
   `npm run screenshots:marketing`.
3. Calendar event (week and day view): row 1 is the time range ("5:00 PM – 6:00 PM"); row 2 is
   "Avery Carter · Dr. Jordan Ellis · Cancelled", single line, ellipsis truncation. No sideways
   column wrap.

## Out of Scope

- Month and agenda views
- New calendar features or event content
- Other marketing screenshots, except as regenerated unchanged by the capture run
- Marketing copy changes

## Requirements

- Keep the 30-minute minimum event block height (`min-height: 2.5rem`).
- Keep the cancelled style, `titleAccessor`, and `tooltipAccessor` unchanged.
- Use existing design tokens; no new dependencies.
- Hero image keeps its `alt` text and the failed-image fallback.

## Acceptance Criteria

- [x] At 1440 (chips show from `lg`), each hero chip is 30 px tall with an even gap between the
      pill and the badge on every side.
- [x] In `appointments.png`, the right-edge column lines are continuous between header and body.
- [x] In week and day view, events show the time on line 1 and name · provider · state on line 2,
      ellipsis-truncated; nothing overlaps the time.
- [x] The event's accessible name and tooltip are unchanged.
- [x] Existing web and marketing unit tests pass; a unit check covers the two-row event.

## Dependencies

- FE-052 (homepage hero), QA-012 (screenshot capture), FE-057 (calendar)
- Figma: https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=319-297

## Validation

- `npm run lint:web`, `npm run type-check:web`, `npm run test:web`
- `npm run lint:marketing`, `npm run test:marketing`
- `npm run screenshots:marketing` (stop `next dev` first)
- Visual check of `/` (marketing) and `/dashboard/appointments` week/day view in the browser preview

## Risks / considerations

- Recapturing changes binary files under `apps/marketing/public/marketing/`; commit only the
  intended ones.
- The react-big-calendar time-slot CSS must work for both 30-minute and 1-hour blocks.

## Versioning

PATCH: visual fixes, no API or capability change.

## Completion

- Hero: the chip `<li>` was a block whose 24 px line box put the inline-flex badge on the baseline, so
  it measured 34 px with extra space above the badge. `flex` on the `<li>`
  (`marketing-home-hero.tsx`) makes it 30 px with an even 5 px gap (border + padding), as in Figma
  319:331 / 319:335. The user clarified this was the defect (2026-10-31). `marketing-home.test.tsx`
  asserts the chips are `flex`.
- Calendar event: `globals.css` sets `.rbc-day-slot .rbc-event` to `column nowrap` with the label and
  content full width, so row 1 is the time and row 2 is "patient · provider · state" with ellipsis.
  Accessors unchanged. Test added in `appointment-calendar.test.tsx`.
- Column alignment: the offset also existed in the live app. react-big-calendar sizes the empty header
  gutter from a one-time measurement (10 px against 81 px in the body once), and the all-day strip was
  1 px narrower per edge. A fixed 5.25rem gutter on both and a full-width all-day row fix it
  (measured within 0.1 px at 1440). `appointments.png` retaken with `npm run screenshots:marketing`;
  the other PNGs the capture rewrote were reverted as unintended.
- Version 0.103.0 -> 0.103.1 (PATCH: visual fixes, no API or capability change).
- Checks: web lint 0 errors (9 existing warnings), type-check clean, Vitest web 743 passed, marketing
  lint, type-check and tests passed. Browser preview verified chip size and column edges.
