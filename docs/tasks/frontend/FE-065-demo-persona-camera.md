---
id: FE-065
type: task
area: frontend
feature: telehealth
status: implemented
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
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=551-2"
  frame: "Page 'FE-065 Demo persona camera' (551:2), moved from the working-copies page 2026-11-10; approved by the user 2026-11-10: section Demo persona (499:2465) — TH-10 provider persona 499:2466, TH-11 My camera selected 548:430, TH-12 persona unavailable fallback 548:725, TH-13 nurse account 547:363, TH-14 patient account 547:666, TH-15 mobile 390 549:482, TH-16 design notes 550:503. Persona illustrations come from TH-10 (Persona artwork 499:2576, 499:2698, 499:2855)."
  status: approved
implementation:
  status: in_progress
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

- [x] Frame approved on the task page before code (2026-11-10)
- [x] Option absent unless `NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=true` (unit and build-time check)
- [x] Each demo account shows its own persona; other personas are not selectable
- [ ] Two-browser call shows the persona video with the synthetic label; names come from Nest
- [ ] Reduced-motion variant; keyboard and screen-reader pass recorded (reduced motion and keyboard are covered by tests; the screen-reader pass is not recorded)
- [x] CHANGELOG and version (ADR-007), 1.6.0

## Dependencies

- Contract: [SEC-013](../security/SEC-013-telehealth-2-visit-experience-contract.md)
- Needs: [DATA-007](../backend/DATA-007-staff-display-identity.md), [FE-062](FE-062-telehealth-pre-join-green-room.md)
- Figma: https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=551-2

## Validation

- `npm run test -w apps/web` (flag gating, persona selection by account)
- Manual: provider and patient in two browsers on Render, persona camera on both

## Completion

Implemented at 1.6.0 (MINOR). Two criteria stay open: the two-browser call on Render with real Daily, and the
recorded screen-reader pass.

- **Persona key source (plan blocker, user decision):** `viewerPersonaKey` on the telehealth session response
  (`telehealth-session.rdo.ts`, `TelehealthSessionRepository.findPersonaKey`, service spec). The caller's own
  membership key only; not in `participants`. Mock mode maps the fixture account (`mockViewerPersonaKey`).
  `openapi.json` was edited by hand for this one property because the generator needs Postgres, which was not
  running; rerun `npm run openapi:generate` to confirm there is no diff.
- **Catalog and art:** `lib/telehealth/demo-personas.ts`, SVGs in `public/telehealth/personas/` exported from the
  approved Figma frames (the mouth cue is an overlay at a per-persona anchor; the art has no separate mouth layer).
- **Engine:** `lib/telehealth/persona-camera.ts` (canvas, `captureStream(15)`, Web Audio analyser, reduced motion,
  stops drawing after 10 s hidden, `stop()` releases track, timer and microphone). Tests: `persona-camera.test.ts`.
- **UI:** `persona-camera-parts.tsx` and `green-room.tsx` (source picker, persona strip, preview with the
  "Demo · synthetic camera" badge, demo banner, fallback notice). The preview call's camera is turned off while the
  persona is chosen (`setCameraEnabled` in `use-prejoin-media.ts`).
- **Join and call:** `JoinChoices.personaCamera` carries the handle; `dailyJoinOptions` skips the Daily processor for a
  custom source; the shell stops the persona when the visit ends or the page unmounts. In call, the local tile shows
  the badge, and the Devices dialog replaces the Camera select with a note.
- **Deviation:** the persona is not switchable in the call (green room only), as planned.
- **Checks:** `vitest` web 920 and api telehealth specs pass; `type-check` web and api; web lint has no errors;
  Playwright `telehealth-green-room.spec.ts` and `telehealth-session.spec.ts` (25 passed, includes the five FE-065
  cases with a real canvas). `telehealth.http.spec.ts` was not run (needs Postgres).

## Risks / Considerations

- Marketing may show persona screenshots only after QA-014 marks the capability shipped, and must
  label them as demo personas (capability matrix).
