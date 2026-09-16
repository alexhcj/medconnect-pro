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
- `contracts/` — API/data contracts.
- `tasks/` — implementation work.
- `roadmap/` — sequencing and delivery milestones.
- `decisions/` — ADRs.
- `workflows/` — repeatable engineering processes.
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
