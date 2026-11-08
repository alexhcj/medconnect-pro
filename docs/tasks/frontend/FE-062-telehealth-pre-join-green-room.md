---
id: FE-062
type: task
area: frontend
feature: telehealth
status: pending
priority: high
estimate: 3
dependencies: [SEC-013, FE-035, FE-038, FE-056, FE-058]
related_adrs: [ADR-011-figma-canonical-visual-source.md, ADR-013-daily-custom-call-object.md]
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../architecture/security-architecture.md,
    ../../contracts/data-contracts.md,
    ../../product/telehealth.md,
    ../../workflows/design-requirements.md,
    ../security/SEC-013-telehealth-2-visit-experience-contract.md,
    FE-035-clinical-live-visit-ux.md,
  ]
design:
  required: true
  tool: figma
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=499-983"
  frame: "Page 'Telehealth 2.0 · working copies' (499:983), section Pre-join (499:984): TH-01 desktop 499:985, TH-01 camera blocked 503:690, TH-01 no camera 503:929, TH-02 mobile ready 499:1161, TH-02 mobile camera blocked 499:1203. Move to a task page and approve before code."
  status: in_progress
implementation:
  status: not_started
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: 54441cec-d284-4edb-89f5-ef8a0873b59e
  identifier: MEDCONNECT-161
---

# FE-062 — Telehealth pre-join green room

## Objective

Replace the text-only waiting room with a green room: live camera preview, camera, microphone and
speaker pickers, a microphone level meter, a test sound, browser and permission checks, background
effects, permission recovery, and an audio-only join. Desktop and mobile.

## Context

Today the waiting room has one "Check camera and microphone" button that probes `getUserMedia` and
discards the stream (`apps/web/src/components/telehealth/waiting-room.tsx`,
`apps/web/src/lib/telehealth/prejoin-devices.ts`). There is no preview and no device choice.
Join-before-mint stays (SEC-008): the green room runs before Nest join, so it has no meeting token.

## Scope

- Preview and devices through daily-js 0.81 call-object APIs (local camera start before join,
  device enumeration and selection, input settings). Check the exact method names in
  `node_modules/@daily-co/daily-js` types before coding; no new dependency.
- Microphone level meter (12 segments, `aria-valuenow` on a meter role or equivalent text), speaker
  picker with "Play test sound" (short first-party audio file).
- Checks list: browser supported, camera and microphone allowed, network. The network row uses a
  daily-js pre-call test only if it runs without a meeting token; otherwise it reads "Checked after
  you join" (no fake result, no latency number).
- Background: None / Blur / Image. Image offers Clinic exam room, Nurse station, Home living room
  (first-party static images under `apps/web/public/telehealth/backgrounds/`, exported from the
  Figma frames, compressed). No upload, no URL input. Applied with Daily's in-browser processor.
- States from the frames: ready, checking, camera and microphone blocked (`NotAllowedError`), no
  camera (`NotFoundError`/`OverconstrainedError`, reuse `classifyGetUserMediaError`), audio-only
  join. Mobile layout at 390 and 320.
- Device ids may be remembered in `localStorage` (wrapped in try/catch); nothing about devices,
  network or background is sent to Nest or logged (SEC-013 scope 7).
- Visit title from the appointment reason (DATA-007 seed); copy "Encrypted connection. This visit
  is not recorded." Never "secure", "private" or "end-to-end".
- Mock mode: deterministic preview placeholder and device list; no Daily calls.

## Out of Scope

- The in-call stage and controls ([FE-063](FE-063-call-stage-and-controls.md))
- Demo persona camera ([FE-065](FE-065-demo-persona-camera.md)); this task leaves a slot for the
  camera-source choice
- Admission and lobby (M23)

## Requirements

- 44 px targets; visible focus; selects use the design-system `SelectField` (FE-058); status changes
  announced with `aria-live="polite"`; meter has a text alternative; reduced motion respected.
- Camera and microphone stop when the user leaves the page without joining.
- Server authorization unchanged; the green room never mints a token.

## Acceptance Criteria

- [ ] Frames approved on the task page (`design.status: approved`) before code
- [ ] Preview, three pickers, meter, test sound and background options work in live mode with a
      real camera; mock mode shows placeholders
- [ ] Blocked and no-camera states match the frames; "Join with audio only" joins without video
- [ ] No device, network or background data in requests or logs (test spies on fetch)
- [ ] Unit tests for state mapping; Playwright mock spec for states at 1440, 390 and 320
- [ ] Keyboard-only and screen-reader pass recorded
- [ ] CHANGELOG and version (ADR-007); `docs/product/telehealth.md` row `telehealth.prejoin-devices`
      becomes shipped only when QA-014 confirms

## Dependencies

- Contract: [SEC-013](../security/SEC-013-telehealth-2-visit-experience-contract.md)
- Figma: https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=499-983
- Blocks: [FE-063](FE-063-call-stage-and-controls.md), [FE-065](FE-065-demo-persona-camera.md)

## Validation

- `npm run test -w apps/web` (green room, device mapping)
- `npm run e2e -w apps/web` mock specs; manual check on a real camera with the Render demo

## Risks / Considerations

- Starting the camera before Nest join must not create a Daily room session; verify the call
  object stays unjoined until mint.
- Background processing costs CPU on low-end laptops; default stays None.
