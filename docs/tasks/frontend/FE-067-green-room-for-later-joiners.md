---
id: FE-067
type: task
area: frontend
feature: telehealth
status: implemented
priority: medium
estimate: 3
dependencies: [FE-062, FE-063, FE-064]
related_adrs: [ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../product/telehealth.md,
    ../../workflows/design-requirements.md,
    ../security/SEC-013-telehealth-2-visit-experience-contract.md,
    FE-062-telehealth-pre-join-green-room.md,
    ../qa/QA-014-m22-verification-and-close-audit.md,
  ]
design:
  required: true
  tool: figma
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd"
  frame: "FE-067 Green room for later joiners (page 561:328)"
  status: approved
implementation:
  status: complete
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: e80f163c-98c0-4c81-bbf8-6c9e31285fcb
  identifier: MEDCONNECT-167
---

# FE-067 — Green room for later joiners

## Objective

Show the pre-join green room to every participant, not only the first one to join, so a patient or nurse
checks their camera, microphone and speaker before they enter a visit that is already in progress.

## Context

QA-014 found this on the local stack (2026-11-10). In
[telehealth-session-shell.tsx](../../../apps/web/src/components/telehealth/telehealth-session-shell.tsx) the green
room renders only while the Nest session `state` is `waiting`; the call stage renders when it is `in_session`.
The first joiner (usually the provider) moves the session to `in_session`, so a patient or nurse who opens the
visit afterwards lands on the stage and the media hook joins Daily with default devices. They get no preview,
no device pickers, no test sound and no blocked-permission recovery, and no persona choice in demo builds.
FE-062's acceptance criteria and the SEC-013 green-room scope read as if every participant gets it. The
2026-11-09 production check used one device per participant, so it did not exercise this order.

## Scope

- Decide, in Figma first (ADR-011), whether a later joiner sees the same green room, or a shorter variant, and
  record the frames on this task.
- Show the green room to a participant who has not yet joined the call from this browser, whatever the session
  `state` is (`waiting` or `in_session`), and keep the stage for a participant who is already in the call.
- Use the existing Nest join path for a later joiner. Confirm whether `POST .../join` is idempotent on an
  `in_session` visit and what the authorization matrix says before relying on it; do not change the server
  without a contract edit.
- Keep the camera and microphone stopped until the participant joins, and keep the preview from creating a
  Daily room session (FE-062 requirement).
- Cover leave and rejoin: a participant who left the call and rejoins keeps today's behaviour (no green room)
  unless the design decides otherwise.

## Out of Scope

- Admission, lobby and admit by the host (M23).
- Changes to the host-only End visit rule, the heartbeat or token minting.
- Persona camera behaviour other than being offered in the green room (FE-065).

## Requirements

- No device, network or background data in requests or logs (SEC-013 scope 7).
- Server authorization is unchanged; the green room never mints a token.
- The viewer's role decides the "waiting for" wording only, never access.

## Acceptance Criteria

- [x] Frames approved on the task page before code
- [x] A patient or nurse opening a visit that is `in_session` sees the green room first, and the stage only after Join (mock e2e and shell unit tests)
- [x] The first joiner's flow and the leave/rejoin flow behave as before (green room, call-states and session mock e2e unchanged and passing)
- [ ] No Daily room session is created while a later joiner is in the green room (verified, not assumed). Mock e2e asserts no `media-token` request before Join; the live check is not run yet
- [ ] Unit tests cover the state mapping; mock e2e covers a later joiner at 1440, 390 and 320 px; the live
      three-participant spec in `telehealth-live.spec.ts` asserts the green room for the patient and nurse. Unit and mock e2e done; the live spec is edited but has not run (QA-015 times out first)
- [ ] Keyboard-only and screen-reader pass recorded
- [x] CHANGELOG and version (ADR-007); `docs/product/telehealth.md` row `telehealth.prejoin-devices` stays accurate

## Dependencies

- Design (approved 2026-11-11): https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=561-328 (page
  "FE-067 Green room for later joiners": desktop patient, nurse and provider; mobile 390 and 320).
  Decisions: D1 same green room plus one status line; D2 plain line under the schedule text; D3 rejoin keeps
  today's behaviour (no green room); D4 provider joining later gets the same green room, wording "The patient
  is already in this visit".
- Builds on FE-062 (green room), FE-063 and FE-064 (stage and states).
- Related: QA-014 (found it), SEC-013 (contract), FE-065 (persona option in the green room).

## Validation

`npm run test:web`, `npm run lint:web`, `npm run type-check:web`, `npm run e2e:mocks`, and the live procedure in
[frontend-testing.md](../../workflows/frontend-testing.md). Manual: two browsers on Render with real cameras,
second participant opens the visit after the first has joined.

## Risks / Considerations

- The mock flow has one user, so mock e2e cannot reproduce the order by itself; it needs a way to open an
  `in_session` visit (for example the existing mock fixture session).
- A longer path for the second participant delays their entry; the design should keep Join one action away.

## Versioning

After 1.0.0: compatible feature or fix → MINOR or PATCH per ADR-007. Shipped as PATCH 1.6.3: it makes the
app match what FE-062 and SEC-013 already describe, with no new API or capability.

## Roadmap

Standalone follow-up to M22, found by QA-014. Not part of M22 and not an M23 control.

## Completion

Implemented 2026-11-11 at 1.6.3.

- `apps/web/src/lib/telehealth/visit-view.ts`: `visitView({state, joinedHere, closed})` returns `closed`,
  `green_room` or `stage`. The shell (`telehealth-session-shell.tsx`) keeps a page-local `joinedHere` flag, set on a
  successful join, so a later joiner gets the green room until they join from this page. A reload returns to the
  green room (decision: keep it for now). Leave and Rejoin call stay inside the stage.
- `green-room.tsx`: optional `inProgressText` line under the schedule, repeated once in the polite live region.
- Server: no change. Nest join is already idempotent on `in_session` (`telehealth-session.service.ts:127`); the
  sentence was added to `docs/contracts/data-contracts.md`.
- Mock: `?mockVisit=in_progress` opens a visit as already live; a repeat mock join keeps `joinedAt`.
- Tests: `visit-view.test.ts`, shell, green room and mock unit tests; `e2e/telehealth-later-joiner.spec.ts` (1440,
  390, 320: patient, provider, reload, first joiner, axe, no horizontal scroll, no `media-token` before Join);
  `telehealth-live.spec.ts` now expects the green room for all three participants and no token before Join.

Deviation from the approved frames: the frames name the person ("Dr. Jordan Ellis is already in this visit", "The
patient is already in this visit"). The client cannot know who is connected (`participants` is the assigned roster,
not presence), so this ships with the neutral line "This visit has already started". Naming the person needs
connected-participant presence from Nest and a contract edit. Known limitation until that backend task and its
frontend follow-up ship; mock mode keeps its mock roster. The Figma frames still show the named wording as the target.

Not verified: the live three-participant spec (blocked by QA-015), the live no-Daily-session check, the two-browser run
on Render, and the keyboard-only and screen-reader pass.
