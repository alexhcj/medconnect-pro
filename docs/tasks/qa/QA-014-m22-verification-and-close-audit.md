---
id: QA-014
type: task
area: qa
feature: telehealth
status: pending
priority: high
estimate: 3
dependencies: [DATA-007, BE-027, FE-062, FE-063, FE-064, FE-065]
related_adrs: [ADR-007-semantic-versioning.md, ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../product/telehealth.md,
    ../../marketing/capability-matrix.md,
    ../../roadmap/release-roadmap.md,
    ../../workflows/frontend-testing.md,
    ../security/SEC-013-telehealth-2-visit-experience-contract.md,
    QA-007-m18-close-audit.md,
  ]
implementation:
  status: in_progress
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: 8fc98f78-a739-4e86-91d5-ccf129febeaa
  identifier: MEDCONNECT-165
---

# QA-014 — M22 verification and close audit

## Objective

Prove M22 works end to end on the live stack and Render, close the gaps, and sync docs and claims
before M22 closes.

## Scope

- **Automated.**
  - Mock Playwright: green room states, call stage at 1440/768/390/320, call states, wrap-up
    (`apps/web/e2e/telehealth-session.spec.ts` and new specs).
  - Live Playwright (`playwright.live.config.ts`, local stack): Chromium with
    `--use-fake-device-for-media-stream` and `--use-fake-ui-for-media-stream`; provider and patient
    in two contexts (plus the assigned nurse, since the roster has three); heartbeat route returns 204 for each
    participant; non-hosts are not offered End visit; receptionist cannot End visit (API matrix, since no
    receptionist can sign in locally); passive header on the inventory poll only. Local runs use the Fake Daily
    adapter, so assert UI and API, not media. The UI heartbeat timer needs a joined Daily call, so it is covered
    by unit tests and the Render run (amended 2026-11-10).
  - API: authorization matrix rows for heartbeat and the end host rule are green.
- **Manual on Render (real Daily).** Provider, patient and nurse in three browsers with persona
  cameras; screen share; network indicator; leave and rejoin; room-expiry notice (short test
  appointment); a 25-minute visit with a hidden tab still ends.
- **Accessibility.** Keyboard-only, screen reader (VoiceOver), 200% zoom, reduced motion, dark-stage
  contrast check.
- **Close audit.** Update `docs/product/telehealth.md` (planned → shipped for verified rows),
  `capability-matrix.md`, `/platform/telehealth` copy and QA-012 screenshots, the About roadmap
  board, roadmaps, master task list and AGENTS.md. Remove "Nurse (name pending)" from the Figma
  frames. Confirm no "secure", "private", "end-to-end" or "HIPAA compliant" wording.

## Out of Scope

- M23 features; load or performance testing beyond a single call

## Acceptance Criteria

- [ ] Mock and live e2e suites green twice in a row on a fresh seed
- [ ] Manual Render checklist recorded with dates
- [ ] Accessibility findings fixed or tracked as tasks
- [ ] Docs, claims, screenshots and About board synced; `npm run docs:marketing-sync` passes
- [ ] M22 close recorded with its MINOR release version (ADR-007 MINOR cap)

## Dependencies

- All M22 tasks: DATA-007, BE-027, FE-062, FE-063, FE-064, FE-065

## Validation

- CI green; recorded manual checklist in this task

## Risks / Considerations

- Real-media checks need `DAILY_API_KEY`, which exists only on Render; local CI stays on the Fake
  adapter.

## Completion

In progress (2026-11-10). Automated checks below ran on the local stack; the Render run, the accessibility
pass and the close record are not done. No M22 capability row is moved to `shipped` yet.

### Automated, done

- **Mock e2e.** `date-format.spec.ts:63` waited for the removed "Waiting room" h2 and now expects the green
  room's "Video visit…" heading. `auth-marketing-link` and `billing-dashboard` (reported failing in the FE-063
  notes) pass alone and in the full run; no code cause was found. New `e2e/telehealth-call-states.spec.ts`
  covers waiting, participant left, reconnecting, device lost, poor network and the closing notice at 390 and
  320 px (axe on the stage, no horizontal scroll). The mock stage reads `?mockState=` for this
  (`lib/telehealth/mock-call-scenario.ts`); live mode ignores it. `npm run e2e:mocks`: 120 passed on one run
  (a second run in a row is still owed).
