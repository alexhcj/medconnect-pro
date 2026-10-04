---
id: administration
type: capability-module
name: Administration
area: administration
marketing_path: /platform/administration
status: partial
claim: "User directory and audit viewer. Role PATCH is not shipped."
related_tasks: [FE-009, FE-016, BE-010]
related_docs:
  - ../01-product-requirements.md
  - ../marketing/capability-matrix.md
  - ../roadmap/post-mvp-baseline.md
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
    demo: role PATCH is not shipped
    public: no
    related_tasks: []
  - id: administration.security-events-http
    name: Security-events HTTP
    status: planned
    demo: not shipped
    public: no
    related_tasks: []
---

# Administration

User directory and audit viewer as implemented. Do not claim role assignment HTTP or
security-events HTTP.

| ID | Name | Status | Demo | Public |
| --- | --- | --- | --- | --- |
| `administration.user-directory` | Browse practice users | shipped | user directory | yes |
| `administration.audit-viewer` | Review audit events | shipped | audit viewer | yes |
| `administration.role-assignment` | Assign roles over HTTP | planned | no role PATCH | no |
| `administration.security-events-http` | Security-events HTTP | planned | not shipped | no |
