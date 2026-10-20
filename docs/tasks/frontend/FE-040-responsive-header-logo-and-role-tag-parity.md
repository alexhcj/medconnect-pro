---
id: FE-040
type: task
area: frontend
feature: marketing
status: pending
priority: medium
estimate: 2
dependencies: [FE-018, FE-023]
related_adrs: [ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../workflows/design-requirements.md,
    FE-018-design-system-and-visual-language.md,
    FE-019-marketing-homepage.md,
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
  work_item_id: 3bb18d83-690d-43c4-9573-5534d036684b
  identifier: MEDCONNECT-117
---

# FE-040 — Responsive header logo and RoleTag parity

## Objective

Keep the MedConnect Pro logo fully visible in tablet and mobile headers, and make the About page
role tags match the Homepage role tags.

## Context

The logo is an inline "MC" square plus the "MedConnect Pro" wordmark, repeated in
`marketing-header.tsx`, `marketing-mobile-nav.tsx`, and the app chrome
(`apps/web/src/components/dashboard/sidebar.tsx`, `mobile-nav.tsx`). At tablet and mobile widths
the logo area collapses. The About page role pills (`marketing-about.tsx`) use
`bg-subtle … text-foreground`; the Homepage pills (`marketing-home-roles.tsx`) use
`bg-brand-subtle … text-brand-hover`. The Figma Components page already defines a RoleTag; no
code component exists.

## Scope

- Reserve enough header space for the logo at tablet and mobile widths, or apply another solution
  recorded in the design (for example mark-only fallback below a stated breakpoint).
- Apply the same logo fix to the marketing header, marketing mobile nav, and the app sidebar /
  mobile nav.
- Extract one shared `RoleTag` component from the Homepage markup and use it on Home and About.
- Update the affected Figma frames on this task.

## Out of Scope

- Logo redesign or new brand assets
- Other header/nav changes
- FeatureGrid reuse and other section refactors

## Requirements

- Nav items yield space before the logo does.
- The accessible name "MedConnect Pro" is preserved in every logo variant.
- RoleTag background and text colour are exactly as displayed on the Homepage, and match the
  Figma Components page.
- Use existing design tokens; no new colours.

## Acceptance Criteria

- [ ] At 320, 375, 768 and 1024 px the logo mark and wordmark (or the approved mark-only fallback)
      are fully visible and do not overlap the menu button or nav
- [ ] No horizontal page scroll in the header at those widths
- [ ] About page role tags render with the same background and text colour as the Homepage tags
- [ ] Home and About use one shared `RoleTag` component
- [ ] Logo remains a link with the accessible name "MedConnect Pro"
- [ ] Figma header frames and RoleTag match the implemented result

## Dependencies

- Blocked by: FE-018, FE-023
- Design: Figma file https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd (frame to be set; status `not_started`)
- Related: FE-019, FE-022

## Validation

Unit test for `RoleTag`; component tests that Home and About render it. `npm run lint:marketing`,
`type-check:marketing`, `test:marketing` (and the web equivalents if app chrome changes). Manual
viewport check at the four widths above.

## Risks / considerations

- Header changes touch shared frames; update them on this task, not a new design task.
- Confirm that the app chrome should change too (default yes) before design approval.

## Implementation notes

Likely a PATCH bump (no new capability or contract).
