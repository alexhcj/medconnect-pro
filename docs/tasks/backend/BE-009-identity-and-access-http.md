---
id: BE-009
type: task
area: backend
feature: identity-access
status: planned
priority: critical
estimate: 5
dependencies: [BE-001, BE-002, DATA-001, SEC-001]
related_adrs: [ADR-003-authentication.md, ADR-002-tenant-isolation.md]
related_docs:
  [
    backend-architecture.md,
    security-architecture.md,
    ../contracts/identity-and-access.md,
    ../contracts/api-endpoints.md,
    ../roadmap/release-roadmap.md,
  ]
plane:
  work_item_id: null
  identifier: null
---

# BE-009 — Identity and access HTTP

## Objective

Implement the NestJS Identity & Access module that authenticates actors and populates tenant
context from server-side memberships.

## Scope

Mock IdP / BFF stand-in routes from the API contract (`POST /auth/login`, refresh, logout,
logout-all, optional MFA verify). Guards attach `TenantContext` from DATA-001 memberships and
reject client-supplied `practiceId` for authorization. Document Bearer auth against implemented
checks. Keep `/health` and `/ready` unauthenticated.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.
- Do not implement a production OAuth/OIDC IdP in this task. Target architecture remains
  Authorization Code + PKCE ([ADR-003](../../decisions/ADR-003-authentication.md)).

## Acceptance criteria

- [ ] Mock login/refresh/logout (and logout-all) exist on NestJS
- [ ] Authenticated requests resolve tenant from memberships, not from the client
- [ ] Guards deny anonymous access to protected resources
- [ ] Client `practiceId` is ignored or rejected for authorization
- [ ] OpenAPI documents Bearer auth for protected routes
- [ ] Health and readiness remain unauthenticated
- [ ] Tests cover unauthenticated, wrong-tenant, and role/permission denial at the HTTP boundary

## Implementation notes

Required before [BE-003](BE-003-patient-api.md) can claim role/resource authorization. Frontend mock
session (FE-010) is not enforcement.

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
