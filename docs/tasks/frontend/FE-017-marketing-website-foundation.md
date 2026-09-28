---
id: FE-017
type: task
area: frontend
feature: marketing
status: implemented
priority: high
estimate: 3
dependencies: [FE-001, FE-010]
related_adrs: [ADR-009-npm-workspace-monorepo.md]
related_docs:
  [
    frontend-architecture.md,
    ../01-product-requirements.md,
    ../../roadmap/post-mvp-baseline.md,
    ../../roadmap/release-roadmap.md,
    ../../marketing-website-foundation-proposal.md,
  ]
plane:
  work_item_id: 9f41b297-b3bb-4bce-a80d-d570f4e16a2d
  identifier: MEDCONNECT-50
---

# FE-017 — Marketing Website Foundation

## Objective

Establish the public marketing route group, layout, and placeholder pages so later design and
page-implementation tasks can land without restructuring App Router or mixing marketing chrome
into the authenticated dashboard.

## Scope

Structural foundation only for M8:

- public `(marketing)` route group isolated from `(auth)` and `(dashboard)`;
- shared marketing layout (header, footer, accessible mobile navigation, page container);
- placeholder routes for `/`, `/platform`, `/security`, `/about`, and `/demo`;
- Next.js metadata foundation (title and description per page);
- reuse existing UI primitives where they already fit; add marketing-only composition only when
  dashboard chrome would leak into public pages.

Planning brief (not a second implementation contract):
[marketing-website-foundation-proposal.md](../../marketing-website-foundation-proposal.md).
Capability wording must match [post-mvp-baseline.md](../../roadmap/post-mvp-baseline.md).

## Out of scope

- Finished marketing copy, Figma/Pencil exploration, or approved visual design
- Detailed `/platform/*` feature pages
- Product screenshot/preview assets
- Notifications UI, dashboard analytics API, OAuth, Daily/WebRTC
- CI/CD, preview environments, Docker, Terraform, or any hosted deploy (later milestone)

## Technical constraints

- Follow the project architecture.
- Do not require authentication for marketing routes.
- Do not couple marketing pages to dashboard session or TanStack Query domain APIs.
- Use synthetic demo data only. Do not introduce real PHI.
- Follow accessibility and responsive requirements (WCAG 2.1 AA-oriented).
- Do not introduce a second design system or unused dependencies.
- Do not claim HIPAA certification, production OAuth, live video, or hosted payments.

## Acceptance criteria

- [x] `(marketing)` route group exists and does not inherit dashboard shell or auth gates
- [x] Shared marketing layout renders header, footer, and accessible mobile navigation
- [x] Routes `/`, `/platform`, `/security`, `/about`, and `/demo` render placeholder content
- [x] `/demo` links into the existing login/demo path rather than inventing a new auth mechanism
- [x] Each marketing page has a document title and description
- [x] Marketing layout is keyboard-accessible with semantic landmarks
- [x] Layout is usable at desktop, tablet, and mobile widths
- [x] Placeholder copy does not claim HIPAA compliance, production OAuth, live video, or payments
- [x] Vitest covers marketing nav/layout smoke; Playwright mock suite covers public nav to the
      placeholder pages
- [x] Frontend architecture and release/frontend roadmaps describe the marketing group

## Implementation notes

Keep dashboard information density; marketing can be more spacious. Share tokens/primitives, not
the dashboard shell. Home lives at `apps/web/src/app/(marketing)/page.tsx`.

## Completion

- Implementation: Public `(marketing)` group with `MarketingShell` (header, footer, Headless UI
  mobile nav) isolated from `(auth)` and `(dashboard)`. Placeholder pages at `/`, `/platform`,
  `/security`, `/about`, and `/demo`. `/demo` uses `LOGIN_PATH` (`/login`). Per-page title and
  description metadata. Qualified demo copy only.
- Tests: Vitest `marketing-shell` landmarks/mobile-nav and `marketing-nav` hrefs; Playwright mock
  `e2e/marketing.spec.ts` public nav plus demo → login.
- PR:
- Notes: Existing `/privacy-policy` and `/terms-of-service` remain outside marketing chrome (they
  still claim HIPAA). Deploy/preview is a later milestone. Planning brief path is
  `docs/marketing-website-foundation-proposal.md`.
