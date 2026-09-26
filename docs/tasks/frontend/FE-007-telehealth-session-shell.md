---
id: FE-007
type: task
area: frontend
feature: telehealth
status: implemented
priority: medium
estimate: 3
dependencies: [FE-005]
related_adrs: []
related_docs: [frontend-architecture.md,../01-product-requirements.md,../contracts/api-endpoints.md]
plane:
  work_item_id: 77c97f7a-4104-45bf-b7ba-fbe7307e5047
  identifier: MEDCONNECT-26
---

# FE-007 — Telehealth session shell

## Objective

Create the appointment-linked telehealth session shell for M5.

## Scope

Join/leave UI, waiting-room presentation, and media-control placeholders. Do not claim a production
telehealth deployment.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [x] Session shell route exists
- [x] Appointment linkage is visible
- [x] Join/leave controls exist
- [x] Loading/error states exist
- [x] Accessible on tablet

## Implementation notes

Media behavior is bounded by the selected telehealth architecture. Backend session API is BE-006.

## Completion

- Implementation: Mock lobby at `/dashboard/telehealth` and session shell at `/dashboard/telehealth/[sessionId]` with waiting room, join/leave, and camera/mic/share placeholders. Sessions are derived from joinable telehealth appointments (`session-{appointmentId}`). Join visit also appears on the appointment list and calendar dialog. Live mode lists visits from the appointment API; get/join/leave are labeled unavailable until BE-006. Daily is not invoked.
- Tests: Vitest for joinable mapping, mock join/leave, live join rejection, access helper, lobby/session UI, and appointment Join visit visibility. Playwright tablet flow covers lobby linkage, join, placeholders, and leave.
- PR:
- Notes: Receptionist remains off Telehealth nav; frontend checks are UX only. Chat, recording, reconnection, and Nest `/telehealth` stay out of scope.
