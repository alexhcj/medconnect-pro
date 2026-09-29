---
id: FE-021
type: task
area: frontend
feature: marketing
status: pending
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
  work_item_id: null
  identifier: null
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
FE-018; record the feature-page frames. Repeat the Figma URL in Markdown Dependencies.

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

- [ ] All six routes render the shared structure
- [ ] Walkthrough uses product UI or a labeled placeholder until FE-023
- [ ] Related-module links resolve to the other feature pages or `/platform`
- [ ] Copy is capability-matrix accurate
- [ ] Pages are keyboard-accessible with semantic landmarks
- [ ] Layouts are usable at desktop, tablet, and mobile widths
- [ ] Playwright covers platform overview → each feature page

## Dependencies

- Blocked by: [FE-018](FE-018-design-system-and-visual-language.md),
  [FE-020](FE-020-platform-overview.md)
- Blocks: [FE-023](FE-023-marketing-polish-and-product-visuals.md)
- Related shipped product UI: FE-001–FE-016 (visual source, not restyle)
- Figma URL (fill when approved):
- Frame (fill when approved):

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

- Implementation:
- Tests:
- PR:
- Notes:
