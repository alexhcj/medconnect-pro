# `apps/api`

Modular NestJS 12 platform for MedConnect Pro (`medconnect-api`).

Listen port: **3001** (matches Postman local `baseUrl`). OpenAPI is generated from this app
([BE-002](../../docs/tasks/backend/BE-002-openapi-foundation.md)). Mock identity HTTP
([BE-009](../../docs/tasks/backend/BE-009-identity-and-access-http.md),
[BE-014](../../docs/tasks/backend/BE-014-httponly-cookie-session-http.md)) issues opaque bearer
sessions and HttpOnly cookies, and resolves tenant context from practice memberships. It is not a
production OAuth/OIDC provider.
Persistence is PostgreSQL + TypeORM
([DATA-001](../../docs/tasks/backend/DATA-001-postgresql-tenant-model.md),
[ADR-010](../../docs/decisions/ADR-010-postgresql-typeorm.md)). Tenant isolation at the database
boundary is PostgreSQL RLS ([SEC-002](../../docs/tasks/security/SEC-002-tenant-isolation.md)).

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
npm run seed:mock-identity
```

`npm run test:api` requires PostgreSQL (`docker compose up -d`). Isolation tests run migrations if
needed. Runtime tests connect as `medconnect_app`; fixture seed/cleanup uses `DATABASE_ADMIN_URL`.

Copy [`.env.example`](./.env.example) to `.env.development` for local overrides
(`APP_ENV=local`). Do not commit secrets. Compose credentials are local demo values only.
**`DATABASE_URL` must be `medconnect_app`.** An old override that still uses owner `medconnect`
silently bypasses row-level security. Hosted preview and production use
[`.env.preview.example`](./.env.preview.example) and
[`.env.production.example`](./.env.production.example) as placeholders; the platform injects
real values. Hosted boot refuses Compose URLs
([environment-configuration.md](../../docs/contracts/environment-configuration.md)).

Document bytes use a local directory (`DOCUMENT_STORAGE_DIR`, default `.document-storage`) with
tenant-prefixed keys. That adapter is the S3 stand-in until object storage exists. Do not commit
blobs.

## Platform routes

- `GET /health` — liveness `{ "status": "ok" }` (unauthenticated; process only)
- `GET /ready` — readiness `{ "status": "ready" }` (unauthenticated; HTTP 503 when PostgreSQL is down)
- `POST /auth/login`, `POST /auth/refresh`, `POST /auth/mfa/verify` — mock IdP stand-in (unauthenticated)
- `POST /auth/logout`, `POST /auth/logout-all` — revoke sessions (cookie or `Authorization: Bearer`)
- `GET /api/docs-json` — generated OpenAPI document
- `GET /api/docs` — optional Swagger UI (off when `SWAGGER_UI_ENABLED=false` or by default in production)

`npm run seed:mock-identity` inserts the synthetic demo practice admin when that email is absent,
plus one provider membership and a few synthetic patients so the live patient list can be demonstrated.
The password stays in the mock fixture, not in `users`.

The API allows browser calls from `WEB_ORIGIN` / `WEB_ORIGINS` (local default
`http://localhost:3000`) with an `Authorization` bearer header. That is the local Next.js app in
`npm run dev:real`. Production CORS is an exact-origin allowlist (no localhost, no Amplify
preview host pattern). Preview may include `https://*.amplifyapp.com`. See
[environment-configuration.md](../../docs/contracts/environment-configuration.md).

Errors use the envelope in [data-contracts.md](../../docs/contracts/data-contracts.md). Requests
accept and return `X-Correlation-ID`.

Generated OpenAPI lives in [`openapi/`](./openapi/README.md). After regenerating, re-import Postman
from that JSON.

Shared product documentation remains at the repository root in `/docs`.