- **Accessibility fix found by that spec.** The stage's video tile area scrolled without keyboard access when a
  status row squeezed it (axe `scrollable-region-focusable`). Fixed in FE-063's component at 1.6.1.
- **Live e2e (local stack, Fake Daily adapter).** `playwright.live.config.ts` now launches Chromium with
  `--use-fake-device-for-media-stream` and `--use-fake-ui-for-media-stream` and grants camera and microphone.
  `live.setup.ts` and `live.teardown.ts` also sign the portal patient and the MFA nurse in and out. The
  rewritten `telehealth-live.spec.ts` runs provider, patient and nurse in three contexts on one session id and
  checks: the passive header appears only on `/auth/sessions`; the heartbeat route returns 204 for all three;
  only the provider is offered End visit; leave and rejoin keep the visit open; after End visit the provider
  sees the wrap-up, the others see "Your visit has ended", and the heartbeat is refused (404 or 409). Passed on
  a fresh seed, run through the `setup`, `app` and `teardown` projects separately because of the blocker below.
- **API.** `authorization-matrix.http.spec.ts` plus `src/telehealth` (209 tests) and `telehealth.http.spec.ts`
  (13) pass. `npm run openapi:generate` leaves `openapi.json` unchanged, which settles the FE-065 note about
  its hand edit.

### Blockers and findings

- **Live suite cannot run end to end.** `auth-wake-live` fails three tests, so `setup` and `app` never start
  (`auth` is a dependency of `setup`). One is `color-contrast` 4.39:1 on the demo panel's preview line; tracked
  as [FE-066](../frontend/FE-066-muted-text-contrast-on-subtle-surfaces.md). The criterion "mock and live e2e
  suites green twice in a row" stays open until FE-066 ships.
- **Spec conflict (heartbeat).** The scope and FE-064 ask for the heartbeat on the local stack. With the Fake
  adapter the room URL is `unconfigured.invalid`, the stage ends in `not_configured`, and that is not a joined
  state, so the UI timer never starts. The heartbeat is therefore checked at the API route locally; the timer
  is covered by `use-visit-keepalive` unit tests, and the 25-minute hidden-tab run (FE-064's criterion) can
  only happen on Render. Resolved (user, 2026-11-10): FE-064's criterion and this scope now say Render.
- **Finding (green room).** The green room shows only while the session is `waiting`. A patient or nurse who
  opens a visit the provider has already joined lands on the stage with no device check. Logged as FE-067.
- **Receptionist.** No receptionist can sign in locally, so "receptionist cannot End visit" stays in the API
  matrix rather than the live UI.
- **Wording sweep.** No "secure", "private", "end-to-end" or "HIPAA compliant" in marketing copy. In the web app's
  telehealth code the only hit is "Your real camera stays private" (`persona-camera-parts.tsx`), which SEC-013
  scope 10 forbids. Resolved (user, 2026-11-10): reworded to "Your real camera stays off" at 1.6.1; the approved
  FE-065 Figma frame still has the old text. Outside telehealth, `terms-of-service` and `privacy-policy` pages in
  `apps/web/src/app` say "HIPAA Compliant" and "HIPAA-compliant" (for example `privacy-policy/page.tsx:524`),
  which contradicts the project rules. Not part of M22; logged as FE-068.

### Docs synced so far

Capability matrix Telehealth row (green room, call states, wrap-up, persona camera, with the live checks marked
pending and no new public claim), `docs/product/telehealth.md` `related_tasks`, the About board (Telehealth 2.0
visit experience moved to In progress; admit, lock and chat renamed "clinical controls" under Up next), the M23
"Planned 1.2.0" text (1.2.0 already shipped with M22) in the roadmap and master list, and the live e2e sign-in
budget in `docs/workflows/frontend-testing.md`.

### Still to do

Second green mock run and two green live runs; the Render checklist with dates (three browsers, persona
cameras, screen share, network indicator, leave and rejoin, room-expiry notice, 25-minute hidden-tab visit);
keyboard, VoiceOver, 200% zoom, reduced-motion and dark-stage contrast passes; moving verified registry rows to
`shipped`; `/platform/telehealth` copy and QA-012 screenshots after that; removing "Nurse (name pending)" from
the Figma frames (needs Figma access); the M22 close record and release version (user decision).
