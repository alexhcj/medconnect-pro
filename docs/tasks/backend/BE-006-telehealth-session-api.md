---
id: BE-006
type: task
area: backend
feature: telehealth
status: implemented
priority: high
estimate: 4
dependencies: [BE-004]
related_adrs: []
related_docs: [backend-architecture.md,security-architecture.md]
plane:
  work_item_id: 3744ca66-6a0d-4185-afed-92a06e370a87
  identifier: MEDCONNECT-15
---

# BE-006 — Telehealth session API

## Objective

Create appointment-linked telehealth sessions.

## Scope

Session creation, participant authorization, state, waiting room and timeout/grace logic.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [x] Session can be created
- [x] Participants authorized
- [x] Session state tracked
- [x] Timeout/grace logic documented
- [x] Audit events exist

## Implementation notes

Media transport is separate from application authorization.

## Completion

- Implementation: NestJS telehealth module with `POST /telehealth/sessions`, `GET /telehealth/sessions/:id`, `POST /telehealth/sessions/:id/join`, and `POST /telehealth/sessions/:id/end`. Sessions persist tenant-scoped, one per telehealth appointment, with `waiting` / `in_session` / `ended`. Join is limited to the appointment provider, portal patient, or assigned nurse. Media/Daily is not invoked. `synthetic` is always true. Frontend live client still 404s get/join/leave until a later connect task.
- Tests: Access and 15-minute grace window units; service units for create/join/end, idempotent create, participant denial, and lazy expiry; HTTP tests for anonymous access, receptionist create/end, provider/patient/nurse join, receptionist join denial, office-visit rejection, cross-tenant not-found, client `practiceId` mismatch, join-outside-window, and audit without PHI (`npm run test:api` with Compose Postgres).
- PR:
- Notes: No `telehealth:*` catalog string; operations map to `write:appointments` plus appointment read scope and visit-participant checks. Timeout/grace is documented in data contracts and enforced lazily on GET/join/end. `end` closes the visit; there is no `/leave` route.
