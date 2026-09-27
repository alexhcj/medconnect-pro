---
id: FE-009
type: task
area: frontend
feature: administration
status: implemented
priority: medium
estimate: 3
dependencies: [FE-001, FE-010]
related_adrs: []
related_docs: [frontend-architecture.md,../01-product-requirements.md,../contracts/api-endpoints.md]
plane:
  work_item_id: e3121a3e-056b-424d-9350-a4cdcc62b66a
  identifier: MEDCONNECT-28
---

# FE-009 — Administration/security UI

## Objective

Create practice/user administration and audit-viewer UI for M7.

## Scope

User/role presentation and an audit event viewer using synthetic data. Permission management beyond
default grants is out of M1.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [x] Administration route exists
- [x] User/role list renders
- [x] Audit viewer renders synthetic events
- [x] Loading/empty/error states exist
- [x] Navigation visibility is not treated as authorization

## Implementation notes

Server authorization remains authoritative (BE-009, SEC-002–004, QA-004).

## Completion

- Implementation: Administration at `/dashboard/admin` with a read-only user/role list from `docs/mocks/admin-users.json` and a synthetic audit viewer from `docs/mocks/audit-events.json`. Settings placeholder is removed. Live mode 404s both lists until a later Nest connect task. Access matches Administration nav roles (`SUPER_ADMIN`, `PRACTICE_ADMIN`).
- Tests: Vitest for mock list/get, live reject, access helper, list/viewer query states, and page deny. Playwright tablet flow covers users and audit events.
- PR:
- Notes: Nav visibility is not authorization. Role assignment, permission management, `GET /admin/security-events`, and Nest `GET /admin/audit-events` stay out of scope.
