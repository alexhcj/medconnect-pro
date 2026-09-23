---
id: QA-002
type: task
area: qa
feature: patient-management
status: implemented
priority: high
estimate: 2
dependencies: [FE-002,BE-003,QA-001]
related_adrs: [ADR-002-tenant-isolation.md]
related_docs: [../01-product-requirements.md,../contracts/api-endpoints.md]
plane:
  work_item_id: 4194b9ed-7bd1-4580-b113-0a962b1c4ab0
  identifier: MEDCONNECT-34
---

# QA-002 — Patient vertical-slice tests

## Objective

Validate the patient workflow end-to-end.

## Scope

List, profile, create/edit and authorization.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [x] Patient list test
- [x] Create patient test
- [x] Edit patient test
- [x] Unauthorized access test
- [x] Cross-tenant test

## Implementation notes

Use synthetic patients only.

## Completion

- Implementation: No product surface change. Browser patient flows stay on synthetic mocks.
- Tests: Playwright list, create, edit, and profile specs; provider link hiding plus direct create/edit URL denial. Nest HTTP tests for receptionist create, profile read, filter, update, pagination, anonymous and provider denial, nurse assignment, portal self-scope, cross-tenant not-found, and client `practiceId` mismatch.
- PR:
- Notes: Version 0.23.0 → 0.23.1 (PATCH). Test coverage only; no API or UX contract change. Cross-tenant coverage is the API HTTP spec. A browser-to-Nest patient run is out of scope until the client calls the API.
