# ADR-010 — PostgreSQL and TypeORM

## Status

Accepted

## Decision

Persisted data lives in **PostgreSQL**. The NestJS API uses **TypeORM 0.3** (`@nestjs/typeorm` matching
the NestJS 12 major) with **checked-in migrations**. Schema changes are not applied with
`synchronize: true`.

Practice/tenant scope is enforced in **repositories and services** from server-resolved
`TenantContext`. Client-supplied `practice_id` is never the authorization source
([ADR-002](ADR-002-tenant-isolation.md)).

PostgreSQL **row-level security** is enabled on tenant-owned business tables
([SEC-002](../tasks/security/SEC-002-tenant-isolation.md)). The application database role
(`medconnect_app`) is not a superuser or table owner and does not bypass RLS. Migrations, seed,
and fixture CRUD use a separate owner URL (`DATABASE_ADMIN_URL`).

## Rationale

PostgreSQL is the canonical primary store in the data architecture. TypeORM is the NestJS-supported
ORM, which keeps persistence inside the modular Nest application without a second data-access stack.

## Consequences

- Local Postgres is provided by Docker Compose for development and API tests.
- HTTP requests resolve `TenantContext` from practice memberships
  ([BE-009](../tasks/backend/BE-009-identity-and-access-http.md)). Repository tests may still inject
  `TenantContext`. Production OAuth is not required for that scoping.
- Runtime Nest uses `DATABASE_URL` (`medconnect_app`). CLI migrations and `seed:mock-identity` use
  `DATABASE_ADMIN_URL` (table owner). Pointing runtime `DATABASE_URL` at the owner silently bypasses
  RLS.
- Cache keys remain future work until Redis exists. Document object-storage paths are
  tenant-prefixed on a local adapter until S3 exists
  ([SEC-004](../tasks/security/SEC-004-document-access-control.md)).
