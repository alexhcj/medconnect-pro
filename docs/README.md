# MedConnect Pro Documentation

## Purpose

`/docs` is the canonical repository source for product intent, architecture, contracts, decisions,
implementation tasks, roadmaps and development workflows.

## Source-of-truth hierarchy

1. `decisions/` — architectural decisions and their rationale.
2. `01-product-requirements.md` — product behavior and priorities.
3. `architecture/` — technical structure and boundaries.
4. `contracts/` — API and data boundaries.
5. `tasks/` — implementation contracts.
6. `roadmap/` — sequencing.
7. `workflows/` — engineering process.
8. Source code — current implementation.

## Directory guide

- `00-project-spec.md` — project identity, goals, stack and global constraints.
- `01-product-requirements.md` — functional/non-functional product requirements.
- `architecture/` — system structure.
- `contracts/` — API/data contracts, including
  [identity and access](contracts/identity-and-access.md).
- `tasks/` — implementation work.
- `roadmap/` — sequencing and delivery milestones, including the
  [post-MVP baseline](roadmap/post-mvp-baseline.md).
- `decisions/` — ADRs, including [ADR-009](decisions/ADR-009-npm-workspace-monorepo.md) for the
  npm workspace layout and [ADR-010](decisions/ADR-010-postgresql-typeorm.md) for PostgreSQL and
  TypeORM.
- `workflows/` — repeatable engineering processes, including [versioning](workflows/versioning.md),
  [frontend testing](workflows/frontend-testing.md),
  [API contract / Postman / OpenAPI](workflows/api-contract-workflow.md), and
  [design requirements](workflows/design-requirements.md) (workflow, not a paste prompt).
- `processes/prompts/` — paste-in Cursor prompts: [plan-mode](processes/prompts/plan-mode-prompt.md),
  [generate-new-task](processes/prompts/generate-new-task-prompt.md),
  [design-brief](processes/prompts/design-brief-prompt.md), and
  [milestone-close](processes/prompts/milestone-close-prompt.md).
- `processes/flows/` — [vibecoding](processes/flows/vibecoding-flow.md),
  [design-to-development](processes/flows/design-to-development-flow.md), and
  [design-checklist](processes/flows/design-checklist-flow.md).
- `mocks/` — synthetic demo data and mock-data conventions.

## Documentation rules

Document intent, contracts and decisions. Do not mirror every source-code detail.

When architecture or a contract changes, update the corresponding documentation in the same change
or explicitly record the required follow-up.

## Plane

Plane is the operational project-management layer.

Git remains canonical for requirements, architecture, ADRs and task definitions. Plane mirrors task
metadata and manages operational state such as cycles, assignees and work-item status.

Every task has a stable repository ID such as `FE-001`. Plane's work-item ID is stored in task
metadata after synchronization.

## Demo data

Only synthetic data is allowed. The project must never use real patient records, credentials,
medical records or other real PHI.
