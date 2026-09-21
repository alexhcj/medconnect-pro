---
id: BE-002
type: task
area: backend
feature: api-contract
status: implemented
priority: high
estimate: 2
dependencies: [BE-001]
related_adrs: [ADR-004]
related_docs:
  [
    api-architecture.md,
    ../workflows/api-contract-workflow.md,
    ../contracts/api-endpoints.md,
    ../contracts/data-contracts.md,
  ]
plane:
  work_item_id: null
  identifier: null
---

# BE-002 — OpenAPI foundation

## Objective

Expose inspectable OpenAPI documentation from the NestJS API.

## Scope

Configure `@nestjs/swagger` on the BE-001 application. Generate OpenAPI from controllers and DTOs.
Expose optional Swagger UI and a raw JSON endpoint from the same document. Write
`apps/api/openapi/openapi.json`. Document Bearer auth and the BE-001 error envelope. Add a contract
test for an implemented platform route (health/readiness), not the full planned domain surface.

Pin `@nestjs/swagger` to the NestJS major chosen in BE-001 (12.x with Nest 12, 11.x with Nest 11).
Do not invent unimplemented domain endpoints solely to populate OpenAPI.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [x] `@nestjs/swagger` matches the NestJS major from BE-001
- [x] OpenAPI generation script writes `apps/api/openapi/openapi.json` (do not hand-edit)
- [x] Generated JSON is valid and includes title, description, version, and server metadata
- [x] Implemented routes appear with request/response schemas (initially platform/health)
- [x] HTTP Bearer security scheme documented; no secrets in the artifact
- [x] Error envelope schema documented
- [x] Raw OpenAPI JSON endpoint exists (for example `/api/docs-json` or `/openapi.json`)
- [x] Optional Swagger UI at `/api/docs` uses the same generated document
- [x] Swagger UI can be disabled via configuration in production-like deploys
- [x] Critical endpoint contract test exists against an implemented route
- [x] Workflow for re-importing the spec into Postman remains as documented

## Implementation notes

This is generated from backend decorators; Markdown remains the human-readable planning contract
([ADR-004](../../decisions/ADR-004-api-contracts.md)).

Postman is not a second OpenAPI source. After generation, import or update the collection from
`apps/api/openapi/openapi.json` per [api-contract-workflow.md](../../workflows/api-contract-workflow.md).

Hiding Swagger UI is not an authentication or authorization control.

Suggested scripts (names may be wired at the workspace root): `openapi:generate`,
`openapi:validate` (optional), `dev:api` (from BE-001).

## Completion

- Implementation: `@nestjs/swagger` 12.0.1; generated `apps/api/openapi/openapi.json`; live JSON at
  `/api/docs-json`; optional Swagger UI at `/api/docs` gated by `SWAGGER_UI_ENABLED` (off by default
  in production). Bearer scheme and error envelope documented; health/ready remain unauthenticated.
- Tests: Vitest contract tests in `apps/api/test/openapi.contract.spec.ts` (`npm run test:api`).
- PR:
- Notes: No domain routes invented. Postman remains import-from-OpenAPI; collections not hand-authored.

