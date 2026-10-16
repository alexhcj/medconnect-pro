---
id: FE-038
type: task
area: frontend
feature: telehealth
status: implemented
priority: high
estimate: 3
dependencies: [BE-024, DATA-005, FE-035]
related_adrs: [ADR-011-figma-canonical-visual-source.md, ADR-013-daily-custom-call-object.md]
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../contracts/api-endpoints.md,
    ../../product/telehealth.md,
    ../../marketing/capability-matrix.md,
    ../../workflows/design-requirements.md,
    ../../workflows/deploy-render.md,
    FE-014-telehealth-ui-nest-api.md,
    FE-030-daily-media-session-shell.md,
    FE-035-clinical-live-visit-ux.md,
    ../backend/BE-024-telehealth-open-session-lookup.md,
    ../backend/DATA-005-synthetic-patient-portal-account.md,
  ]
design:
  required: true
  tool: figma
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd"
  frame: "App / Telehealth session — 04 Connected — tablet (167:5); M18 lobby entry delta approved with the milestone plan"
  status: approved
implementation:
  status: complete
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: 1af24924-92c9-4d06-81fb-c5be8eb3dddd
  identifier: MEDCONNECT-113
---

# FE-038 — Telehealth participant entry

## Objective

Let a portal patient or assigned nurse open an existing visit from the lobby, then use the
current waiting room and join call.

## Context

Live **Join visit** always `POST`s `/telehealth/sessions`, which requires `write:appointments`.
Patients and nurses do not have that permission, so they never reach
`POST /telehealth/sessions/:id/join`. BE-024 adds the lookup. The session shell already joins
when the waiting room asks it to.

The seeded “Live demo telehealth visit” is only inside the join window for about four hours
after seed. Interviewers should schedule a telehealth visit that includes now. Do not set
`SEED_ON_DEPLOY=true` for each interview.

Design delta is approved on the existing FE-035 telehealth frames. No new Figma file.

## Scope

- Roles that can create still call create, then open `/dashboard/telehealth/:id`.
- Patient and nurse call the BE-024 lookup, then open that id.
- If lookup is not-found, say the visit is not open yet. Do not create a session.
- Unauthorized and ended copy stays as it is.
- Document the “schedule an in-window visit” step in [deploy-render.md](../../workflows/deploy-render.md).

## Out of Scope

- Daily call-object changes
- A session list UI
- Defaulting the appointment form to “now”
- Setting `DAILY_API_KEY`
- Chat, recording, Socket.IO

## Requirements

- The client must not invent a session id from the appointment id in live mode.
- A patient must not see another patient’s visit in the lobby (API own-scope remains authoritative).
- End visit stays limited to roles that already have `canEndTelehealthVisit`.

## Acceptance criteria

- [x] Provider or practice admin Join visit still creates or reuses the session and opens it
- [x] Patient and assigned nurse open the existing session id from lookup and can join from the waiting room
- [x] Patient and nurse see “not open yet” when the provider has not started, with no create request
- [x] Receptionist still cannot join
- [x] Ended and ineligible visits keep the current unavailable states
- [x] Daily media code is unchanged; unset `DAILY_API_KEY` still shows media unavailable
- [x] The Render runbook tells the interviewer to schedule an in-window telehealth visit and not to reseed
- [x] Component tests cover writer create versus participant lookup

## Dependencies

- Blocked by: BE-024, DATA-005, FE-035
- Design: [FE-035 telehealth frame](https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd), status approved
- Related: SEC-008, telehealth.start-session

## Validation

Vitest for the lobby branch. Browser: provider starts a visit, patient in a second profile opens
the same session. Update the release-roadmap crosswalk for FE-038.

## Risks / considerations

- Two-way video still needs an operator-set `DAILY_API_KEY`. This task is done when both browsers
  share the application session, even if media is labeled unavailable.
- Do not grant the patient `write:appointments` to shortcut the lookup.

## Implementation notes

Version bump when this ships is MINOR while `0.x` if the user-facing join path is new. A patch
is wrong: the patient journey is a new demo capability.

## Completion

- Implementation: Live Join visit still creates for roles with `write:appointments`. A portal patient or assigned nurse calls `GET /telehealth/sessions?appointmentId=` and opens that server id. Lookup 404 says the visit is not open yet and does not create a session. Mock mode still uses the derived session link. End visit and Daily media are unchanged.
- Tests: Vitest for the GET client and for writer create versus participant lookup, including 404 without create. Browser check of provider create and patient lookup.
- PR:
- Notes: Version 0.89.0 → 0.90.0 (MINOR, new patient and nurse join path). OAuth hiding stays FE-039. Two-browser close stays QA-007.
