---
id: BE-015
type: task
area: backend
feature: administration
status: implemented
priority: high
estimate: 3
dependencies: [SEC-003, BE-009]
related_adrs: [ADR-002-tenant-isolation.md]
related_docs:
  [
    ../../architecture/backend-architecture.md,
    ../../architecture/security-architecture.md,
    ../../contracts/api-endpoints.md,
    ../../contracts/data-contracts.md,
    ../../contracts/identity-and-access.md,
    ../../product/administration.md,
    ../security/SEC-003-audit-event-model.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: 40f51f6b-55bf-4b46-9f8d-8919e3f53161
  identifier: MEDCONNECT-83
---

# BE-015 — Security-events HTTP

## Objective

Implement contracted `GET /admin/security-events` so a practice admin can list
tenant-scoped authentication and session-security events without replacing the audit viewer.

## Context

[SEC-003](../security/SEC-003-audit-event-model.md) ships `GET /admin/audit-events` and already
emits login/logout/MFA/refresh-reuse. M7/M10 tasks explicitly left
`GET /admin/security-events` unimplemented. The product capability
`administration.security-events-http` is `planned`. Frontend viewer is
[FE-029](../frontend/FE-029-security-events-ui.md).

Implements / extends `administration.security-events-http`.

## Scope

- `GET /admin/security-events` (`admin:practice`, session-tenant scoped, including SUPER_ADMIN
  — same rule as SEC-003)
- Prefer filtering `audit_events` to security-relevant actions (`auth.*`)
- Emit `auth.login.failed` only when the identity is resolvable (known user, wrong password).
  Unknown emails must not oracle
- RDO: actor, tenant, action, resource type/id, correlation, timestamp only. No passwords, MFA
  secrets, or session hashes
- OpenAPI; HTTP tests; matrix row (do not reopen QA-004)
- Document the RDO in [data-contracts.md](../../contracts/data-contracts.md) and mark the route
  implemented in [api-endpoints.md](../../contracts/api-endpoints.md)
- New table only if NOT NULL `practice_id` / `actor_user_id` on `audit_events` cannot represent
  failed-login rows

## Out of Scope

- Replacing or changing `GET /admin/audit-events`
- Frontend viewer (FE-029)
- Permission-grant editor, user invite/delete
- Rate-limit events
- Cookie session HTTP (BE-014)
- OAuth, Redis, AWS

## Requirements

- Client `practiceId` is ignored for authorization and rejected on mismatch
- Do not invent a new catalog permission string
- Pre-auth failures without a resolvable membership stay out of the practice list (request logs
  remain acceptable) unless a dedicated table is required

## Acceptance Criteria

- [x] `GET /admin/security-events` returns tenant-scoped security-relevant events
- [x] Anonymous 401; roles without `admin:practice` are 403
- [x] PRACTICE_ADMIN sees own-tenant rows only
- [x] Cross-tenant and client `practiceId` mismatch do not oracle
- [x] Failed login for a known user can appear; unknown emails do not confirm existence
- [x] `GET /admin/audit-events` behavior is unchanged
- [x] OpenAPI includes the path; HTTP tests plus a matrix row

## Dependencies

- SEC-003, BE-009 (shipped)
- Blocks: FE-029
- May run in parallel with BE-014 / FE-027

## Validation

- `npm run test:api` including matrix and OpenAPI contract
- Confirm audit list tests still pass

## Risks / Considerations

- Identity tables have no RLS; application scoping on `practice_id` remains mandatory.
- Do not leak whether an email exists via distinct error payloads on login **or** on this list.

## Implementation notes

Suggested order: parallel with BE-014; before FE-029. Do not implement the admin UI here.

Writing this spec is not a version bump. Shipping this slice is **MINOR**.

## Completion

- Implementation: `GET /admin/security-events` on `AuditModule` (`admin:practice`, session tenant)
  filters `audit_events` to `auth.*`. Known-user wrong password emits `auth.login.failed` with
  `resourceId` null; unknown emails and unscoped memberships do not. Same RDO as audit events. No
  new table or permission. `GET /admin/audit-events` unchanged. Viewer remains FE-029.
- Tests: repository prefix isolation; auth.service failed-login emission; HTTP 401/403/tenant/
  oracle cases; QA-004 matrix row; OpenAPI cookie-or-bearer contract (`npm run test:api`).
- PR:
- Notes: Catalog `administration.security-events-http` stays planned until FE-029. Version 0.70.0.
