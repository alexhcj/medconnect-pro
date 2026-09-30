---
id: FE-020
type: task
area: frontend
feature: marketing
status: implemented
priority: high
estimate: 3
dependencies: [FE-018]
related_adrs: [ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    frontend-architecture.md,
    ../01-product-requirements.md,
    ../../roadmap/post-mvp-baseline.md,
    ../../roadmap/release-roadmap.md,
    ../../workflows/design-requirements.md,
    ../../marketing/requirements.md,
    ../../marketing/sitemap.md,
    ../../marketing/capability-matrix.md,
  ]
design:
  required: true
  tool: figma
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=34-3"
  frame: "Platform overview / Desktop 1440 (34:3)"
  status: approved
implementation:
  status: complete
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: a713c8c5-9193-4438-b507-c6d942e549c6
  identifier: MEDCONNECT-55
---

# FE-020 — Platform overview

## Objective

Turn `/platform` into a complete feature map that links to dedicated module pages and introduces
the shared feature-page layout primitives used by FE-021.

## Context

The FE-017 `/platform` placeholder lists modules as cards without dedicated routes.
[FE-018](FE-018-design-system-and-visual-language.md) supplies tokens and the feature-page
template. This task implements the Platform overview frame. Linked `/platform/*` routes may 404
until [FE-021](FE-021-platform-feature-pages.md).

Do not start UI implementation while `design.status` is not `approved`. Use the same Figma file as
FE-018; set `design.frame` to the Platform overview frame. Repeat the Figma URL in Markdown
Dependencies.

## Scope

- Feature grid with honest status (analytics = mock cards only; telehealth = session shell, not
  live video; billing invoices implemented, payments/claims labeled boundaries).
- Links from each module to its `/platform/*` path per [sitemap.md](../../marketing/sitemap.md).
- Shared `FeaturePageLayout` (or equivalent) primitives for FE-021.
- Keep Platform as one top-level `MARKETING_NAV` item unless the sitemap later says otherwise.

## Out of scope

- Implementing the six feature-page bodies (FE-021)
- Homepage, Security, About, Demo content
- Deploy/preview
- Building missing product features

## Requirements

- Copy follows [capability-matrix.md](../../marketing/capability-matrix.md).
- WCAG 2.1 AA-oriented landmarks, keyboard, and contrast.
- Desktop, tablet, and mobile.
- Public; no dashboard session or TanStack Query domain APIs.
- Synthetic demo data only.

## Technical constraints

- Follow the project architecture.
- Reuse FE-018 tokens and marketing chrome.
- Do not invent a second marketing nav information architecture.
- Do not claim HIPAA certification, production OAuth, live video, or hosted payments.

## Acceptance criteria

- [x] `/platform` matches the approved Platform overview frame
- [x] Each module links to its `/platform/*` path
- [x] Copy does not claim unimplemented completeness
- [x] Page is keyboard-accessible with semantic landmarks
- [x] Layout is usable at desktop, tablet, and mobile widths
- [x] Tests cover nav to `/platform` and in-page module links

## Dependencies

- Blocked by: [FE-018](FE-018-design-system-and-visual-language.md) (`design.status: approved`)
- Blocks: [FE-021](FE-021-platform-feature-pages.md),
  [FE-023](FE-023-marketing-polish-and-product-visuals.md)
- Figma URL (approved):
  https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=34-3
- Canonical frame: Platform overview / Desktop 1440 (`34:3`)
- Layout frames: Platform overview / Tablet 768 (`34:7`), Platform overview / Mobile 390 (`34:13`)
- Feature page template: Feature page / Desktop 1440 (`21:195`); tablet (`21:282`) and mobile (`21:311`)

## Validation

Browser check of `/platform`. Playwright: public nav → platform and in-page module hrefs. Lint,
type-check, and frontend tests.

## Risks / considerations

- Linking to routes that 404 until FE-021 is acceptable if hrefs match the sitemap; do not hide
  the links solely to avoid 404s.
- Do not add six top-level nav items.

## Implementation notes

Platform remains `apps/web/src/app/(marketing)/platform/page.tsx`. Put reusable feature-page
chrome next to other marketing components, not in the dashboard tree.

## Completion

- Implementation: `/platform` uses designed hero, capability-qualified module cards with sitemap
  `/platform/*` links, and a demo CTA. `FeaturePageLayout` lives in `components/marketing/` for
  FE-021. Header/footer remain `MarketingShell`. Linked feature routes 404 until FE-021.
- Tests: `marketing-platform.test.tsx`, `feature-page-layout.test.tsx`; Playwright marketing
  spec covers Primary → `/platform` and six in-page module hrefs. Vitest 232 passed; Playwright
  mock e2e 20 passed; type-check passed.
- PR:
- Notes: Design approved on the shared Figma file
  https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=34-3
  (Platform overview / Desktop 1440 `34:3`; tablet `34:7`; mobile `34:13`).
  Feature page template extended at Feature page / Desktop 1440 (`21:195`).
  Version 0.48.0.
