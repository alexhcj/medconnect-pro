---
id: security
type: capability-module
name: Security
area: security
marketing_path: /security
status: shipped
claim: "Implemented engineering patterns (RBAC, tenant isolation, audit, document ACL). Not HIPAA certified."
related_tasks: [SEC-001, SEC-002, SEC-003, SEC-004]
related_docs:
  - ../01-product-requirements.md
  - ../marketing/capability-matrix.md
  - ../roadmap/post-mvp-baseline.md
  - ../architecture/security-architecture.md
capabilities:
  - id: security.rbac
    name: Role-based access control
    status: shipped
    demo: server-side RBAC in the Nest API; frontend nav is UX only
    public: yes
    related_tasks: [SEC-001, QA-004]
  - id: security.tenant-isolation
    name: Tenant isolation
    status: shipped
    demo: practice/tenant isolation including RLS
    public: yes
    related_tasks: [SEC-002, DATA-001]
  - id: security.audit-logging
    name: Audit logging
    status: shipped
    demo: audit events with a viewer in administration
    public: yes
    related_tasks: [SEC-003, FE-016]
  - id: security.document-acl
    name: Document access control
    status: shipped
    demo: document ACL on list/download
    public: yes
    related_tasks: [SEC-004]
  - id: security.hipaa-certification
    name: HIPAA certification
    status: out_of_scope
    demo: not a certified production system
    public: no
    related_tasks: []
---

# Security

Describe implemented demo patterns. Do not claim HIPAA certification, compliance, or suitability
for real patient data. Identity/session details live in
[identity-access.md](identity-access.md).

| ID | Name | Status | Demo | Public |
| --- | --- | --- | --- | --- |
| `security.rbac` | Role-based access control | shipped | Nest RBAC | yes |
| `security.tenant-isolation` | Tenant isolation | shipped | tenant + RLS | yes |
| `security.audit-logging` | Audit logging | shipped | events + viewer | yes |
| `security.document-acl` | Document access control | shipped | list/download ACL | yes |
| `security.hipaa-certification` | HIPAA certification | out_of_scope | not certified | no |
