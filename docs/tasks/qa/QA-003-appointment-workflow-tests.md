---
id: QA-003
type: task
area: qa
feature: scheduling
status: implemented
priority: high
estimate: 2
dependencies: [FE-005,FE-006,BE-004,QA-001]
related_adrs: [ADR-008-frontend-testing-stack.md,ADR-002-tenant-isolation.md,ADR-005-synthetic-demo-data.md]
related_docs: [../01-product-requirements.md]
plane:
  work_item_id: 40388789-47f9-456c-b118-89ddcc7ed3b4
  identifier: MEDCONNECT-35
---

# QA-003 — Appointment workflow tests

## Objective

Validate appointment creation and calendar workflow.

## Scope

Include conflict handling.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [x] Create appointment test
- [x] Conflict test
- [x] Calendar display test
- [x] Authorization test

## Implementation notes

Use deterministic dates and synthetic users.

## Completion

- Implementation: No product surface change. Browser appointment flows stay on synthetic mocks. Live Nest `/appointments` remains a later connect task.
- Tests: Playwright create asserts the new visit on the week calendar, then list, then provider conflict. A nurse fixture hides Schedule and is denied on `/dashboard/appointments/new`. Existing calendar view E2E and Nest HTTP create, conflict, anonymous, nurse/patient write deny, assignment/portal scope, and cross-tenant checks stay in place.
- PR:
- Notes: Version 0.27.0 → 0.27.1 (PATCH). Test coverage only; no API or UX contract change. Cross-tenant coverage is the API HTTP spec. A browser-to-Nest appointment run is out of scope until the client calls the API.
