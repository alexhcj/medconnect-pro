---
id: administration
type: capability-module
name: Administration
area: administration
marketing_path: /platform/administration
status: partial
claim: "User directory and audit viewer. Role assignment UI is not shipped."
related_tasks: [FE-009, FE-016, BE-010, BE-013, FE-026]
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
    status: planned
    demo: Nest PATCH shipped; assignment UI is FE-026
    public: no
    planned_next: FE-026
    related_tasks: [BE-013, FE-026]
  - id: administration.security-events-http
    name: Security-events HTTP
    status: planned
    demo: not shipped
    public: no
    planned_next: M11
    related_tasks: []
---

# Administration

User directory and audit viewer as implemented. Nest `PATCH /admin/users/:id/roles` is
[BE-013](../tasks/backend/BE-013-role-assignment-http.md). Do not claim role assignment as a demo
UI until [FE-026](../tasks/frontend/FE-026-role-assignment-ui.md) ships. Security-events HTTP
remains **M11**.

| ID | Name | Status | Demo | Public |
| --- | --- | --- | --- | --- |
| `administration.user-directory` | Browse practice users | shipped | user directory | yes |
| `administration.audit-viewer` | Review audit events | shipped | audit viewer | yes |
| `administration.role-assignment` | Assign roles over HTTP | planned | Nest PATCH; UI FE-026 | no |
| `administration.security-events-http` | Security-events HTTP | planned | not shipped | no |
