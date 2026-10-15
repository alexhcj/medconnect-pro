---
id: BE-024
type: task
area: backend
feature: telehealth
status: pending
priority: high
estimate: 3
dependencies: [BE-006, BE-021]
related_adrs: [ADR-002-tenant-isolation.md, ADR-013-daily-custom-call-object.md]
related_docs:
  [
    ../../architecture/backend-architecture.md,
    ../../architecture/security-architecture.md,
    ../../contracts/api-endpoints.md,
    ../../contracts/data-contracts.md,
    ../../product/telehealth.md,
    BE-006-telehealth-session-api.md,
    BE-021-telehealth-eligibility-and-lifecycle.md,
    ../security/SEC-008-live-telehealth-workflow-contract.md,
  ]
implementation:
  status: not_started
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: 1fe671f3-9a3c-4055-8d74-123b5c3ce047
  identifier: MEDCONNECT-111
---

# BE-024 — Telehealth open-session lookup

## Objective

Let a visit participant resolve the one non-ended telehealth session for an appointment they
can already see, without granting `write:appointments`.

## Context

`POST /telehealth/sessions` requires `write:appointments`. Join and media-token already allow
the appointment provider, the portal patient, or an assigned nurse, but only with a session id.
Appointments do not return that id, and M16 left a session list out of scope. The lobby therefore
cannot send a patient or nurse to `POST /telehealth/sessions/:id/join`.

## Scope

One lookup, not a list. A participant can resolve the non-ended session for a single appointment
id. Missing, ended-only, cross-tenant, and out-of-scope appointments use the existing not-found
response. Create, join, mint, end, and their rate limits stay as they are. Regenerate OpenAPI and
update the telehealth API contract.

Suggested shape: `GET /telehealth/sessions?appointmentId=` returning the same session object as
get, or `404` when nothing open exists. Do not accept a client practice id.

## Out of Scope

- A session list or history API
- Letting patients or nurses create a session
- Daily room or token changes
- Lobby UI (FE-038)
- Chat, recording, Socket.IO

## Requirements

- Authorization matches join: appointment provider, portal patient, or assigned nurse.
- Receptionists and unrelated users get the same not-found as an unknown id.
- An ended session is not returned as the open session.
- Tenant comes from the server session.

## Acceptance criteria

- [ ] Provider can resolve the open session after create
- [ ] Portal patient can resolve that session and cannot resolve another patient’s appointment
- [ ] Assigned nurse can resolve it; an unassigned nurse cannot
- [ ] Receptionist and a stranger receive not-found, not a distinct forbidden oracle
- [ ] Lookup does not create a session
- [ ] `POST /telehealth/sessions` still requires `write:appointments`
- [ ] Contract and generated OpenAPI describe the route
- [ ] Existing join, mint, and end tests still pass

## Dependencies

- Blocked by: BE-006, BE-021
- Related: DATA-005 (seeded portal user; tests may create their own portal user), FE-038, SEC-008

## Validation

Nest HTTP tests for the four actors above. `npm run openapi:generate` when the route ships.
Update the release-roadmap crosswalk for BE-024.

## Risks / considerations

- A filter that returns `[]` for a stranger confirms less than a 404 only if the appointment id
  space is guessable. Prefer the existing not-found used by get/join.
- Do not log meeting tokens.

## Implementation notes

Version bump when this ships is MINOR while `0.x` (new API surface).

## Completion

- Implementation:
- Tests:
- PR:
- Notes: Not started.
