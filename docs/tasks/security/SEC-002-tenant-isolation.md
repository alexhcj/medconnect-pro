---
id: SEC-002
type: task
area: security
feature: tenant-isolation
status: implemented
priority: critical
estimate: 4
dependencies: [DATA-001]
related_adrs: [ADR-002-tenant-isolation.md]
related_docs: [security-architecture.md,data-architecture.md]
plane:
  work_item_id: 265b01fc-585d-4d4d-863a-7b73ecb9b686
  identifier: MEDCONNECT-38
---

# SEC-002 — Tenant isolation

## Objective

Verify cross-tenant isolation at repository/service and database boundaries.

## Scope

Tenant-aware queries, indexes, cache keys and tests.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [x] Cross-tenant reads denied
- [x] Cross-tenant writes denied
- [x] Tenant IDs not trusted from client
- [x] Sensitive queries tested

## Implementation notes

Consider PostgreSQL RLS where appropriate.

## Completion

- Implementation: PostgreSQL RLS on tenant-owned business tables; non-owner runtime role
  `medconnect_app`; GUC `app.current_practice_id` bound from server-resolved `TenantContext`.
  Existing repository/HTTP isolation from DATA-001 and domain APIs remains. Identity tables
  (`users`, `auth_sessions`, `practice_memberships`) are not RLS-gated so login can derive tenant.
- Tests: `apps/api/test/rls-isolation.spec.ts` (unscoped SQL, fail-closed GUC, WITH CHECK, identity
  lookup); existing tenant-isolation and domain HTTP suites now seed via `DATABASE_ADMIN_URL`
  (`npm run test:api` with Compose Postgres).
- PR:
- Notes: Redis cache keys remain future work until Redis exists. Document object-storage path
  prefixes are implemented in [SEC-004](SEC-004-document-access-control.md) on a local adapter
  until S3 exists. Pointing runtime `DATABASE_URL` at table owner `medconnect` bypasses RLS.
