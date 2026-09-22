---
id: INFRA-003
type: task
area: infrastructure
feature: api-contract
status: completed
priority: high
estimate: 1
dependencies: []
related_adrs: [ADR-004]
related_docs:
  [
    api-architecture.md,
    ../workflows/api-contract-workflow.md,
    ../contracts/api-endpoints.md,
    ../contracts/data-contracts.md,
  ]
plane:
  work_item_id: 0c5f30e7-7811-446d-aa40-42ae443993c5
  identifier: MEDCONNECT-32
---

# INFRA-003 — OpenAPI, Postman, and Swagger workflow

## Objective

Establish a maintainable API documentation and testing workflow: human-readable contracts in
`/docs/contracts/`, generated OpenAPI from NestJS once the API exists, Postman as the primary
interactive client, and optional Swagger UI as a viewer of the same specification.

## Scope

Documentation, Cursor rules, OpenAPI artifact location conventions, and Postman environment
scaffolding. Do not initialize NestJS or fabricate an OpenAPI document of unimplemented endpoints.

Runtime `@nestjs/swagger` integration remains [BE-002](../backend/BE-002-openapi-foundation.md)
after [BE-001](../backend/BE-001-nestjs-core-platform-foundation.md).

## Technical constraints

- Follow [ADR-004](../../decisions/ADR-004-api-contracts.md).
- Do not add NestJS packages under `apps/api` in this task.
- Do not commit secrets, tokens, or real patient information.
- Use synthetic examples only.
- Do not require a paid Postman plan.
- Do not treat hiding Swagger UI as an API security control.

## Acceptance criteria

- [x] Workflow documented: contracts → NestJS (future) → OpenAPI → Postman; Swagger UI optional
- [x] Generated artifact location documented; no fabricated `openapi.json`
- [x] `postman/` exists with README, naming convention, and local/demo environment templates
- [x] Import/update limitations documented (no live auto-sync)
- [x] Cursor rules and ADR-004 / API architecture aligned
- [x] Existing Markdown contracts preserved
- [x] `apps/api` remains a NestJS placeholder; no frontend API-client refactor

## Implementation notes

Developer workflow: [api-contract-workflow.md](../../workflows/api-contract-workflow.md).

## Completion

- Implementation: documentation and Postman/OpenAPI scaffolding in the same change as this task
- Tests: not applicable (no backend runtime)
- PR:
- Notes: BE-002 still owns generation, Swagger UI, and contract tests after BE-001
