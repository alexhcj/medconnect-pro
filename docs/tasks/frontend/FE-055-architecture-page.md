---
id: FE-055
type: task
area: frontend
feature: marketing
status: pending
priority: medium
estimate: 5
dependencies: [FE-022, FE-051]
related_adrs: [ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../architecture/backend-architecture.md,
    ../../architecture/data-architecture.md,
    ../../architecture/infrastructure-architecture.md,
    ../../architecture/security-architecture.md,
    ../../marketing/sitemap.md,
    ../../marketing/capability-matrix.md,
    FE-022-security-about-and-demo-pages.md,
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
  work_item_id: a258e3ac-524a-4832-8181-6bd413be14db
  identifier: MEDCONNECT-146
---

# FE-055 — Architecture page

## Objective

One `/architecture` page where a non-technical visitor can see how the parts of MedConnect Pro
connect, and a technical reviewer can see where each security control is enforced.

## Context

- `/about` describes the architecture in three text cards: frontend, API and database.
- No doc or task plans a visual architecture view.
- `/security` "Implemented controls" lists controls without saying where they live.
- `docs/marketing/sitemap.md` fixes the top nav at five items.

## Scope

- New static route `/architecture`. It is not in the top nav. It is linked from:
  - About › Architecture ("View architecture");
  - each `/security` implemented control ("Where it's enforced" → `/architecture#<layer>`);
  - the footer;
  - `app/sitemap.ts`.
- **System map**: a hand-built React SVG. Selecting a node shows a plain-language "what it does"
  panel. Nodes:
  - marketing site and web app;
  - NestJS API, a modular monolith with domain modules;
  - PostgreSQL, with practice scoping and RLS;
  - external providers: Daily, the OIDC adapter and Render hosting;
  - planned services, drawn dashed: Redis, S3/KMS and AWS production.
- **Request and authorization flow**: the existing five-step model from `/security`, drawn as a
  flow.
- **Current vs planned**: `MARKETING_ABOUT_STACK` moves here, and `/about` links to it.
- New `marketing-architecture-copy.ts`, sourced from `docs/architecture/*`.
- **Docs**: add the route and footer link to `sitemap.md`. Add capability matrix and `docs/product/`
  rows if a new claim appears.
- **Figma**: a new page with frames at 1440, 768 and 390.

## Out of Scope

- Separate pages per layer.
- Mermaid or any other new diagram dependency.
- Live data in the diagram.

## Requirements

- Accessible:
  - the SVG has a title and a description;
  - nodes are buttons in a logical tab order;
  - the same content is available as a visible list, which replaces the SVG below `md`.
- Plain language first, technical name second (for example "Database — PostgreSQL").
- Planned and external items are dashed and labelled, and never presented as current.
- No claim beyond the capability matrix: no hosted AWS production and no HIPAA claim.

## Acceptance Criteria

- [ ] `/architecture` renders the map, the flow and the current vs planned section.
- [ ] Every node opens by mouse, touch and keyboard, and the list view shows the same content.
- [ ] The links from About, each Security control, the footer and the sitemap all work.
- [ ] Planned items are dashed and labelled "Planned".
- [ ] `sitemap.md` and the matrix are updated, and `npm run docs:marketing-sync` passes.
- [ ] The Figma frames match.

## Dependencies

- Blocked by: FE-051. Related: FE-022, SEC-005.
- Design: Figma file https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System
  (new page; frame IDs added on approval).

## Validation

- Unit tests for node selection and the list fallback.
- Marketing e2e for the new route and the links into it.
- Lint and type-check.
- Preview at the five widths and a keyboard-only pass.

## Risks / considerations

- The diagram can go stale. Its module list comes from `docs/architecture/backend-architecture.md`,
  so review it whenever that doc changes.
