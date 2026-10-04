# MedConnect Pro Documentation

## Purpose

`/docs` is the canonical repository source for product intent, architecture, contracts, decisions,
implementation tasks, roadmaps and development workflows.

## Source-of-truth hierarchy

1. `decisions/` — architectural decisions and their rationale.
2. `01-product-requirements.md` — complete-product target (unstatused vision).
3. `product/` — statused capability catalog (what the demo is today vs planned).
4. `architecture/` — technical structure and boundaries.
5. `contracts/` — API and data boundaries.
6. `tasks/` — implementation contracts.
7. `roadmap/` — sequencing.
8. `workflows/` — engineering process.
9. Source code — current implementation.

## Directory guide

- `00-project-spec.md` — project identity, goals, stack and global constraints.
- `01-product-requirements.md` — functional/non-functional product requirements (vision).
- `product/` — [capability registry](product/README.md): statused user-facing catalog.
  Public-claim ceiling remains [capability-matrix.md](marketing/capability-matrix.md).
- `architecture/` — system structure.
- `contracts/` — API/data contracts, including
  [identity and access](contracts/identity-and-access.md) and
  [environment configuration](contracts/environment-configuration.md).
- `tasks/` — implementation work, including optional nested design/implementation/validation
  metadata on new tasks (see [tasks/README.md](tasks/README.md)).
- `roadmap/` — sequencing and delivery milestones, including the
  [post-MVP baseline](roadmap/post-mvp-baseline.md).
- `decisions/` — ADRs, including [ADR-009](decisions/ADR-009-npm-workspace-monorepo.md) for the
  npm workspace layout, [ADR-010](decisions/ADR-010-postgresql-typeorm.md) for PostgreSQL and
  TypeORM, [ADR-011](decisions/ADR-011-figma-canonical-visual-source.md) for Figma as the
  canonical visual source, and [ADR-012](decisions/ADR-012-deployment-topology.md) for Amplify +
  ECS topology and local / preview / production.
- `workflows/` — repeatable engineering processes, including [versioning](workflows/versioning.md),
  [frontend testing](workflows/frontend-testing.md),
  [API contract / Postman / OpenAPI](workflows/api-contract-workflow.md), and
  [design requirements](workflows/design-requirements.md) (workflow, not a paste prompt).
- `processes/prompts/` — paste-in Cursor prompts: [plan-mode](processes/prompts/plan-mode-prompt.md),
  [generate-new-task](processes/prompts/generate-new-task-prompt.md),
  [design-brief](processes/prompts/design-brief-prompt.md),
  [figma design system](processes/prompts/figma-design-system-prompt.md),
  [Pencil exploration](processes/prompts/pencil-design-prompt.md), and
  [milestone-close](processes/prompts/milestone-close-prompt.md).
- `processes/flows/` — [vibecoding](processes/flows/vibecoding-flow.md),
  [design-to-development](processes/flows/design-to-development-flow.md), and
  [design-checklist](processes/flows/design-checklist-flow.md).
- `marketing/` — public-site [requirements](marketing/requirements.md),
  [sitemap](sitemap.md), and [capability matrix](marketing/capability-matrix.md) (claim view of
  `product/`). Implementation contracts are FE-018–FE-023.
- `releases/` — GitHub [v1.0.0 release-notes template](releases/github-release-notes-template.md)
  (INFRA-012). INFRA-013 fills placeholders; do not auto-publish.
- `mocks/` — synthetic demo data and mock-data conventions.

## Documentation rules

Document intent, contracts and decisions. Do not mirror every source-code detail.

When architecture or a contract changes, update the corresponding documentation in the same change
or explicitly record the required follow-up.

## Plane

Plane is the operational project-management layer.

Git remains canonical for requirements, architecture, ADRs, the
[capability registry](product/README.md), and task definitions. Plane mirrors task
metadata and manages operational state such as cycles, assignees and work-item status.

Every task has a stable repository ID such as `FE-001`. Plane's work-item ID is stored in task
metadata after synchronization. Product capability IDs (`telehealth.start-session`) are not
Plane-synced.

## Demo data

Only synthetic data is allowed. The project must never use real patient records, credentials,
medical records or other real PHI.
