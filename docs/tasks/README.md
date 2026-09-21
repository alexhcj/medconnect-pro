# Task System

Each task is a Markdown file with YAML front matter.

```text
docs/tasks/<area>/<ID>-<slug>.md
```

## YAML

Contains machine-readable metadata:

- id
- type
- area
- feature
- status
- priority
- estimate
- dependencies
- related ADRs
- related docs
- Plane mapping

## Markdown

Contains:

- objective;
- scope;
- requirements;
- technical constraints;
- acceptance criteria;
- implementation notes;
- completion evidence.

## Stable IDs

Repository task IDs are permanent.

Plane and GitHub IDs are external references and may differ.

## Status ownership

Repository status expresses implementation/documentation intent.

Plane owns operational project-management status.

## Task naming

Examples:

- `FE-001-patient-list.md`
- `BE-001-authentication-foundation.md`
- `SEC-001-tenant-authorization.md`
- `INFRA-001-local-development-foundation.md`
- `QA-001-patient-workflow-e2e.md`
