---
id: FE-063
type: task
area: frontend
feature: telehealth
status: implemented
priority: high
estimate: 5
dependencies: [SEC-013, BE-027, FE-062, FE-040]
related_adrs: [ADR-011-figma-canonical-visual-source.md, ADR-013-daily-custom-call-object.md]
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../architecture/security-architecture.md,
    ../../contracts/data-contracts.md,
    ../../product/telehealth.md,
    ../../workflows/design-requirements.md,
    ../security/SEC-013-telehealth-2-visit-experience-contract.md,
    ../backend/BE-027-telehealth-keepalive-and-host-rule.md,
    FE-030-daily-media-session-shell.md,
    FE-035-clinical-live-visit-ux.md,
  ]
design:
  required: true
  tool: figma
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=499-1243"
  frame: "Page 'FE-063 Call stage and controls' (536:2), section 499:1243 (moved from the working-copies page 2026-11-10; approved by the user 2026-11-10): TH-03 provider 499:1244, TH-03 tablet 768 503:1168, TH-04 three-way with screen share and participants 499:1402, TH-05 patient mobile 499:1657, TH-07 devices modal 499:1725, TH-05b patient mobile 320 534:512, TH-05c More sheet 390 535:517, TH-05d Participants sheet 390 535:621, TH-08 End visit confirmation 535:760. Variables color/stage/* in the Color collection."
  status: approved
implementation:
  status: complete
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: a476c29a-52fe-4600-957b-2660074339f7
  identifier: MEDCONNECT-162
---

# FE-063 — Full-screen call stage and controls

## Objective

Rebuild the in-call screen as a full-screen dark stage for one to three participants: icon control
bar, server-sourced identity and mic/camera state per tile, active speaker, picture-in-picture self
view, network indicator, visit timer, devices modal, screen share layout, read-only participant
list, and the host-only End visit.

## Context

The current call view is a two-tile grid with text buttons inside the dashboard shell
(`apps/web/src/components/telehealth/daily-media-session.tsx:212`), and it assumes one remote
participant with a client-side fallback name (`daily-media-session.tsx:145`,
`apps/web/src/lib/telehealth/media-participant.ts`). End visit is shown by role
(`apps/web/src/lib/auth/telehealth-access.ts:18`, which still includes RECEPTIONIST).
[BE-027](../backend/BE-027-telehealth-keepalive-and-host-rule.md) adds `participants` and
`viewerCanEnd` to the session.

## Scope

- **Full-screen page.** The live call renders without the dashboard sidebar and header, still behind
  the dashboard auth gate (`apps/web/src/components/auth/dashboard-auth-gate.tsx`). Pick the route
  or layout approach after reading `node_modules/next/dist/docs/` (Next.js 16); keep
  `/dashboard/telehealth/[sessionId]` as the entry URL.
- **Tokens.** Add `--color-stage-*` to `apps/web/src/styles/tokens.css` from the Figma
  `color/stage/*` variables (bg, surface, surface-raised, border, border-strong, text, text-muted).
- **Tiles.** 1–3 participants plus screen share. Identity per tile = match Daily `user_id` to the
  session `participants`; name and role tag from Nest, never from Daily `user_name`. Unknown ids show
  "Participant" without a role tag. Each tile shows mic and camera state; camera-off shows initials.
  Active speaker border from `active-speaker-change`. Self view as PiP.
- **Header.** Visit title (appointment reason), Live status, elapsed timer, network indicator
  (Good / Fair / Poor from `network-quality-change`, bars plus a text label), demo data badge.
- **Control bar.** Microphone, Camera, Share screen, Background, Devices, Participants; Leave call
  (outline, everyone); End visit (red) only when `viewerCanEnd`. State shown with `aria-pressed`,
  not by renaming labels. Keyboard shortcuts use a modifier (Alt/Option+M microphone,
  Alt/Option+V camera) and are shown in tooltips; no single-character shortcuts (WCAG 2.1.4).
- **390 px.** Microphone, Camera, Flip camera, More, Leave call; More opens a sheet with Devices and
  Participants. Share screen hidden where the browser can't share.
- **Devices modal.** Video / Audio / Background tabs as in TH-07, changes apply immediately. The
  noise reduction toggle ships only if Daily's noise cancellation has no extra cost on the current
  plan; record the finding in this task and in `docs/workflows/deploy-render.md` (cost policy).
- **Participants panel.** Read-only: name, role tag, mic/camera state, weak network. No mute,
  remove or lock (M23).
- Replace role-based `canEndTelehealthVisit` with `viewerCanEnd` everywhere the visit can be ended
  (including the lobby/shell end action).
- Claim copy per SEC-013: "Encrypted connection · This visit is not recorded".

## Out of Scope

