---
id: BE-001
type: task
area: backend
feature: core-platform
status: planned
priority: high
estimate: 3
dependencies: []
related_adrs: []
related_docs: [backend-architecture.md,api-architecture.md]
plane:
  work_item_id: null
  identifier: null
---

# BE-001 — NestJS core platform foundation

## Objective

Create the modular NestJS foundation and shared platform conventions.

## Scope

Modules, error format, validation, correlation IDs, logging and health endpoints.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [ ] NestJS app bootstraps
- [ ] Global validation configured
- [ ] Error envelope defined
- [ ] Correlation ID defined
- [ ] Health/readiness endpoints exist

## Implementation notes

Do not split into microservices.

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
