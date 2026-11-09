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
  status: not_started
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
    in two contexts; heartbeat requests observed; receptionist cannot End visit; passive header on
    the inventory poll. Local runs use the Fake Daily adapter, so assert UI and API, not media.
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
