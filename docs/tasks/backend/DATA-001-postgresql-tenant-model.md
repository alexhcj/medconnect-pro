---
id: DATA-001
type: task
area: backend
feature: multi-tenancy
status: implemented
priority: critical
estimate: 3
dependencies: [BE-001,SEC-001]
related_adrs: [ADR-002-tenant-isolation.md, ADR-010-postgresql-typeorm.md]
related_docs: [data-architecture.md,security-architecture.md]
plane:
  work_item_id: null
  identifier: null
---

# DATA-001 — PostgreSQL tenant model

## Objective

Implement the practice/tenant boundary for persisted data.

## Scope

Practice model, tenant foreign keys, indexes and server-side tenant scope.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [x] Practice model exists
- [x] Tenant-owned records are scoped
- [x] Cross-tenant access is denied
- [x] Tests cover isolation

## Implementation notes

PostgreSQL row-level security remains deferred to
[SEC-002](../security/SEC-002-tenant-isolation.md).

## Completion

- Implementation: Compose Postgres; TypeORM 0.3 migrations for `practices`, `users`,
  `practice_memberships`, and a persistence-only `patients` table; request-scoped `TenantContext`;
  tenant-aware repositories; `GET /ready` checks PostgreSQL.
- Tests: Vitest tenant isolation (two synthetic practices), TenantContext fail-closed units, health
  readiness units, existing platform HTTP tests (`npm run test:api` with Compose Postgres).
- PR:
- Notes: No Patient REST, Identity HTTP, or RLS. Client `practiceId` is rejected on mismatch.
