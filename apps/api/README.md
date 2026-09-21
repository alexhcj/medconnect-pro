# `apps/api`

Modular NestJS 12 platform for MedConnect Pro (`medconnect-api`).

Listen port: **3001** (matches Postman local `baseUrl`). OpenAPI is generated from this app
([BE-002](../../docs/tasks/backend/BE-002-openapi-foundation.md)). Identity/OAuth guards are not in
this app yet; follow [identity-and-access.md](../../docs/contracts/identity-and-access.md) when they
are added. Persistence is PostgreSQL + TypeORM
([DATA-001](../../docs/tasks/backend/DATA-001-postgresql-tenant-model.md),
[ADR-010](../../docs/decisions/ADR-010-postgresql-typeorm.md)).

## Commands (from repository root)

```bash
docker compose up -d
npm run migration:run
npm run dev:api
npm run test:api
npm run type-check:api
npm run lint:api
npm run build:api
npm run openapi:generate
```

`npm run test:api` requires PostgreSQL (`docker compose up -d`). Isolation tests run migrations if
needed.

Copy [`.env.example`](./.env.example) to `.env.development` for local overrides. Do not commit
secrets. Compose credentials are local demo values only.

## Platform routes

- `GET /health` — liveness `{ "status": "ok" }` (unauthenticated; process only)
- `GET /ready` — readiness `{ "status": "ready" }` (unauthenticated; HTTP 503 when PostgreSQL is down)
- `GET /api/docs-json` — generated OpenAPI document
- `GET /api/docs` — optional Swagger UI (off when `SWAGGER_UI_ENABLED=false` or by default in production)

Errors use the envelope in [data-contracts.md](../../docs/contracts/data-contracts.md). Requests
accept and return `X-Correlation-ID`.

Generated OpenAPI lives in [`openapi/`](./openapi/README.md). After regenerating, re-import Postman
from that JSON.

Shared product documentation remains at the repository root in `/docs`.
