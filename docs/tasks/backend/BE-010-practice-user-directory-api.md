---
id: BE-010
type: task
area: backend
feature: administration
status: ready
priority: high
estimate: 3
dependencies: [BE-009, DATA-001, SEC-002]
related_adrs: [ADR-002-tenant-isolation.md]
related_docs:
  [
    backend-architecture.md,
    security-architecture.md,
    ../contracts/api-endpoints.md,
    ../contracts/data-contracts.md,
    ../contracts/identity-and-access.md,
    BE-009-identity-and-access-http.md,
    ../security/SEC-002-tenant-isolation.md,
  ]
plane:
  work_item_id: 4b3b4951-1f99-46e2-bec2-4706d6ecf722
  identifier: MEDCONNECT-48
---

# BE-010 — Practice user directory HTTP

## Objective

Expose a tenant-scoped read of practice memberships at `GET /admin/users` so the FE-009 user list
can go live.

## Scope

List only. Join `practice_memberships` and `users` for the session practice. Permission
`admin:users` (PRACTICE_ADMIN and SUPER_ADMIN already hold it). Tenant from the session; reject
client `practiceId` for authorization.

Identity tables are not RLS-gated ([SEC-002](../security/SEC-002-tenant-isolation.md)) — application
scoping on `practice_memberships.practice_id` is mandatory. Document the mapping in
[identity-and-access.md](../../contracts/identity-and-access.md) the same way billing, notifications,
and documents are documented. `users` has no `synthetic` column; the demo RDO sets `synthetic: true`
(same as notifications).

Do not reopen [BE-009](BE-009-identity-and-access-http.md). Frontend live wiring stays
[FE-016](../frontend/FE-016-administration-ui-nest-api.md).

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [ ] `GET /admin/users` returns session-tenant memberships (user id, email, role, practiceId,
  synthetic)
- [ ] Anonymous access is 401; roles without `admin:users` are 403; client `practiceId` mismatch is
  rejected; cross-tenant and unknown ids do not oracle
- [ ] OpenAPI includes the path; HTTP tests plus a matrix row cover this GET (extend the matrix
  file; do not reopen QA-004’s task)
- [ ] Seeded `practice.admin@example.test` and `jordan.ellis@synthetic.example` are enough to
  demonstrate a list; do not add a six-role directory unless two rows cannot make the screen
  demonstrable

## Implementation notes

The contracted route is already in [api-endpoints.md](../../contracts/api-endpoints.md). There is
no Nest controller or OpenAPI path today.

Return a list RDO (`PracticeUserListRdo.users` of `PracticeUserRdo`) so FE-016 can unwrap it the
same way invoice and audit lists unwrap. `id` is the **user** id, not the membership id — the
administration UI keys and displays that field. `role` is the membership role for the resolved
practice. Session-tenant scoped, including SUPER_ADMIN (same rule as
[SEC-003](../security/SEC-003-audit-event-model.md) audit list). Do not invent pagination unless
two seeded rows cannot fit one response.

Never trust a query, body, or header `practiceId` for authorization. Reject a client `practiceId`
that does not match the session practice, matching other domain list endpoints.

`users`, `auth_sessions`, and `practice_memberships` have no RLS so login can derive tenant. Filter
memberships by server-resolved `TenantContext.practiceId`. Do not query users across practices.

Do not add a `synthetic` column. Always return `synthetic: true`. Do not expose passwords, MFA
secrets, or session hashes. Do not create users. Do not implement `PATCH /admin/users/:id/roles`,
a permission-grant editor, practice profile, or `GET /admin/security-events`. Do not invent a new
catalog permission string.

`npm run seed:mock-identity` already inserts Harbor Synthetic Practice memberships for
`practice.admin@example.test` (`PRACTICE_ADMIN`) and `jordan.ellis@synthetic.example` (`PROVIDER`).
Do not seed nurse, receptionist, or patient directory rows unless the live list cannot be shown
with those two. The MFA IdP account `mfa.nurse@example.test` has no membership; leave it unwired.

Extend `apps/api/test/authorization-matrix.http.spec.ts` with `GET /admin/users` (allow when
`admin:users`, otherwise 403). Domain HTTP tests stay in this task’s spec file. Full SUPER_ADMIN
cross-practice HTTP stays out of QA-004.

Frontend `adminRealAPI` 404 stubs stay until FE-016.
