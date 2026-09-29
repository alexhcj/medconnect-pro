---
id: FE-020
type: task
area: frontend
feature: marketing
status: pending
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

- [ ] `/platform` matches the approved Platform overview frame
- [ ] Each module links to its `/platform/*` path
- [ ] Copy does not claim unimplemented completeness
- [ ] Page is keyboard-accessible with semantic landmarks
- [ ] Layout is usable at desktop, tablet, and mobile widths
- [ ] Tests cover nav to `/platform` and in-page module links

## Dependencies

- Blocked by: [FE-018](FE-018-design-system-and-visual-language.md) (`design.status: approved`)
- Blocks: [FE-021](FE-021-platform-feature-pages.md),
  [FE-023](FE-023-marketing-polish-and-product-visuals.md)
- Figma URL (fill when approved):
- Frame (fill when approved):

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

- Implementation:
- Tests:
- PR:
- Notes:
