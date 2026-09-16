---
id: DATA-001
type: task
area: backend
feature: multi-tenancy
status: planned
priority: critical
estimate: 3
dependencies: [BE-001,SEC-001]
related_adrs: [ADR-002-tenant-isolation.md]
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

- [ ] Practice model exists
- [ ] Tenant-owned records are scoped
- [ ] Cross-tenant access is denied
- [ ] Tests cover isolation

## Implementation notes

RLS can be introduced for sensitive boundaries when the PostgreSQL implementation exists.

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
