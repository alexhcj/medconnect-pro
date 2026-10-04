---
id: patient-management
type: capability-module
name: Patient management
area: patient-management
marketing_path: /platform/patient-management
status: shipped
claim: "Directory, profiles, vitals, documents, and clinical lists. Synthetic data only."
related_tasks: [FE-002, FE-003, FE-004, FE-011, FE-013, BE-003, BE-005, SEC-004]
related_docs:
  - ../01-product-requirements.md
  - ../marketing/capability-matrix.md
  - ../roadmap/post-mvp-baseline.md
capabilities:
  - id: patient-management.directory-search
    name: Search and open the patient directory
    status: shipped
    demo: searchable practice directory
    public: yes
    related_tasks: [FE-002, FE-011, BE-003]
  - id: patient-management.profiles
    name: View and edit a patient profile
    status: shipped
    demo: demographics and chart details; create/edit
    public: yes
    related_tasks: [FE-003, FE-004, FE-011, BE-003]
  - id: patient-management.clinical-foundation
    name: Clinical lists on the patient profile
    status: shipped
    demo: vitals, medications, and history lists as a foundation
    public: qualified
    planned_next: external EHR integrations
    related_tasks: [FE-013, BE-005]
  - id: patient-management.documents
    name: Review patient documents
    status: shipped
    demo: document list and download with ACL
    public: yes
    related_tasks: [FE-013, SEC-004]
---

# Patient management

Shipped vertical slice: directory, profile, create/edit, clinical lists, and document
list/download. Clinical work is a foundation on the patient profile, not an external EHR.

| ID | Name | Status | Demo | Public |
| --- | --- | --- | --- | --- |
| `patient-management.directory-search` | Search and open the patient directory | shipped | searchable directory | yes |
| `patient-management.profiles` | View and edit a patient profile | shipped | create/edit + chart details | yes |
| `patient-management.clinical-foundation` | Clinical lists on the patient profile | shipped | vitals, medications, history lists | qualified |
| `patient-management.documents` | Review patient documents | shipped | list and download with ACL | yes |
