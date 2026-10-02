---
id: FE-023
type: task
area: frontend
feature: marketing
status: implemented
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
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=78-25"
  frame: "Product visual (78:25)"
  status: approved
implementation:
  status: in_progress
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: 9cf31950-11a3-456f-958b-18c71fb2bafc
  identifier: MEDCONNECT-58
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

- [x] Home and feature walkthroughs use real application UI
- [x] Visuals do not present unlabeled synthetic-looking records as production PHI
- [x] Marketing Playwright suite still passes
- [x] Responsive behavior is checked at desktop, tablet, and mobile
- [x] Accessibility review of marketing routes is recorded in Completion
- [x] Open Graph or equivalent social metadata exists if it was missing

## Dependencies

- Blocked by: [FE-019](FE-019-marketing-homepage.md),
  [FE-020](FE-020-platform-overview.md),
  [FE-021](FE-021-platform-feature-pages.md),
  [FE-022](FE-022-security-about-and-demo-pages.md)
- Blocks: later deployment/preview milestone (no task yet)
- Figma URL (approved):
  https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=78-25
- Canonical frame: Product visual (`78:25`) — variants Layout=SliderDesktop (`78:7`),
  SliderTablet (`87:2`), SliderMobile (`78:16`), Single (`78:10`), Login (`78:13`)
- Page proof: Homepage / Desktop 1440 (`20:50`); tablet (`21:97`); mobile (`21:143`)
- Feature proof: Patient management / Desktop 1440 (`36:82`); tablet (`38:397`);
  mobile (`38:463`)
- Demo proof: Demo / Desktop 1440 (`41:11`); tablet (`44:646`); mobile (`44:690`)
- Open Graph: Open Graph / 1200x630 (`78:19`)
- Canvas: FE-023 Product visuals (`78:6`)

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

- Implementation: Replaced marketing placeholders with static synthetic captures under
  `apps/web/public/marketing/`. Home Product UI is an accessible CSS scroll-snap slider (six
  screens; two visible from `md`, one on base, peek of the next slide; prev/next and arrow keys;
  `aria-roledescription="carousel"`). Feature walkthroughs and Demo login use the same assets.
  Shared Open Graph / Twitter cards use `/marketing/og.png` (Dashboard crop). About no longer
  calls captured visuals a later M8 task.
- Tests: Vitest home slider (six alts, 2/1 layout classes, controls/keyboard), feature
  walkthrough images, demo login preview, broken-image fallback; Playwright marketing spec
  asserts Product UI is no longer a placeholder. Type-check passed. `npm run lint` currently
  fails on a pre-existing typescript-eslint / TypeScript 7 incompatibility, not on these files.
- PR:
- Notes: Design remains approved on
  https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=78-25
  (Product visual `78:25`; SliderDesktop `78:7`, SliderTablet `87:2`, SliderMobile `78:16`;
  OG `78:19`; Homepage proof `20:50`). Browser check: Home slider at 1440 (two + peek), 768
  (two + peek), and 390 (one + peek); Appointments crop is month calendar with events, not the
  loading skeleton. Accessibility: marketing landmarks and a single h1 per page remain; slider
  is a labeled carousel with short alts and a shared figcaption disclaimer; images are not
  links; 44px icon controls. Version 0.50.0 → 0.51.0 (MINOR, new public visual/SEO surface).
