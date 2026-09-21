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

PostgreSQL **row-level security** is deferred to
[SEC-002](../tasks/security/SEC-002-tenant-isolation.md). When RLS is added, the application
database role should not be a superuser or table owner that bypasses RLS.

## Rationale

PostgreSQL is the canonical primary store in the data architecture. TypeORM is the NestJS-supported
ORM, which keeps persistence inside the modular Nest application without a second data-access stack.

## Consequences

- Local Postgres is provided by Docker Compose for development and API tests.
- Identity HTTP/OAuth is not required for tenant scoping; tests inject `TenantContext`.
- Cache keys and object-storage paths remain future work with those stores.
