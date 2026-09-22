---
id: SEC-001
type: task
area: security
feature: identity-access
status: implemented
priority: critical
estimate: 3
dependencies: []
related_adrs: [ADR-003-authentication.md]
related_docs: [security-architecture.md,../00-project-spec.md,../contracts/identity-and-access.md]
plane:
  work_item_id: null
  identifier: null
---

# SEC-001 — Authentication and authorization model

## Objective

Establish the role, permission, tenant and session model used by all protected features.

## Scope

Define identity, roles, permissions and server-side authorization boundaries.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [x] Roles documented
- [x] Permissions documented
- [x] Tenant resolution documented
- [x] Resource authorization documented
- [x] Session rules documented

## Implementation notes

Use OAuth/OIDC + PKCE as the target architecture; mock mode may simulate the identity provider.

## Completion

- Implementation: Canonical model in `docs/contracts/identity-and-access.md`; frontend `Permission` catalog and mock session grants aligned. No NestJS/OAuth/IdP implementation.
- Tests: Vitest catalog subset checks (`permissions.test.ts`). Existing dashboard/nav tests still pass.
- PR:
- Notes: Browser session checks remain UX only. Mock login and dashboard gating are
  [FE-010](../frontend/FE-010-mock-authentication-ui.md). NestJS Identity HTTP is
  [BE-009](../backend/BE-009-identity-and-access-http.md). Tenant isolation, audit, document ACL,
  and QA matrix are SEC-002–004 / DATA-001 / QA-004.
