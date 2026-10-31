---
id: FE-051
type: task
area: frontend
feature: marketing
status: implemented
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
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=314-201"
  frame: "Components / FE-051 Marketing components (314:201)"
  status: approved
implementation:
  status: complete
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

## Decisions (plan review)

- Badge tones map to existing tokens only:
  - `accent` → `bg-brand-subtle` + `text-brand-hover`, the same pairing as `RoleTag`.
  - `success` → `bg-subtle` + `text-success-strong`, about 4.6:1 contrast. No `success-subtle`
    token is added.
  - `neutral` → `bg-subtle` + `text-foreground-secondary`.
  - `warning` → `bg-warning-subtle` + `text-warning`.
- Home CTA buttons keep their row layout from `sm`.
  - At 640 px the band's content box is about 512 px wide. The two `lg` buttons plus the gap
    need about 312 px, which leaves roughly 100 px of free space on each side.
  - At 375 px the box is about 295 px wide, so the buttons stack.
  - `MarketingCtaBand` replaces `stackUntilLg` with `rowFrom?: 'sm' | 'md' | 'lg'` (default
    `md`). Current callers keep their breakpoints, and the home CTA passes `sm`.
- No existing marketing test asserts `grid-cols-*`, so the class-string risk below is low.

## Acceptance Criteria

- [x] The four components exist with unit tests (tones, `reverse`, link semantics, focus ring).
- [x] No 3-item grid leaves a lone card at 640–767 px, and workflow shows 2 columns at 640–1023 px.
- [x] The home CTA renders through `MarketingCtaBand` with unchanged copy.
- [x] The Figma components and variants exist and match the code (spacing, radius, tokens).
- [x] Existing marketing tests pass after their class strings are updated.

## Dependencies

- Related: FE-018, FE-023. Blocks: FE-052, FE-053, FE-054, FE-055.
- Design: Figma file https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System,
  review frame `FE-051 Marketing components` (node 314:201) on the Components page.
  - Component sets: `Card` (313:160), `Badge` (312:58), `Section band` (314:78) and
    `Split section` (314:191).
  - Foundations added to mirror existing code tokens: `color/border/strong`, `Shadow/md`,
    `Label/Xs`, `Heading/H2 Marketing`, `Icon/ArrowRight`, `Icon/Calendar`.

## Validation

Run `npm run lint:marketing`, `type-check:marketing` and `test:marketing`. Check the preview at
375, 768, 1024 and 1280 px.

## Risks / considerations

Many tests assert class strings. Change the grid helper deliberately and update the tests with it.

## Completion

- Implementation:
  - `apps/marketing/src/components/ui/badge.tsx`: `Badge`, a static `<span>` with tones
    `success | accent | neutral | warning` and an optional `aria-hidden` dot.
  - `apps/marketing/src/components/marketing/marketing-band.tsx`: `MarketingBand`, tones
    `surface | canvas | brand`, inner `max-w-6xl` container.
  - `marketing-split-section.tsx`: `MarketingSplitSection`, 5/7 columns from `lg`, `reverse` swaps
    the columns with `lg:order-*` only, so the DOM stays lead-first.
  - `marketing-link-card.tsx`: `MarketingLinkCard`, one `next/link` with `min-h-11`, focus ring
    with offset, hover border and shadow, trailing `ArrowRight` and optional leading lucide icon,
    all `aria-hidden`.
  - `marketingSectionGridClassName`: 3 columns → `md:grid-cols-3`, 4 columns →
    `sm:grid-cols-2 lg:grid-cols-4`.
  - `MarketingCtaBand`: `stackUntilLg` replaced by `rowFrom` (`md` by default). Feature pages,
    About, Demo and Security pass `lg`, unchanged. The homepage now renders the CTA through it
    with `rowFrom="sm"` and the same copy, and `marketing-home-cta.tsx` is deleted.
  - Tests: `badge.test.tsx`, `marketing-band.test.tsx`, `marketing-split-section.test.tsx`,
    `marketing-link-card.test.tsx`, `marketing-section.test.tsx`, `marketing-cta-band.test.tsx`.
  - Version 0.99.2 -> 0.99.3.
- Validation:
  - `lint:marketing`, `type-check:marketing` and `test:marketing` all pass (20 files, 85 tests).
  - Homepage measured in the browser at 375, 700, 768, 1023, 1024 and 1280 px:
    - 3-item grids show 1 column below 768 px and 3 from 768 px.
    - Workflow shows 2 columns at 700–1023 px.
    - The CTA buttons stack at 375 px and sit in a row from 640 px.
    - No horizontal scroll at any width.
  - The Figma values (padding, radius, gaps, tokens) were checked against the classes.
- Deviations:
  - Figma gained library entries that mirror existing code tokens: `color/border/strong`,
    `Shadow/md`, `Label/Xs`, `Heading/H2 Marketing`, plus the `Icon/ArrowRight` and
    `Icon/Calendar` components. No code tokens were added.
  - A link test caught title and description concatenating in the accessible name. An explicit
    space keeps the name readable.
- Notes: the new components are not used on pages yet; FE-052 to FE-055 own that.
