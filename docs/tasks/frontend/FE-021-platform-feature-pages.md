---
id: FE-021
type: task
area: frontend
feature: marketing
status: implemented
priority: high
estimate: 5
dependencies: [FE-018, FE-020]
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
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=36-82"
  frame: "Patient management / Desktop 1440 (36:82)"
  status: approved
implementation:
  status: complete
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: 165e2978-5829-45b6-8cf1-a369f7ff195b
  identifier: MEDCONNECT-56
---

# FE-021 — Platform feature pages

## Objective

Add dedicated platform feature pages that explain each demonstrable module with a reusable
structure and product UI as the primary visual.

## Context

[FE-020](FE-020-platform-overview.md) provides the feature map and layout primitives.
[FE-017](FE-017-marketing-website-foundation.md) planned `/platform/*` without implementing them.
Sign-in is **not** a marketing route; CTAs use existing `/login`.

Do not start UI implementation while `design.status` is not `approved`. Use the same Figma file as
FE-018; record the feature-page frames. Repeat the Figma URL in Markdown Dependencies. Design is
approved on the Feature Pages canvas; implementation is a separate plan.

## Scope

Routes (FE-017 proposal; not a new `/scheduling` path):

- `/platform/patient-management`
- `/platform/appointments`
- `/platform/telehealth`
- `/platform/billing`
- `/platform/analytics`
- `/platform/administration`

Shared page structure for all six:

1. Hero — what the module does and who benefits
2. Key capabilities
3. Product walkthrough — real application UI as the primary visual (labeled placeholder allowed
   until [FE-023](FE-023-marketing-polish-and-product-visuals.md))
4. Workflow — how the module fits the platform
5. Related modules
6. CTA — demo or platform overview

Capability copy must match [capability-matrix.md](../../marketing/capability-matrix.md):

- Patient: directory, profiles, vitals/clinical, documents, history (implemented)
- Scheduling: calendar, appointments, availability (implemented)
- Telehealth: virtual-visit workflow as session shell; label not live video
- Billing: invoices implemented; payments/claims as labeled boundaries
- Analytics: mock overview cards; live `GET /dashboard/overview` planned
- Administration: users and audit viewer; no role PATCH

## Out of scope

- Building missing product features (live video, payments, analytics API, notifications UI)
- AI mockups as **final** visuals (placeholders OK until FE-023)
- Homepage, Security, About, Demo page bodies
- Deploy/preview
- Dashboard layout restyle
- New `/sign-in` marketing route

## Requirements

- Public; no dashboard session or TanStack Query domain APIs.
- WCAG 2.1 AA-oriented; desktop, tablet, and mobile.
- Synthetic demo data only. Do not introduce real PHI.
- Do not claim HIPAA certification, production OAuth, live video, or hosted payments.

## Technical constraints

- Follow the project architecture.
- Reuse FE-020 `FeaturePageLayout` and FE-018 tokens/`components/ui`.
- Do not couple marketing pages to authenticated workflow APIs.

## Acceptance criteria

- [x] All six routes render the shared structure
- [x] Walkthrough uses product UI or a labeled placeholder until FE-023
- [x] Related-module links resolve to the other feature pages or `/platform`
- [x] Copy is capability-matrix accurate
- [x] Pages are keyboard-accessible with semantic landmarks
- [x] Layouts are usable at desktop, tablet, and mobile widths
- [x] Playwright covers platform overview → each feature page

## Dependencies

- Blocked by: [FE-018](FE-018-design-system-and-visual-language.md),
  [FE-020](FE-020-platform-overview.md)
- Blocks: [FE-023](FE-023-marketing-polish-and-product-visuals.md)
- Related shipped product UI: FE-001–FE-016 (visual source, not restyle)
- Figma URL (approved):
  https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=36-82
- Canonical frame: Patient management / Desktop 1440 (`36:82`)
- Desktop set: Appointments (`36:105`), Telehealth (`36:128`), Billing (`36:151`),
  Analytics (`36:174`), Administration (`36:197`)
- Layout frames: Patient management / Tablet 768 (`38:397`),
  Patient management / Mobile 390 (`38:463`)
- Feature Pages canvas: `36:81`
- Generic template (FE-020): Feature page / Desktop 1440 (`21:195`)

## Validation

Browser check of each feature page. Playwright: `/platform` → each `/platform/*` route. Lint,
type-check, and frontend tests.

## Risks / considerations

- Over-claiming telehealth, billing, or analytics is a portfolio credibility failure.
- Do not capture or present real PHI in screenshots.

## Implementation notes

Keep feature pages under `apps/web/src/app/(marketing)/platform/`. Share one layout component
rather than six one-off pages.

## Completion

- Implementation: Six `/platform/*` routes compose `FeaturePageLayout` via
  `MarketingFeaturePage` and Figma-transcribed copy in `marketing-feature-pages-copy.ts`.
  Walkthroughs remain labeled placeholders until FE-023. Header/footer stay `MarketingShell`.
  Hero/CTA stack until `lg` to match tablet/mobile frames; capabilities are one column below
  `lg`. CTAs use `/demo` and `/platform`; sign-in remains `/login`.
- Tests: `marketing-feature-pages.test.tsx`; Playwright marketing spec covers `/platform` → each
  feature-page `h1`. Vitest 247 passed; Playwright marketing spec 4 passed; type-check passed.
- PR:
- Notes: Design approved on the shared Figma file
  https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=36-82
  (Patient management / Desktop 1440 `36:82`; tablet `38:397`; mobile `38:463`).
  Desktop frames: Appointments `36:105`, Telehealth `36:128`, Billing `36:151`,
  Analytics `36:174`, Administration `36:197`. Version 0.49.0.
