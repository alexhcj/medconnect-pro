---
id: FE-065
type: task
area: frontend
feature: telehealth
status: pending
priority: medium
estimate: 3
dependencies: [SEC-013, DATA-007, FE-062]
related_adrs: [ADR-005-synthetic-demo-data.md, ADR-011-figma-canonical-visual-source.md, ADR-013-daily-custom-call-object.md]
related_docs:
  [
    ../../contracts/environment-configuration.md,
    ../../architecture/security-architecture.md,
    ../../product/telehealth.md,
    ../../marketing/capability-matrix.md,
    ../security/SEC-013-telehealth-2-visit-experience-contract.md,
    ../backend/DATA-007-staff-display-identity.md,
    FE-062-telehealth-pre-join-green-room.md,
  ]
design:
  required: true
  tool: figma
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=499-983"
  frame: "Page 'Telehealth 2.0 · working copies' (499:983), section Demo persona (499:2465): TH-10 demo persona pre-join 499:2466. Persona illustrations come from that frame. Move to a task page and approve before code."
  status: in_progress
implementation:
  status: not_started
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: 70cb581b-fc2e-43e2-8bfb-9ff5999b3e78
  identifier: MEDCONNECT-164
---

# FE-065 — Demo persona camera

## Objective

Let one presenter run a provider, nurse and patient call on one laptop without showing a real face:
in demo builds the camera source can be an illustrated persona of the signed-in account, sent to
Daily as a synthetic video track and always labeled.

## Context

[SEC-013](../security/SEC-013-telehealth-2-visit-experience-contract.md) scope 9 sets the boundary.
[DATA-007](../backend/DATA-007-staff-display-identity.md) gives each demo membership a `personaKey`
(`provider-jordan-ellis`, `nurse-riley-park`, `patient-avery-quinn`). The flag
`NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS` already marks demo builds (`apps/web/src/lib/auth/demo-accounts.ts:21`).

## Scope

- Camera source choice in the green room: "My camera" / "Demo persona camera", shown only when
  `NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=true`. Hosted production never renders it.
- The persona is the signed-in membership's `personaKey`. The other demo accounts' personas are
  shown greyed out for context and are not selectable. The displayed name always comes from the
  session (DATA-007/BE-027), never from the persona.
- Rendering: export the three persona illustrations from the Figma frame as SVG into
  `apps/web/public/telehealth/personas/`. Draw the persona on a canvas over the selected background,
  with a light idle motion and a mouth/level cue driven by the local microphone level (Web Audio
  analyser). Capture with `canvas.captureStream()` at about 15 fps and pass the video track to
  Daily as a custom video source (check the daily-js 0.81 API in `node_modules`).
- A persistent "Demo · synthetic camera" label on the local preview and a demo banner on the green
  room. Remote participants see the persona video; the server knows nothing about it.
- Reduced motion: no idle animation, static mouth.

## Out of Scope

- Face tracking, overlays on a real camera, AI-generated or per-gender personas
- Choosing another identity or name
- New environment variables

## Requirements

- Off by default; never applied to anyone else's video; no data about the choice sent to Nest or
  logged.
- Canvas work pauses when the call ends or the page is hidden for long; no measurable CPU drain on
  an idle tab.

## Acceptance Criteria

- [ ] Frame approved on the task page before code
- [ ] Option absent unless `NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=true` (unit and build-time check)
- [ ] Each demo account shows its own persona; other personas are not selectable
- [ ] Two-browser call shows the persona video with the synthetic label; names come from Nest
- [ ] Reduced-motion variant; keyboard and screen-reader pass recorded
- [ ] CHANGELOG and version (ADR-007)

## Dependencies

- Contract: [SEC-013](../security/SEC-013-telehealth-2-visit-experience-contract.md)
- Needs: [DATA-007](../backend/DATA-007-staff-display-identity.md), [FE-062](FE-062-telehealth-pre-join-green-room.md)
- Figma: https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=499-983

## Validation

- `npm run test -w apps/web` (flag gating, persona selection by account)
- Manual: provider and patient in two browsers on Render, persona camera on both

## Risks / Considerations

- Marketing may show persona screenshots only after QA-014 marks the capability shipped, and must
  label them as demo personas (capability matrix).
