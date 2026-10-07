---
id: administration
type: capability-module
name: Administration
area: administration
marketing_path: /platform/administration
status: partial
claim: "User directory, audit viewer, role assignment, and tenant-scoped security-events viewer with grant/tenant limits. Not a session-policy editor or SIEM."
related_tasks: [FE-009, FE-016, BE-010, BE-013, FE-026, BE-015, FE-029]
related_docs:
  - ../01-product-requirements.md
  - ../marketing/capability-matrix.md
  - ../roadmap/post-mvp-baseline.md
  - ../roadmap/release-roadmap.md
capabilities:
  - id: administration.user-directory
    name: Browse practice users
    status: shipped
    demo: user directory in administration
    public: yes
    related_tasks: [FE-009, FE-016, BE-010]
  - id: administration.audit-viewer
    name: Review audit events
    status: shipped
    demo: audit viewer with synthetic events
    public: yes
    related_tasks: [FE-009, FE-016]
  - id: administration.role-assignment
    name: Assign roles over HTTP
    status: shipped
    demo: practice-admin role change; Nest tenant/grant limits
    public: qualified
    related_tasks: [BE-013, FE-026]
  - id: administration.security-events-http
    name: Security-events HTTP
    status: shipped
    demo: Nest GET /admin/security-events plus administration viewer; tenant-scoped auth.* rows only
    public: qualified
    related_tasks: [BE-015, FE-029]
---

# Administration

User directory, audit viewer, and practice role assignment as implemented. Nest
`PATCH /admin/users/:id/roles` is [BE-013](../tasks/backend/BE-013-role-assignment-http.md).
The assignment UI is [FE-026](../tasks/frontend/FE-026-role-assignment-ui.md). Nest enforces
tenant scope, last-admin protection, and PRACTICE_ADMIN cannot grant SUPER_ADMIN. Omitting
SUPER_ADMIN from the select is UX only. Nest `GET /admin/security-events` is
[BE-015](../tasks/backend/BE-015-security-events-http.md). The administration viewer is
[FE-029](../tasks/frontend/FE-029-security-events-ui.md). The list is tenant-scoped `auth.*`
session metadata (not a session-policy editor, SIEM, or HIPAA audit export).

| ID | Name | Status | Demo | Public |
| --- | --- | --- | --- | --- |
| `administration.user-directory` | Browse practice users | shipped | user directory | yes |
| `administration.audit-viewer` | Review audit events | shipped | audit viewer | yes |
| `administration.role-assignment` | Assign roles over HTTP | shipped | practice-admin role change; tenant/grant limits | qualified |
| `administration.security-events-http` | Security-events HTTP | shipped | Nest GET plus viewer; tenant-scoped `auth.*` | qualified |
