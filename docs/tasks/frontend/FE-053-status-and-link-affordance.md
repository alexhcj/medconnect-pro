---
id: FE-053
type: task
area: frontend
feature: marketing
status: pending
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
  work_item_id: 5c733807-f320-485d-8783-69b128164ed2
  identifier: MEDCONNECT-144
---

# FE-053 — Status vs link affordance

## Objective

Visitors can tell at a glance whether card text is a status or a link.

## Context

On `/security`, "Implemented pattern" uses the same blue text style as the `/platform/...` route
link in the `/platform` Demo modules. Only the leading slash hints that one of them is a link. Every
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
- `/platform` Demo modules use `MarketingLinkCard`. The route text stays and gains an ArrowRight,
  and the whole card becomes the link.
- Figma: update the Security / About / Demo and Platform overview frames.

## Out of Scope

- Copy changes. The status labels stay as they are.
- The About implementation-state layout (FE-054).

## Requirements

- The tone mapping lives in one typed map, not inline on each page.
- Badges are not focusable. Each link card is one focus stop.
- Colour is never the only signal: badges keep their text and links keep their arrow.

## Acceptance Criteria

- [ ] Every status label on `/security`, `/about` and `/demo` renders as a badge with its mapped tone.
- [ ] `/platform` Demo module cards are clickable across the whole card, show an arrow, and have
      hover and focus states.
- [ ] Badge and link text pass AA contrast.
- [ ] The Figma frames match.

## Dependencies

- Blocked by: FE-051. Related: FE-021, FE-022.
- Design: Figma file https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System
  (pages "Platform overview" 34:2 and "Security / About / Demo" 41:2).

## Validation

- Run `npm run test:marketing` (status-card and platform tests), lint and type-check.
- Check keyboard focus and the preview at 375 and 1280 px.
