---
id: FE-003
type: task
area: frontend
feature: patient-management
status: implemented
priority: high
estimate: 2
dependencies: [FE-002]
related_adrs: []
related_docs: [frontend-architecture.md,../01-product-requirements.md]
plane:
  work_item_id: 417fc2d9-a097-4a0c-95aa-c0acba6be67c
  identifier: MEDCONNECT-22
---

# FE-003 — Patient profile

## Objective

Implement patient profile with authorized sections.

## Scope

Demographics, history, vitals, medications and documents UI boundaries.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [x] Profile route exists
- [x] Sections are accessible
- [x] Sensitive sections are permission-aware
- [x] Loading/error states exist

## Implementation notes

Do not expose clinical data simply because mock data contains it.

## Completion

- Implementation: Staff profile route linked from the patient list. Demographics always; history, medications, and documents require `write:medical_records`; vitals require `write:vitals`. Clinical queries stay disabled without those grants.
- Tests: Vitest for the permission policy and profile states; Playwright tablet flow for the practice-admin demographics profile.
- PR:
- Notes: Mock `getPatient` still returns `conditions`. The profile does not render that field. Tenant and assigned-patient enforcement remain BE-003. Create/edit remains FE-004. Document upload remains out of scope.
