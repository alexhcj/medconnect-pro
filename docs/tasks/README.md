# Task System

Each task is a Markdown file with YAML front matter.

```text
docs/tasks/<area>/<ID>-<slug>.md
```

Title lives in the Markdown heading (`# FE-003 — Patient profile`), not in YAML. Keep
`type: task`. Do not add a nested `implementation.dependencies` list; use top-level
`dependencies`.

Do not backfill shipped tasks. Optional nested blocks apply to **new** tasks and any still-`pending`
UI task. Existing `implemented` / `completed` specs stay as they are.

## YAML

Contains machine-readable metadata:

- id
- type (`task`)
- area
- feature
- status (`pending`, `implemented`, or `completed`)
- priority
- estimate
- dependencies
- related ADRs
- related docs
- optional nested `design`, `implementation`, and `validation` (see below)
- Plane mapping

Nested `design` / `implementation` / `validation` are Git-only. Plane sync reads top-level scalars
and the `plane:` block; it does not map nested design fields. Repeat the Figma URL in Markdown
**Dependencies** so Plane descriptions still show it.

### Optional nested blocks

```yaml
design:
  required: true
  tool: figma             # figma | pencil
  file_url: ""
  frame: ""
  status: not_started     # not_started | in_progress | approved | not_required

implementation:
  status: not_started     # not_started | in_progress | complete

validation:
  responsive: true        # applies-to flags, not pass/fail
  accessibility: true
  tests_required: true
```

- Omit the entire `design` block on non-UI work (backend, infra, security, QA), or set
  `required: false` / `status: not_required`.
- UI tasks default to `design.required: true`. Do not implement while that is true and
  `design.status` is not `approved`.
- Nested statuses are independent of top-level `pending` / `implemented` / `completed`.
  Completing a task still means top-level `implemented` or `completed` plus the Markdown
  Completion section.
- `validation.*` flags mean that kind of check applies, not that it passed. Evidence stays in
  acceptance criteria and Completion.

#### UI example

```yaml
id: FE-018
type: task
area: frontend
feature: marketing
status: pending
priority: high
estimate: 3
dependencies: [FE-017]
related_adrs: []
related_docs: [frontend-architecture.md]
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
```

#### Non-UI example

```yaml
id: BE-011
type: task
area: backend
feature: core-platform
status: pending
priority: medium
estimate: 2
dependencies: [BE-001]
related_adrs: []
related_docs: [backend-architecture.md]
implementation:
  status: not_started
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: null
  identifier: null
```

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

Repository status expresses implementation/documentation intent (`pending`, `implemented`, or
`completed`).

Plane owns operational project-management status.

## Task naming

Examples:

- `FE-001-dashboard-shell.md`
- `BE-001-nestjs-core-platform-foundation.md`
- `SEC-001-authentication-and-authorization-model.md`
- `INFRA-001-local-development-foundation.md`
- `QA-001-test-foundation.md`

Lifecycle: [feature-development.md](../workflows/feature-development.md).
