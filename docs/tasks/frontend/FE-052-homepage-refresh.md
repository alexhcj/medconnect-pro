---
id: FE-052
type: task
area: frontend
feature: marketing
status: pending
priority: high
estimate: 5
dependencies: [FE-019, FE-023, FE-051, QA-012]
related_adrs: [ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../marketing/capability-matrix.md,
    ../../marketing/requirements.md,
    ../../workflows/design-requirements.md,
    FE-019-marketing-homepage.md,
    FE-051-marketing-design-system-extension.md,
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
  work_item_id: 299a72b0-6d8d-4c3e-add0-9fc2dbb1e17a
  identifier: MEDCONNECT-143
---

# FE-052 — Homepage refresh

## Objective

At every width the homepage reads as distinct, scannable sections. The hero gets a product visual,
the practice modules get icons and links, the slider becomes clearer, and the principles sections
stay compact on mobile and laptop.

## Context

- Every homepage section sits on the same white background as a card grid.
- UX and Security principles turn into six tall cards on mobile and narrow three-column rows at
  about 1024 px.
- The hero is text only.
- Figma's tablet and mobile homepage frames have drifted from the code: old module copy and no
  workflow section.
- `designs/marketing/homepage-alt-1.pen` is the layout reference for the hero, module icons, slider
  and security split. Its copy is not used.

## Scope

- **Section order and bands**:
  1. Hero (surface)
  2. Practice modules (surface)
  3. Connected workflow (canvas)
  4. Product UI (surface)
  5. Security principles (canvas, split)
  6. UX principles (surface, split, reversed)
  7. Who it is for (surface)
  8. CTA (brand, full-bleed)
- **Hero**: two columns from `lg`, with the fresh dashboard screenshot and two overlay chips built
  from existing claims ("RBAC and tenant isolation", "Synthetic data only"). At `md` the image sits
  below the CTAs; below `md` it is hidden.
- **Practice modules**: icons that match the app sidebar (Users, Calendar, Video, CreditCard,
  LayoutDashboard for Analytics, Shield). Each card is a `MarketingLinkCard` to `/platform/<slug>`.
- **Product UI slider**: restyled after alt-1. Baseline: a larger single slide, module chips acting
  as tabs, prev/next and an "n / 6" counter. Scroll-snap, keyboard support and the carousel ARIA
  stay.
- **Principles**: `MarketingSplitSection` with icon rows. The left-hand intro reuses existing copy,
  and Security links to `/security`.
- **Figma**: Homepage frames at 1440, 768 and 390 rebuilt from components.

## Out of Scope

- New marketing claims or copy. The chips and split intros reuse existing text.
- Changes to other pages.

## Requirements

- All other copy stays as it is, and every visible claim is allowed by `capability-matrix.md`.
- No horizontal scroll at 375, 768, 1024, 1280 or 1440 px.
- The hero image has meaningful alt text and doesn't delay LCP of the heading. Don't lazy-load the
  visible text, and size the image so it causes no layout shift.
- The slider stays keyboard-operable, with visible focus and an accessible label for each slide.
- `prefers-reduced-motion` turns smooth scrolling off.

## Acceptance Criteria

- [ ] Sections render in the order and band tones listed above.
- [ ] The hero shows the screenshot and both chips at 1024 px and up, the screenshot alone at 768 px,
      and neither at 375 px.
- [ ] Every practice module card shows its icon and opens the matching `/platform/<slug>` page.
- [ ] Security and UX principles are two columns from 1024 px and compact icon rows below that. At
      375 px the page is shorter than today's 4794 px.
- [ ] The slider has module chips, a counter and prev/next, works by keyboard, and announces the
      current slide.
- [ ] The Figma homepage frames (1440/768/390) match the implementation.

## Dependencies

- Blocked by: FE-051, QA-012. Related: FE-019, FE-023.
- Design: Figma file https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System
  (Homepage page; frame IDs added on approval). Pencil reference
  `designs/marketing/homepage-alt-1.pen` (layout only).

## Validation

- Run `npm run lint:marketing`, `type-check:marketing`, `test:marketing` and the marketing e2e.
- Screenshot the preview at all five widths.
- Do a keyboard pass through the hero, module cards and slider.

## Risks / considerations

- An over-decorated hero can look cheap. Use no invented metrics and no stock imagery, and build the
  chips from existing claims.
- The slider must not lose accessibility. Keep the existing region and `aria-roledescription`.
