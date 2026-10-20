---
id: FE-040
type: task
area: frontend
feature: marketing
status: complete
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
  file_url: https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd
  frame: FE-040 Header logo & RoleTag (page; node-id=212-12)
  status: approved
implementation:
  status: complete
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

- Marketing header: logo never wraps or shrinks; mark-only fallback below 360 px (approved design),
  full lockup from 360 px up.
- Mobile-nav drawers (marketing `MarketingMobileNav`, app `MobileNav` DialogPanel title): compact
  16 px wordmark on one line. The app sidebar and app top header are unchanged.
- Extract one shared `RoleTag` (and a `RoleTagList` that owns the 12 px list gap) from the Homepage
  markup and use it on Home and About.
- Update the affected Figma frames on this task (done: page "FE-040 Header logo & RoleTag").

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

- [x] At 320, 375, 768 and 1024 px the logo mark and wordmark (or the approved mark-only fallback)
      are fully visible and do not overlap the menu button or nav
- [x] No horizontal page scroll in the header at those widths
- [x] About page role tags render with the same background and text colour as the Homepage tags
- [x] Home and About use one shared `RoleTag` component
- [x] Logo remains a link with the accessible name "MedConnect Pro"
- [x] Figma header frames and RoleTag match the implemented result

## Dependencies

- Blocked by: FE-018, FE-023
- Design: Figma file https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd, page "FE-040 Header logo & RoleTag" (status `approved`)
- Related: FE-019, FE-022

## Validation

Unit test for `RoleTag`; component tests that Home and About render it. `npm run lint:marketing`,
`type-check:marketing`, `test:marketing` (and the web equivalents if app chrome changes). Manual
viewport check at the four widths above.

## Risks / considerations

- Header changes touch shared frames; update them on this task, not a new design task.
- App chrome scope confirmed: only the mobile-nav drawer title changes; existing `blue-600` / `gray-*`
  classes stay (they equal the Figma brand and text tokens).

## Implementation notes

Likely a PATCH bump (no new capability or contract).

## Completion

- Implementation: marketing header logo is `shrink-0` / `whitespace-nowrap` with a mark-only fallback below 360 px; both mobile-nav drawer titles use a one-line 16 px wordmark; shared `RoleTag` / `RoleTagList` (12 px gap) used on Home and About.
- Tests: `role-tag.test.tsx`, marketing shell, Home and About, web dashboard shell. Browser check at 320, 375, 768 and 1024 px: no header overlap or horizontal scroll.
- Notes: Version 0.91.0 → 0.91.1 (PATCH, UI polish). App sidebar and top header unchanged. Figma page "FE-040 Header logo & RoleTag".
