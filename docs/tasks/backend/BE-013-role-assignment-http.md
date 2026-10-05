---
id: BE-013
type: task
area: backend
feature: administration
status: implemented
priority: high
estimate: 3
dependencies: [BE-010, BE-009, SEC-001, SEC-003]
related_adrs: [ADR-002-tenant-isolation.md]
related_docs:
  [
    ../../architecture/backend-architecture.md,
    ../../architecture/security-architecture.md,
    ../../contracts/api-endpoints.md,
    ../../contracts/identity-and-access.md,
    ../../product/administration.md,
    BE-010-practice-user-directory-api.md,
    ../security/SEC-003-audit-event-model.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: 2a9a73f9-e2d9-4b7b-96f4-c60bd6ac7e26
  identifier: MEDCONNECT-78
---

# BE-013 — Role assignment HTTP

## Objective

Implement contracted `PATCH /admin/users/:id/roles` so a practice admin can change a
membership role inside tenant rules, with audit and authorization tests.

## Context

`admin:users` already means “assign roles and manage users within tenant rules”.
[BE-010](BE-010-practice-user-directory-api.md) is list-only. The PATCH is planned in
[api-endpoints.md](../../contracts/api-endpoints.md). FE-016 explicitly did not call it.

Identity contract: extra permission grants are a future administration concern, not a runtime
editor.

Implements / extends `administration.role-assignment`.

## Scope

- `PATCH /admin/users/:id/roles` on the existing practice user controller
- Body: membership role for the **session practice** (single role string from the closed catalog)
- Rules:
  - permission `admin:users`; tenant from session; reject client `practiceId` mismatch
  - `PRACTICE_ADMIN` cannot grant `SUPER_ADMIN`
  - cannot remove the last `PRACTICE_ADMIN` of the practice
  - unknown / cross-tenant user ids do not oracle (same not-found as BE-010)
  - emit an audit event for the administrative security change (no password/MFA/session hashes)
- OpenAPI; HTTP tests; matrix row
- Document the mapping next to the BE-010 section in
  [identity-and-access.md](../../contracts/identity-and-access.md)

## Out of Scope

- Permission-catalog / extra-grant editor
- User create, invite, or delete
- `GET /admin/security-events` (M11)
- Frontend assignment UI (FE-026)
- Changing default grants in `permissions.ts` except as required to enforce the PATCH rules
- OAuth, Redis, AWS

## Requirements

- `id` is the **user** id, matching BE-010
- `role` is the membership role for the resolved practice
- SUPER_ADMIN is still session-tenant scoped on this route (same as GET list)
- Do not invent a new catalog permission string

## Acceptance Criteria

- [x] `PATCH /admin/users/:id/roles` updates the session-practice membership and returns the
  updated practice-user RDO
- [x] Anonymous 401; roles without `admin:users` are 403
- [x] PRACTICE_ADMIN granting SUPER_ADMIN is 403
- [x] Removing the last PRACTICE_ADMIN is rejected
- [x] Cross-tenant and unknown ids do not oracle
- [x] An audit event is written for a successful change (and for denied attempts if that matches
  existing denial-audit patterns)
- [x] OpenAPI includes the path; HTTP tests plus a matrix row (do not reopen QA-004’s task)

## Dependencies

- BE-010, BE-009, SEC-001, SEC-003
- Blocks: FE-026
- Does not wait on DATA-002 extra directory roles (two seeded memberships are enough: change
  the provider’s role in tests, then restore or use a transaction-per-test)

## Validation

- `npm run test:api` including matrix
- Confirm GET `/admin/users` still lists the new role after PATCH

## Risks / Considerations

- Identity tables have no RLS; application scoping on `practice_id` remains mandatory.
- Do not allow a PRACTICE_ADMIN to escalate themselves to SUPER_ADMIN.

## Implementation notes

Suggested order: after BE-010 (shipped); before FE-026. Do not implement security-events HTTP.

Writing this spec is not a version bump.

## Completion

- Implementation: NestJS `PATCH /admin/users/:id/roles` on PracticeModule updates the
  session-practice membership (`admin:users`). `PRACTICE_ADMIN` cannot grant `SUPER_ADMIN`. The
  last `PRACTICE_ADMIN` cannot be removed. Unknown and cross-tenant user ids return `NOT_FOUND`.
  Successful changes audit `membership.role_changed` without passwords, MFA secrets, or session
  hashes. Identity tables remain without RLS. Frontend assignment UI stays FE-026.
- Tests: HTTP tests for anonymous 401, non-admin 403, practice-admin and session-scoped
  SUPER_ADMIN assignment, last-admin protection, SUPER_ADMIN grant denial, client `practiceId`
  mismatch, and no foreign-row oracle (`apps/api/test/practice-users.http.spec.ts`); matrix row
  for `PATCH /admin/users/:id/roles`; OpenAPI path (`npm run test:api` with Compose Postgres).
- PR:
- Notes: No permission-grant editor, user invite/delete, or security-events HTTP. Version
  0.64.0 → 0.65.0 (MINOR).
