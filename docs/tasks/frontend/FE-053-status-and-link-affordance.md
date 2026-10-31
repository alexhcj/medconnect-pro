---
id: FE-053
type: task
area: frontend
feature: marketing
status: implemented
priority: medium
estimate: 2
dependencies: [FE-022, FE-051]
related_adrs: [ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../workflows/design-requirements.md,
    FE-021-platform-feature-pages.md,
    FE-022-security-about-and-demo-pages.md,
    FE-051-marketing-design-system-extension.md,
  ]
design:
  required: true
  tool: figma
  file_url: https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System
  frame: "Security / About / Demo (41:2); FE-053 / Status vs link states (346:2311); Components > Card Variant=Route (346:1224)"
  status: approved
implementation:
  status: complete
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: 5c733807-f320-485d-8783-69b128164ed2
  identifier: MEDCONNECT-144
---

# FE-053 — Status vs link affordance

## Objective

Visitors can tell at a glance whether card text is a status or a link.

## Context

On `/security`, "Implemented pattern" uses the same blue text style as the `/platform/...` route
links in the `/demo` "What you can walk through" cards. Only the leading slash hints that one of them is a link. Every
status also uses the same brand blue regardless of meaning ("Not shipped", "Must not claim",
"Paused").

## Scope

- `MarketingStatusCard` renders string statuses as a `Badge`, with the tone mapped from the status:

  | Status | Tone |
  | --- | --- |
  | Implemented pattern, Shipped, Current | success |
  | In progress | accent |
  | Not shipped, Planned | neutral |
  | Partial, Paused, Must not claim | warning |

- This applies to the status cards on `/security`, `/about` and `/demo`.
- `/demo` "What you can walk through" cards (route statuses `{label, href}`) become whole-card
  links: the status-card layout stays, the route text stays in the footer and gains an ArrowRight,
  and the card has hover and focus states (Figma Card `Variant=Route`).
- Figma: update the Security / About / Demo frames.

## Out of Scope

- Copy changes. The status labels stay as they are.
- The About implementation-state layout (FE-054).
- `/platform` Demo modules and homepage link cards (already redesigned).

## Requirements

- The tone mapping lives in one typed map, not inline on each page.
- Badges are not focusable. Each link card is one focus stop.
- Colour is never the only signal: badges keep their text and links keep their arrow.

## Acceptance Criteria

- [x] Every status label on `/security`, `/about` and `/demo` renders as a badge with its mapped tone.
- [x] `/demo` "What you can walk through" cards are clickable across the whole card, show an
      arrow, and have hover and focus states.
- [x] Badge and link text pass AA contrast.
- [x] The Figma frames match.

## Dependencies

- Blocked by: FE-051. Related: FE-021, FE-022.
- Design: Figma file https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System
  (page "Security / About / Demo" 41:2; spec frame "FE-053 / Status vs link states" 346:2311;
  Card `Variant=Route` 346:1224). Approved 2026-10-29.

## Validation

- Run `npm run test:marketing` (status-card and platform tests), lint and type-check.
- Check keyboard focus and the preview at 375 and 1280 px.

## Completion

- Shipped at 0.99.5 (2026-10-29).
- Implementation:
  - `marketing-status-tones.ts`: `MARKETING_STATUS_TONES` (the scope table) with
    `MarketingStatusLabel` and `marketingStatusTone()`. `MarketingStatusCard` narrows `status` to
    `MarketingStatusLabel | MarketingStatusCardLink`, so an unmapped label fails type-check.
  - `marketing-status-card.tsx`: a string status renders a `Badge` with the mapped tone. A link
    status wraps the card in one `next/link` (`group`, focus-visible ring), with the route text
    and an `aria-hidden` ArrowRight in the footer and a hover border, shadow and arrow nudge.
  - `marketing-demo-copy.ts`: the Patient management and Appointments descriptions drop
    "Link: /platform/...", now that the route is in the footer (user-approved copy change).
- Tests: `marketing-status-card.test.tsx` (each of the 9 labels renders a non-focusable badge with
  its tone; a route status is one link with no nested anchor and a hidden arrow);
  `marketing-demo.test.tsx` checks six walk-through links by title, href and route text.
  `npm run lint:marketing`, `type-check:marketing` and `test:marketing` (101 tests) pass.
- Browser check (marketing dev server):
  - `/demo`: six walk-through links, none nested; Tab moves one card at a time with a visible ring;
    no horizontal overflow at 375 and 1280 px.
  - Contrast: success badges 4.56:1, neutral 6.87:1, warning 8.75:1, route text 5.17:1 (AA).
    Badges have no tab stop.
- Figma: Security / About / Demo frames (41:2) use the Card `Status` variant with tone-mapped
  badges; the `/demo` cards use the new Card `Variant=Route` (346:1224); states spec frame 346:2311.
  The Figma About frame still has the older card set (one "In progress" card); FE-054 re-syncs it.
