---
id: FE-051
type: task
area: frontend
feature: marketing
status: pending
priority: high
estimate: 3
dependencies: [FE-018, FE-023]
related_adrs: [ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../workflows/design-requirements.md,
    ../../architecture/frontend-architecture.md,
    FE-018-design-system-and-visual-language.md,
    FE-023-marketing-polish-and-product-visuals.md,
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
  work_item_id: 63a1e492-8537-4f89-afdc-a7e0ae4ac743
  identifier: MEDCONNECT-142
---

# FE-051 — Marketing design-system extension

## Objective

Give the marketing site the building blocks M21 needs: status badges, full-bleed section bands, a
two-column split section and a clickable link card. They ship in Figma and code together.

## Context

- Every marketing section today is a white card grid.
- Status text and links share one style (`text-sm font-medium text-brand`).
- `marketingSectionGridClassName(3)` leaves a lone card at `sm`, and the 4-column grid jumps
  straight from 1 to 4 columns at `lg`.
- Figma has a single `Card` symbol and no badge or section components.

## Scope

- **Code** (`apps/marketing/src/components/`):
  - `Badge`, with tones `success | accent | neutral | warning`.
  - `MarketingBand`: full-bleed, `tone: surface | canvas | brand`, with an inner `max-w-6xl`
    container.
  - `MarketingSplitSection`: heading, intro and an optional link on the left; items on the right.
    It stacks below `lg` and has a `reverse` option.
  - `MarketingLinkCard`: the whole card is one link, with an optional leading icon, a trailing
    ArrowRight, and hover and focus states.
- **Grid helper**: 3 columns becomes `md:grid-cols-3`; 4 columns becomes
  `sm:grid-cols-2 lg:grid-cols-4`.
- **Home CTA** reuses `MarketingCtaBand` instead of duplicating it.
- **Figma** (Components page):
  - `Card` gains `Variant=Default|Icon|Link|Status`.
  - New `Badge` (Tone), `Section band` (Tone) and `Split section` (Reverse).
  - Update the documentation frame.

## Out of Scope

- Using the new components on pages. That is FE-052 to FE-055; only the grid-helper fix and CTA
  reuse land here.
- `apps/web` dashboard components.
- New tokens or a new icon library.

## Requirements

- Existing tokens only: `bg-canvas`, `bg-subtle`, `bg-brand-subtle` and the status colours already
  in `tokens.css`. Badge text meets WCAG 2.1 AA on its background.
- A badge is never interactive. A link card always shows an arrow and a hover state, so the two
  can't be confused.
- A link card is one focusable element: 44 px minimum target, visible focus ring, no nested links.
- Icons come from lucide-react and are `aria-hidden`.

## Acceptance Criteria

- [ ] The four components exist with unit tests (tones, `reverse`, link semantics, focus ring).
- [ ] No 3-item grid leaves a lone card at 640–767 px, and workflow shows 2 columns at 640–1023 px.
- [ ] The home CTA renders through `MarketingCtaBand` with unchanged copy.
- [ ] The Figma components and variants exist and match the code (spacing, radius, tokens).
- [ ] Existing marketing tests pass after their class strings are updated.

## Dependencies

- Related: FE-018, FE-023. Blocks: FE-052, FE-053, FE-054, FE-055.
- Design: Figma file https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System
  (frame added on approval).

## Validation

Run `npm run lint:marketing`, `type-check:marketing` and `test:marketing`. Check the preview at
375, 768, 1024 and 1280 px.

## Risks / considerations

Many tests assert class strings. Change the grid helper deliberately and update the tests with it.
