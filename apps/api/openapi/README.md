# Generated OpenAPI

This directory holds the machine-readable API contract once NestJS exists.

**Path:** `apps/api/openapi/openapi.json`

That file is **generated** from NestJS (`@nestjs/swagger`) by [BE-002](../../docs/tasks/backend/BE-002-openapi-foundation.md).
Do not create it by hand. Do not edit endpoint definitions inside it. Do not copy a Postman export
here and treat it as OpenAPI source.

Until [BE-002](../../docs/tasks/backend/BE-002-openapi-foundation.md) adds generation, this
directory has no JSON artifact. Do not fabricate a specification of unimplemented domain endpoints.

When generation exists:

1. Run `npm run openapi:generate` (name may be adjusted in BE-002).
2. Commit the JSON so Postman import and contract diffs work without a running server.
3. Re-import into Postman per [api-contract-workflow.md](../../docs/workflows/api-contract-workflow.md).

The document must not contain secrets, tokens, credentials, or real patient information. Examples
must be synthetic.

Human-readable design remains in [`/docs/contracts/`](../../docs/contracts/).
