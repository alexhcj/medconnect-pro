---
id: FE-023
type: task
area: frontend
feature: marketing
status: pending
priority: high
estimate: 2
dependencies: [FE-019, FE-020, FE-021, FE-022]
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

# FE-023 — Marketing polish and product visuals

## Objective

Close remaining M8 marketing work with real product screenshots or previews, responsive and
accessibility QA, and SEO basics beyond the FE-017 title and description foundation.

## Context

FE-019–FE-022 may ship labeled visual placeholders. This task replaces those with captured
application UI (synthetic data only) and validates the public site as a whole. Deploy/preview
stays a later milestone.

Do not start UI implementation while `design.status` is not `approved` if this task adds or
changes frames. Use the same Figma file as FE-018 when recording `file_url`. Repeat the Figma URL
in Markdown Dependencies.

## Scope

- Replace AI or labeled placeholders with captured app UI on home, platform, and feature pages.
- Open Graph (and similar) metadata if missing.
- Responsive QA at desktop, tablet, and mobile.
- Accessibility pass on marketing routes (landmarks, keyboard, contrast, heading hierarchy).
- Sitemap.xml/robots only if already half-present; do not over-engineer SEO.

## Out of scope

- Hosting, CI, Docker, Terraform, preview environments
- Building missing product features to make screenshots look more complete
- Dashboard layout restyle
- Rewriting `/privacy-policy` and `/terms-of-service`

## Requirements

- Visuals use synthetic demo data only. Do not introduce real PHI.
- Do not present unlabeled synthetic records as production patient data.
- Copy remains capability-matrix accurate.
- WCAG 2.1 AA-oriented.

## Technical constraints

- Follow the project architecture.
- Do not add unused SEO or screenshot tooling.
- Do not couple marketing pages to live PHI or dashboard session APIs for asset capture beyond
  local synthetic demo.

## Acceptance criteria

- [ ] Home and feature walkthroughs use real application UI
- [ ] Visuals do not present unlabeled synthetic-looking records as production PHI
- [ ] Marketing Playwright suite still passes
- [ ] Responsive behavior is checked at desktop, tablet, and mobile
- [ ] Accessibility review of marketing routes is recorded in Completion
- [ ] Open Graph or equivalent social metadata exists if it was missing

## Dependencies

- Blocked by: [FE-019](FE-019-marketing-homepage.md),
  [FE-020](FE-020-platform-overview.md),
  [FE-021](FE-021-platform-feature-pages.md),
  [FE-022](FE-022-security-about-and-demo-pages.md)
- Blocks: later deployment/preview milestone (no task yet)
- Figma URL (fill when approved):
- Frame (fill when approved):

## Validation

Re-run marketing Playwright. Manual responsive and accessibility pass. Lint, type-check, and
production build for `apps/web`. Record evidence in Completion.

## Risks / considerations

- Screenshot capture can accidentally include developer tools or non-synthetic data; keep a
  dedicated synthetic demo session.
- Do not treat this task as permission to restyle the authenticated shell.

## Implementation notes

Prefer static assets under the web app that are obviously demo UI. Improving the product UI
improves these assets; do not invent a parallel illustration set as the long-term source.

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
