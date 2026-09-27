---
id: FE-016
type: task
area: frontend
feature: administration
status: ready
priority: high
estimate: 3
dependencies: [FE-009, BE-010, SEC-003, BE-009]
related_adrs: [ADR-003-authentication.md]
related_docs:
  [
    frontend-architecture.md,
    ../contracts/api-endpoints.md,
    ../contracts/data-contracts.md,
    ../contracts/identity-and-access.md,
    ../tasks/backend/BE-010-practice-user-directory-api.md,
    ../tasks/backend/BE-009-identity-and-access-http.md,
    ../tasks/security/SEC-003-audit-event-model.md,
    FE-009-administration-security-ui.md,
  ]
plane:
  work_item_id: 67a00fc7-50cf-4653-bd31-da64f245f3e2
  identifier: MEDCONNECT-49
---

# FE-016 — Administration UI on Nest admin APIs

## Objective

Connect the existing administration page to Nest when mocks are off, with a loginable
practice-admin session so the live user list and audit viewer are demonstrable.

## Scope

User list against [BE-010](../backend/BE-010-practice-user-directory-api.md) and audit viewer
against [SEC-003](../security/SEC-003-audit-event-model.md), authenticated with the
[BE-009](../backend/BE-009-identity-and-access-http.md) bearer session. Enough synthetic seed that
the live screen is demonstrable. One non-mock browser check for users plus an audit action.

Do not reopen FE-009, BE-010, SEC-003, or BE-009. Existing Playwright specs stay on
`NEXT_PUBLIC_USE_MOCKS=true`.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.
- Do not reopen FE-009, BE-010, SEC-003, or BE-009. Existing Playwright specs stay on
  `NEXT_PUBLIC_USE_MOCKS=true`.

## Acceptance criteria

- [ ] With mocks off, both lists call Nest using the BE-009 session; no client 404 stub; no client
  `practiceId` for authorization
- [ ] User and audit RDOs map onto the UI `PracticeUser` and `AuditEvent` types; `practiceId` is
  display only
- [ ] Seeded admin and provider emails render; the audit list shows at least a login event after
  sign-in
- [ ] One non-mock browser check covers `/dashboard/admin` users and an audit action

## Implementation notes

With mocks off, the browser calls Nest at `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:3001`).
Login stores the opaque bearer from `POST /auth/login`.

Replace the `adminRealAPI` 404 stubs in `apps/web/src/lib/api/admin-api.ts`. Those stubs currently
reject without calling `fetch`. Live users is `GET /admin/users`; unwrap `PracticeUserListRdo.users`.
Live audit is `GET /admin/audit-events`; unwrap `AuditEventSearchResultRdo.events`. Do not hardcode
mock ids (`user_mock_*`, `demo-practice-001`). Map RDOs onto the UI types. Drop `practiceId` from
authorization in the client; tenant comes from the session.

First page of audit (Nest default 50, max 100) is enough. Do not add infinite scroll or query
filters unless the first page cannot make the viewer demonstrable.

Update `ADMIN_DEMO_NOTICE` so it no longer claims Nest administration APIs are disconnected. Roles
remain presentation only on this screen.

Do not call `PATCH /admin/users/:id/roles` or `GET /admin/security-events`. Do not add role
assignment or permission-management UI. Do not wire the dashboard Bell button to
`GET /notifications`.

`npm run seed:mock-identity` already inserts a loginable `PRACTICE_ADMIN`
`practice.admin@example.test` (password `Demo-Admin-1`) and provider `jordan.ellis@synthetic.example`.
User ids are server UUIDs. Mock fixture emails such as `provider@example.test` will not appear live.
Do not seed extra directory roles unless those two rows cannot make the list demonstrable.

[SEC-003](../security/SEC-003-audit-event-model.md) emits `auth.login.succeeded` on mock login. Do
not insert fake `audit_events` rows unless login does not make the viewer demonstrable.

Extend `playwright.live.config.ts` `testMatch` for a live administration spec: sign in as that
practice admin, open `/dashboard/admin`, assert both seeded emails and roles render, and assert at
least one audit action (for example `auth.login.succeeded`). Do not move
`e2e/administration.spec.ts` off `NEXT_PUBLIC_USE_MOCKS=true`.

Administration nav stays `SUPER_ADMIN` and `PRACTICE_ADMIN`. Frontend checks stay UX only. Nest
`admin:users` / `admin:practice` remain authoritative.
