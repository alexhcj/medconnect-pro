# `apps/api`

Modular NestJS 12 platform for MedConnect Pro (`medconnect-api`).

Listen port: **3001** (matches Postman local `baseUrl`). OpenAPI generation and Swagger UI belong to
[BE-002](../../docs/tasks/backend/BE-002-openapi-foundation.md). Identity/OAuth guards are not in
this app yet; follow [identity-and-access.md](../../docs/contracts/identity-and-access.md) when they
are added. Persistence is [DATA-001](../../docs/tasks/backend/DATA-001-postgresql-tenant-model.md).

## Commands (from repository root)

```bash
npm run dev:api
npm run test:api
npm run type-check:api
npm run lint:api
npm run build:api
```

Copy [`.env.example`](./.env.example) to `.env.development` for local overrides. Do not commit
secrets.

## Platform routes

- `GET /health` — liveness `{ "status": "ok" }` (unauthenticated)
- `GET /ready` — readiness `{ "status": "ready" }` (unauthenticated; no database checks yet)

Errors use the envelope in [data-contracts.md](../../docs/contracts/data-contracts.md). Requests
accept and return `X-Correlation-ID`.

Generated OpenAPI will live in [`openapi/`](./openapi/README.md) after BE-002.

Shared product documentation remains at the repository root in `/docs`.
