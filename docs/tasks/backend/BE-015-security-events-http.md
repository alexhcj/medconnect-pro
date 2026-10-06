---
id: BE-015
type: task
area: backend
feature: administration
status: pending
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
  status: not_started
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: null
  identifier: null
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

- [ ] `GET /admin/security-events` returns tenant-scoped security-relevant events
- [ ] Anonymous 401; roles without `admin:practice` are 403
- [ ] PRACTICE_ADMIN sees own-tenant rows only
- [ ] Cross-tenant and client `practiceId` mismatch do not oracle
- [ ] Failed login for a known user can appear; unknown emails do not confirm existence
- [ ] `GET /admin/audit-events` behavior is unchanged
- [ ] OpenAPI includes the path; HTTP tests plus a matrix row

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

- Implementation:
- Tests:
- PR:
- Notes:
