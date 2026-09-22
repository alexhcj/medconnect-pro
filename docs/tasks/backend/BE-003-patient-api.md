---
id: BE-003
type: task
area: backend
feature: patient-management
status: planned
priority: high
estimate: 4
dependencies: [BE-001, DATA-001, BE-009]
related_adrs: [ADR-002-tenant-isolation.md]
related_docs: [backend-architecture.md,../contracts/api-endpoints.md,../contracts/data-contracts.md]
plane:
  work_item_id: null
  identifier: null
---

# BE-003 — Patient API

## Objective

Implement patient endpoints with validation, authorization and tenant scope.

## Scope

CRUD/search/filter/pagination plus authorized profile access.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [ ] CRUD endpoints exist
- [ ] DTO validation exists
- [ ] Tenant scope enforced
- [ ] Role/resource authorization enforced
- [ ] OpenAPI documented
- [ ] Tests cover denied access

## Implementation notes

Never trust browser-supplied practice_id.

Do not start authorization acceptance criteria until [BE-009](BE-009-identity-and-access-http.md)
ships. Frontend patient mocks (FE-002+) may proceed after FE-010.

## Completion

- Implementation:
- Tests:
- PR:
- Notes: BE-009 identity HTTP has shipped. Role and resource authorization can use those guards.
