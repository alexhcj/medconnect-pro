---
id: FE-055
type: task
area: frontend
feature: marketing
status: implemented
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
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System"
  frame: "FE-055 Architecture (354:1479) — Architecture / Desktop 1440 (354:1480), Tablet 768 (354:1574), Mobile 390 (354:1669); components Architecture node (356:480), Icon/Server (356:389), Icon/Cloud (356:392), Icon/Globe (356:397), Icon/Zap (356:400); Card Status 'Show link' (313:160); MarketingHeader nav item (48:1538); MarketingFooter link (64:48); Security / About link updates (41:3, 41:7 and breakpoints)"
  status: approved
implementation:
  status: complete
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
- `docs/marketing/sitemap.md` lists the top nav. FE-055 adds Architecture as the sixth item.

## Scope

- New static route `/architecture`. It is linked from:
  - the top nav, between About and Demo (desktop nav and the mobile menu);
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
- Planned items are dashed and labelled "Planned". External items are labelled "External".
  Neither is presented as current.
- No claim beyond the capability matrix: no hosted AWS production and no HIPAA claim.

## Acceptance Criteria

- [x] `/architecture` renders the map, the flow and the current vs planned section.
- [x] Every node opens by mouse, touch and keyboard, and the list view shows the same content.
- [x] The links from the top nav, About, each Security control, the footer and the sitemap all
      work, and the top nav marks Architecture as current on `/architecture`.
- [x] Planned items are dashed and labelled "Planned".
- [x] `sitemap.md` and the matrix are updated, and `npm run docs:marketing-sync` passes.
- [x] The Figma frames match.

## Dependencies

- Blocked by: FE-051. Related: FE-022, SEC-005.
- Design: Figma file https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System
  (page FE-055 Architecture, node 354:1479; frames 354:1480, 354:1574, 354:1669). Planned map
  nodes and the planned stack card use `bg-warning-subtle` with a dashed border and a neutral
  "Planned" badge.

## Validation

- Unit tests for node selection, the list fallback and the six nav items (`marketing-nav.test.ts`).
- Marketing e2e for the new route and the links into it.
- Lint and type-check.
- Preview at the five widths and a keyboard-only pass.

## Risks / considerations

- The diagram can go stale. Its module list comes from `docs/architecture/backend-architecture.md`,
  so review it whenever that doc changes.

## Completion

- Shipped at 0.100.0 (2026-10-29). MINOR: new public route and top-nav item.
- Implementation:
  - `marketing-architecture-copy.ts`: hero, 10 nodes (`id`, plain name, technical name, state,
    what it does, connections, controls; API modules from `backend-architecture.md`), groups, map
    SVG title and description, flow steps reused from `MARKETING_SECURITY_AUTHORIZATION` plus
    "enforced in", current vs planned (moved from About), CTA.
  - `marketing-architecture-map.tsx` (client): from `md`, an SVG (`role="img"`, title, desc) with
    connectors measured by `ResizeObserver` under HTML node buttons (`aria-pressed`) and an
    `aria-live="polite"` detail panel; below `md`, a grouped accordion list (`aria-expanded`).
    One shared selection, API by default; `/architecture#<node-id>` preselects and scrolls.
    Planned nodes are dashed `bg-warning-subtle`; External nodes are solid with a neutral badge.
  - `marketing-architecture.tsx` and `app/(marketing)/architecture/page.tsx`: hero, map, flow
    (row with arrows from `lg`, 3+2 at `md`, stacked below), current vs planned, CTA band.
  - Architecture added to `MARKETING_NAV` (header, mobile menu, footer) and `MARKETING_PATHS`.
  - `MarketingStatusCard` optional inline `link` beside the Badge; `/security` controls link to
    `#sign-in`, `#api` or `#database`. Tone map adds `External` (neutral).
  - `/about`: stack section removed; Architecture section ends with a "View architecture" link card.
- Tests: `marketing-architecture.test.tsx` (sections, SVG title/desc, tab order, mouse and
  keyboard selection, list parity and accordion, Planned and External labels, hash preselect and
  hashchange, flow, claim limits); status card, security, About, nav and sitemap-path tests;
  marketing e2e for the nav, About, Security and footer links, keyboard selection and a touch
  phone (tap, list replaces map, no horizontal scroll).
- Visual check (dev server): 1440, 768 and 390 match Figma frames 354:1480, 354:1574 and
  354:1669; no console errors; the Security → `#database` deep link selects Database.
