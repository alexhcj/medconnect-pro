# Generated OpenAPI

This directory holds the machine-readable API contract generated from NestJS.

**Path:** `apps/api/openapi/openapi.json`

That file is **generated** from NestJS (`@nestjs/swagger`) by [BE-002](../../docs/tasks/backend/BE-002-openapi-foundation.md).
Do not edit endpoint definitions inside it. Do not copy a Postman export here and treat it as
OpenAPI source.

1. Run `npm run openapi:generate` from the repository root after controller or DTO changes.
2. Commit the JSON so Postman import and contract diffs work without a running server.
3. Re-import into Postman per [api-contract-workflow.md](../../docs/workflows/api-contract-workflow.md).

Runtime: `GET /api/docs-json` serves the same document. Optional Swagger UI is at `/api/docs`
(disable with `SWAGGER_UI_ENABLED=false`).

The document must not contain secrets, tokens, credentials, or real patient information. Examples
must be synthetic.

Human-readable design remains in [`/docs/contracts/`](../../docs/contracts/).
