# API contract workflow

MedConnect Pro uses one generated OpenAPI document. Markdown describes design intent. Postman is
the primary interactive client. Swagger UI is optional.

This is a demonstration workflow. It does not imply HIPAA certification or production identity.

## Artifact ownership

| Artifact | Role | Edit by hand? |
| --- | --- | --- |
| [`docs/contracts/api-endpoints.md`](../contracts/api-endpoints.md) | Human-readable endpoint index | Yes |
| [`docs/contracts/data-contracts.md`](../contracts/data-contracts.md) | DTO/RDO and persistence boundaries | Yes |
| NestJS controllers and DTOs | Implementation and OpenAPI metadata | Yes (source) |
| `apps/api/openapi/openapi.json` | Machine-readable contract | **No** — generated |
| `postman/` collections | Exploration and API tests | Re-import from OpenAPI; do not invent a parallel API |
| Swagger UI (`/api/docs`) | Optional viewer of the same OpenAPI document | N/A |

Decision: [ADR-004](../decisions/ADR-004-api-contracts.md). Architecture:
[api-architecture.md](../architecture/api-architecture.md).

```text
/docs/contracts/
    ↓
NestJS controllers + DTOs
    ↓
Generated OpenAPI (apps/api/openapi/openapi.json)
    ├── Postman import
    └── Optional Swagger UI
```

## Current backend maturity

[BE-001](../tasks/backend/BE-001-nestjs-core-platform-foundation.md) initialized NestJS in `apps/api`
(listen port `http://localhost:3001`, health/readiness, error envelope, correlation IDs).
[BE-002](../tasks/backend/BE-002-openapi-foundation.md) generates `apps/api/openapi/openapi.json`,
serves it at `/api/docs-json`, and optionally shows Swagger UI at `/api/docs`.

Do not fabricate additional OpenAPI paths or a Postman collection of unimplemented domain routes.
Regenerate after controller or DTO changes, then re-import Postman from the committed JSON.

## Lifecycle of an endpoint

1. List the planned route in `docs/contracts/` if it is a new domain boundary.
2. Implement the controller, request DTO, and response DTO (RDO) in NestJS.
3. Ensure DTO validation and `@nestjs/swagger` metadata describe the real request and response.
4. Regenerate `apps/api/openapi/openapi.json` and commit the generated file (never edit it).
5. Re-import or update the Postman collection from that JSON.
6. Update Markdown only if the human index or conventions changed—not to copy schemas.

## Commands

| Command | Purpose | When |
| --- | --- | --- |
| `npm run dev:api` | Start the NestJS API | BE-001 (available) |
| `npm run test:api` | Backend platform tests | BE-001 (available) |
| `npm run openapi:generate` | Write `apps/api/openapi/openapi.json` | BE-002 (available) |

Frontend commands are unchanged (`npm run dev:mocks`, `lint`, `type-check`, `test`, `e2e`).

## OpenAPI artifact

- Path: `apps/api/openapi/openapi.json`
- Produced by NestJS (`SwaggerModule.createDocument` or equivalent), not by Postman
- Once generated, **commit** it so import and contract diffs work without a running server
- Must not contain secrets, tokens, or real patient information
- Examples and fixtures must be synthetic

Details: [`apps/api/openapi/README.md`](../../apps/api/openapi/README.md).

## Postman

Repository assets live in [`postman/`](../../postman/README.md). A paid Postman plan is not
required. Local import is enough.

### Collection naming

Use **MedConnect Pro API** for the imported collection (or `MedConnect Pro API — <environment>`
only if a fork is required). Do not maintain separately authored collections that redefine the same
paths.

### Environments

Committed templates:

- `postman/environments/local.postman_environment.json` — `baseUrl` `http://localhost:3001`
- `postman/environments/demo.postman_environment.json` — placeholder demo host

Variables:

- `baseUrl` — API origin, no trailing slash
- `accessToken` — Bearer token; keep **empty** in Git

Copy a template to a `*.local.json` file (gitignored) if you need a personal token.

### Authorization

Protected routes use HTTP Bearer (`Authorization: Bearer <token>`), consistent with
[ADR-003](../decisions/ADR-003-authentication.md). In Postman, set the collection or request auth
to Bearer Token and the token value to `{{accessToken}}`.

Do not weaken backend authentication to make Postman easier. Do not commit tokens.

Obtain a bearer token from the mock IdP stand-in (`POST /auth/login` on the Nest API) or, later,
from the OAuth authorization-code flow. Do not commit it. Platform health and readiness do not
require a token. Protected routes, including logout, require `Authorization: Bearer`.

### Import and update

Postman does **not** stay synchronized with the repository automatically.

When `openapi.json` exists (after `npm run openapi:generate`):

1. Postman → Import → file `apps/api/openapi/openapi.json`.
2. Select the **local** or **demo** environment.
3. Confirm collection auth uses `{{accessToken}}` and requests use `{{baseUrl}}`.
4. After later OpenAPI changes, import again and replace or merge the collection. Treat Postman as
   derived; resolve conflicts in NestJS, not by editing the spec in Postman.

### Examples and tests

- Request bodies and example responses: synthetic data only (see
  [ADR-005](../decisions/ADR-005-synthetic-demo-data.md)).
- Prefer Postman tests that assert status codes and the error envelope shape, not snapshots of PHI.
- Export collections to `postman/collections/` only when they add tests or examples that cannot
  live in OpenAPI; they must still match the generated contract.

## Swagger UI (optional)

- UI route: `/api/docs` (disabled when `SWAGGER_UI_ENABLED=false`; defaults off when `NODE_ENV=production`)
- Raw JSON: `/api/docs-json` (always served; same document as `apps/api/openapi/openapi.json`)
- Hiding Swagger UI is not a substitute for authentication or authorization

## Security

- Never commit credentials, API keys, or access tokens
- Never use real patient records in examples, OpenAPI, or collections
- API documentation does not make the demo HIPAA compliant
- Frontend mock auth is not production identity infrastructure
