---
id: FE-019
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
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=20-50"
  frame: "Homepage / Desktop 1440 (20:50)"
  status: approved
implementation:
  status: complete
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: a186ca9a-cec1-467a-a4de-423eb1482b93
  identifier: MEDCONNECT-54
---

# FE-019 — Marketing homepage

## Objective

Replace the `/` placeholder with the designed marketing homepage that communicates product value
and introduces the core modules.

## Context

[FE-017](FE-017-marketing-website-foundation.md) shipped a public home route with placeholder copy.
[FE-018](FE-018-design-system-and-visual-language.md) supplies the shared Figma file, tokens, and
section primitives. This task implements the Home frame only.

Do not start UI implementation while `design.required` is true and `design.status` is not
`approved`. Copy `design.file_url` from FE-018 (same Figma file) and set `design.frame` to the
approved Home frame. Repeat the Figma URL in Markdown Dependencies.

## Scope

- Homepage sections: hero, module overview, connected workflow, product UI preview, UX principles,
  security principles, intended roles, demo CTA.
- Shared section components under `apps/web/src/components/marketing/`.
- Reuse `MarketingShell`. Public routes; no dashboard session or TanStack Query domain APIs.

## Out of scope

- `/platform/*` feature pages
- Security, About, and Demo page content beyond homepage CTAs
- Deploy, preview, CI/CD
- Inventing unshipped product features
- Dashboard layout restyle

## Requirements

- Copy follows [capability-matrix.md](../../marketing/capability-matrix.md) and
  [post-mvp-baseline.md](../../roadmap/post-mvp-baseline.md).
- CTAs go to `/platform` and `/demo` or `/login` (`LOGIN_PATH`). Sign-in is not a new marketing
  route.
- WCAG 2.1 AA-oriented: landmarks, keyboard, visible focus, heading hierarchy.
- Desktop, tablet, and mobile.
- Synthetic demo data only. Do not introduce real PHI.
- Do not claim HIPAA certification, production OAuth, live video, or hosted payments.

## Technical constraints

- Follow the project architecture.
- Do not require authentication for marketing routes.
- Do not couple marketing pages to dashboard session or TanStack Query domain APIs.
- Reuse FE-018 tokens and `components/ui` primitives.

## Acceptance criteria

- [x] `/` matches the approved Home frame
- [x] CTAs reach `/platform` and `/demo` or `/login`
- [x] Copy follows the capability matrix
- [x] Page is keyboard-accessible with semantic landmarks
- [x] Layout is usable at desktop, tablet, and mobile widths
- [x] Vitest covers homepage section/CTA smoke; Playwright covers home → platform and
      home → demo/login

## Dependencies

- Blocked by: [FE-018](FE-018-design-system-and-visual-language.md) (`design.status: approved`)
- Blocks: [FE-023](FE-023-marketing-polish-and-product-visuals.md)
- Figma URL (approved):
  https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=20-50
- Canonical frame: Homepage / Desktop 1440 (`20:50`)
- Layout frames: Homepage / Tablet 768 (`21:97`), Homepage / Mobile 390 (`21:143`)

## Validation

Browser check of the homepage at desktop, tablet, and mobile. Existing marketing Playwright suite
plus new home navigation cases. Lint, type-check, and frontend tests.

## Risks / considerations

- Do not over-claim modules that are session-shell, invoice-only, or mock-analytics.
- Product-preview assets may be labeled placeholders until FE-023.

## Implementation notes

Home remains `apps/web/src/app/(marketing)/page.tsx`. Prefer composing marketing section
components over expanding `MarketingPage` into a one-off layout.

## Completion

- Implementation: Replaced the `/` placeholder with composed marketing sections (hero, modules,
  workflow, labeled product preview, UX/security principles, roles, demo CTA) using FE-018 tokens,
  `Button`/`Card`, and existing `MarketingShell`. Canonical Figma frame Homepage / Desktop 1440
  (`20:50`); tablet/mobile used as layout breakpoints. Product UI remains a labeled placeholder
  until FE-023.
- Tests: Vitest `marketing-home.test.tsx` (sections + CTA hrefs); Playwright marketing spec
  updated for the new home `h1` plus home → platform and home → demo → login. Type-check passed.
- PR:
- Notes: Version 0.46.0 → 0.47.0 (MINOR, new public UI). `design.required: true` with
  `file_url` node-id `20-50`. Full Vitest suite still has two pre-existing `patient-form`
  timeouts unrelated to this task. Dev-mode hydration overlay on `MarketingShell` is pre-existing.
