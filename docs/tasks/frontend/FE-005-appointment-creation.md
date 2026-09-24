---
id: FE-005
type: task
area: frontend
feature: scheduling
status: implemented
priority: high
estimate: 2
dependencies: [FE-003]
related_adrs: []
related_docs: [frontend-architecture.md,../01-product-requirements.md]
plane:
  work_item_id: ac5f0fce-73d3-48f8-b312-4436299fb6e7
  identifier: MEDCONNECT-24
---

# FE-005 — Appointment creation

## Objective

Create appointment workflow linking patient and provider.

## Scope

Provider, patient, time, type and appointment state.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [x] Appointment form works
- [x] Conflict feedback exists
- [x] Validation works
- [x] Accessible workflow exists

## Implementation notes

Backend conflict detection is authoritative.

## Completion

- Implementation: Mock list and create at `/dashboard/appointments` and `/dashboard/appointments/new`. Form covers patient, provider, start/end, type, and state, gated by `write:appointments`. Patient profile can prefill `?patientId=`. Live mode does not call Nest `/appointments`.
- Tests: Vitest for schema, mock overlap (including cancelled slots), permissions, form errors, and list states. Playwright tablet flow for empty validation, create, and provider conflict.
- PR:
- Notes: Mock overlap is UX only; BE-004 remains authoritative. Calendar is FE-006. No Nest appointment API in this slice.