- Call states, keep-alive, room-expiry notice and wrap-up ([FE-064](FE-064-call-states-keepalive-and-wrap-up.md))
- Persona camera ([FE-065](FE-065-demo-persona-camera.md)), chat and clinical side panel (M23)

## Requirements

- Contrast AA on the dark stage (text and 3:1 for control outlines), 44 px targets, visible focus,
  focus trapped in the devices modal and returned on close, tooltips reachable by keyboard.
- No device or network data sent to Nest or logged.

## Acceptance Criteria

- [x] Frames approved on the task page before code
- [x] Stage tokens in Figma and `tokens.css` match
- [x] Three-way call shows correct names and roles from `participants`; a renamed Daily
      `user_name` does not change the tile name (unit test)
- [x] End visit visible only when `viewerCanEnd`; receptionist never sees it
- [ ] Network indicator, timer, active speaker, screen share and PiP work in live mode (hook and component tests pass; the live two-browser check on Render is pending)
- [x] 1440, 768, 390 and 320 layouts match the frames; More sheet only at 390 and below
- [ ] Keyboard shortcuts with modifier; keyboard-only and screen-reader pass recorded (shortcuts and keyboard paths are covered by unit and mock e2e tests; the screen-reader pass is not done yet)
- [x] Noise reduction decision recorded with its cost finding
- [x] CHANGELOG and version (ADR-007)

## Dependencies

- Contract: [SEC-013](../security/SEC-013-telehealth-2-visit-experience-contract.md)
- Needs: [BE-027](../backend/BE-027-telehealth-keepalive-and-host-rule.md), [FE-062](FE-062-telehealth-pre-join-green-room.md)
- Figma: https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=499-1243
- Blocks: [FE-064](FE-064-call-states-keepalive-and-wrap-up.md)

## Validation

- `npm run test -w apps/web` (tile identity mapping, controls, viewerCanEnd)
- Mock Playwright specs at four widths; live two-browser check on Render

## Risks / Considerations

- The full-screen layout overrides the FE-030 desktop frame note; SEC-013 records the decision.
- Large component: keep the Daily hook (`use-daily-media-session.ts`) as the single media source and
  split presentational pieces.


## Completion

Implemented at 1.4.0 (MINOR, new user-facing surface, 2026-11-10). Full screen uses the portal approach (user-approved
plan): `CallStagePortal` renders `CallStage` on `document.body` and marks the dashboard inert; the route, auth gate
and concurrent-session dialog are unchanged. New: `components/telehealth/call-stage/*` (header, tiles, control bar,
More sheet, devices modal, participants panel, End visit dialog, shortcuts, timer), `lib/telehealth/call-participants.ts`
(roster identity by Daily `user_id`), `components/ui/tooltip.tsx`, stage tokens in `tokens.css`, and a mock stage.
The media hook now yields tiles, active speaker, network level, device and background switching and flip camera.
`viewerCanEnd` replaced `canEndTelehealthVisit`; End visit asks first.

- Design: frames moved to the Figma page "FE-063 Call stage and controls" and approved by the user 2026-11-10.
- Noise reduction: not shipped. Daily's Krisp noise cancellation was announced with 100,000 free minutes a month and
  about $0.0002 per minute beyond that (2023); current terms for this plan are unconfirmed, so under the cost
  policy it stays off. Recorded in `docs/workflows/deploy-render.md`.
- Verified: unit and component tests (831 web tests), mock Playwright specs at 1440, 768, 390 and 320
  (`telehealth-session.spec.ts`), lint and type-check, and a browser pass of the mock stage at 1440, 390 and 320.
- Notes for the M22 close audit (QA-014). `npm run e2e:mocks` ended at 90 passed, 12 failed; none touch FE-063 code, but
  the cause was not confirmed against the base commit:
  - `date-format.spec.ts:63` (3 locales) waits for an h2 "Waiting room" after Join visit; that heading no longer exists
    in `src` (likely since the FE-062 green room), so the spec needs the new heading.
  - `auth-marketing-link.spec.ts` (8 tests) cannot find the "MedConnect Pro, back to home" link although
    `auth-brand-link.tsx` still renders it; the line-18 test's cause was not captured. Possibly environment-dependent.
  - `billing-dashboard.spec.ts:89` does not show the "Invoice was not found." alert for a patient.
- Other oddities: Headless UI dialogs open above the stage only because they use `z-[60]` against the stage's `z-50`
  (the concurrent-session dialog's stacking over the stage was not checked); the `Leave call` hover colour needed an
  `sm:` scope because a base `hover:` class beat the `max-sm:hover:` one; mock mode shows the stage with the admin
  role as an extra "You" tile because no roster role matches; marketing copy files were not checked against the
  matrix for 1.4.0.
- Not done: the live two-browser check on Render (network, active speaker, screen share and picture-in-picture with
  real media) and the screen-reader pass. At 390 px and below, End visit for the host is in the More sheet because
  the bar has no room for it.
