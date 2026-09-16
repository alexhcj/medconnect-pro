---
id: SEC-002
type: task
area: security
feature: tenant-isolation
status: planned
priority: critical
estimate: 4
dependencies: [DATA-001]
related_adrs: [ADR-002-tenant-isolation.md]
related_docs: [security-architecture.md,data-architecture.md]
plane:
  work_item_id: null
  identifier: null
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

- [ ] Cross-tenant reads denied
- [ ] Cross-tenant writes denied
- [ ] Tenant IDs not trusted from client
- [ ] Sensitive queries tested

## Implementation notes

Consider PostgreSQL RLS where appropriate.

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
