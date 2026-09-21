---
id: BE-001
type: task
area: backend
feature: core-platform
status: implemented
priority: high
estimate: 3
dependencies: []
related_adrs: [ADR-001, ADR-004, ADR-006, ADR-009]
related_docs:
  [
    backend-architecture.md,
    api-architecture.md,
    ../workflows/api-contract-workflow.md,
    ../contracts/identity-and-access.md,
    ../contracts/data-contracts.md,
  ]
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

- [x] NestJS app bootstraps
- [x] Global validation configured
- [x] Error envelope defined
- [x] Correlation ID defined
- [x] Health/readiness endpoints exist

## Implementation notes

Do not split into microservices.

OpenAPI generation, Swagger UI, and the committed `apps/api/openapi/openapi.json` artifact belong to
[BE-002](BE-002-openapi-foundation.md), not this task. If the API listen port differs from the
Postman local `baseUrl` placeholder (`http://localhost:3001`), update
`postman/environments/local.postman_environment.json` in the same change or in BE-002.

## Completion

- Implementation: NestJS 12 ESM app in `apps/api` (`medconnect-api`); listen port 3001; Zod
  Standard Schema validation; error envelope; `X-Correlation-ID`; PHI-safe request logs;
  unauthenticated `GET /health` and `GET /ready`.
- Tests: Vitest unit tests for correlation/filter; HTTP tests for health/ready/validation envelope
  (`npm run test:api`).
- PR:
- Notes: No OpenAPI, Identity/guards, or PostgreSQL. Follows SEC-001 identity contract without
  implementing it. Nest Vitest runner also closes the remaining QA-001 backend AC.
