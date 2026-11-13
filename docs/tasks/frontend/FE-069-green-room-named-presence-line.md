---
id: FE-069
type: task
area: frontend
feature: telehealth
status: pending
priority: low
estimate: 2
dependencies: [BE-028, FE-067]
related_adrs: [ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../product/telehealth.md,
    ../../workflows/design-requirements.md,
    ../security/SEC-013-telehealth-2-visit-experience-contract.md,
    ../backend/BE-028-telehealth-connected-participants.md,
    FE-067-green-room-for-later-joiners.md,
  ]
design:
  required: true
  tool: figma
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd"
  frame: "FE-067 Green room for later joiners (page 561:328); frames for several connected people and the fallback line still to add"
  status: in_progress
implementation:
  status: not_started
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: 3ac15e53-8e5d-46b9-805e-84492dafad91
  identifier: MEDCONNECT-171
---

# FE-069 — Green room named presence line

## Objective

The green room names who is already in the visit when Nest says so, and falls back to the generic line when it
cannot.

## Context

FE-067 ships "This visit has already started" to a later joiner because the client has no presence data. BE-028 adds
the connected subset of the roster to the session response. The approved FE-067 Figma frames show the named wording
("Dr. Jordan Ellis is already in this visit", "The patient is already in this visit"). This task makes the app match
them.

## Design requirement (blocks implementation)

The FE-067 frames cover one named person only. **Add frames to the shared Figma file (ADR-011) before code** for:

- several connected people (one line naming them, shortened to fit at 320 px);
- the fallback line when presence is unavailable or empty ("This visit has already started").

Record them on this task, then set `design.status: approved`. Until then `design.status` stays `in_progress` and this
task must not be implemented.

## Scope

- Add the presence field to the telehealth session type and API mapper, validating the shape (`userId`, `role`; no
  names from Daily).
- Replace the interim text with role-aware wording chosen by the viewer's role and the connected set:
  - a patient or nurse viewer with the provider connected: "<Provider name> is already in this visit";
  - a provider viewer with the patient connected: "The patient is already in this visit";
  - several connected: one line naming the connected people, shortened to fit at 320 px;
  - nobody else connected but the visit is live: keep "This visit has already started".
- Names come from the roster Nest sends. A connected `userId` that is not on the roster is ignored.
- Presence unavailable, empty or stale: show the generic line. Never name someone from old data.
- Mock mode: the mock roster is the mock presence. `?mockVisit=in_progress` connects the provider, so the later-joiner
  e2e shows the named line.
- Update the shell tests, the later-joiner mock e2e and the live spec.

## Out of Scope

- The backend field (BE-028), admission and lobby (M23), and any change to who can join.
- Presence anywhere else, such as the call stage tiles.
- A new green-room layout; only the wording of the existing line changes.

## Requirements

- The viewer's role decides wording only, never access.
- No device, network or background data in requests or logs (SEC-013 scope 7).
- The line stays one line at 320 px and is announced once in the polite live region.

## Acceptance Criteria

- [ ] Frames for several connected people and the fallback line approved on this task before code
- [ ] A patient or nurse opening a live visit with the provider connected sees "<Provider name> is already in this visit"
- [ ] A provider opening a live visit with the patient connected sees "The patient is already in this visit"
- [ ] Presence unavailable, empty or unknown user ids show "This visit has already started" and never a stale name
- [ ] The line fits at 1440, 390 and 320 px without horizontal scroll, and axe passes
- [ ] Unit tests cover the wording choice; mock e2e shows the named line; the live spec asserts it for the patient and nurse
- [ ] Screen-reader pass: the line is announced once
- [ ] CHANGELOG and version (ADR-007)

## Dependencies

- BE-028 must ship first (the presence field). FE-067 and its approved frames:
  https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=561-328
- Related: FE-062 (green room), SEC-013 (contract), QA-015.

## Validation

`npm run test:web`, `npm run lint:web`, `npm run type-check:web`, `npm run e2e:mocks`, and the live procedure in
[frontend-testing.md](../../workflows/frontend-testing.md) with two real participants on Render.

## Risks / Considerations

- Presence lags by a few seconds (BE-028), so the line can briefly name someone who just left. The wording stays
  factual, not real time.
- Naming a person to a patient is sensitive. Names come only from the roster the participant is already allowed to see.

## Versioning

After 1.0.0: a wording change on existing UI is a PATCH (ADR-007), decide when scoped.

## Roadmap

Standalone follow-up to M22, after BE-028. Not part of M22 and not an M23 control. No milestone crosswalk row.
