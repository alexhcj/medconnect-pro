---
id: BE-002
type: task
area: backend
feature: api-contract
status: planned
priority: high
estimate: 2
dependencies: [BE-001]
related_adrs: []
related_docs: [api-architecture.md,../contracts/api-endpoints.md,../contracts/data-contracts.md]
plane:
  work_item_id: null
  identifier: null
---

# BE-002 — OpenAPI foundation

## Objective

Expose inspectable OpenAPI documentation from the NestJS API.

## Scope

Configure @nestjs/swagger and document initial protected endpoints.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [ ] Swagger/OpenAPI endpoint exists
- [ ] Security schemes documented
- [ ] DTO schemas appear
- [ ] Error schema documented
- [ ] Critical endpoint contract test exists

## Implementation notes

This is generated from backend decorators; Markdown remains the human-readable planning contract.

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
