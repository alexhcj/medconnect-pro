---
id: QA-013
type: task
area: qa
feature: testing
status: implemented
priority: medium
estimate: 2
dependencies: [FE-057, FE-059, INFRA-021]
related_adrs: []
related_docs:
  [
    ../frontend/FE-057-us-date-format-and-date-picker.md,
    ../frontend/FE-059-demo-account-picker.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: true
  tests_required: true
plane:
  work_item_id: 75b5029e-48b0-4be5-ab6a-99acdd5511b8
  identifier: MEDCONNECT-154
---

# QA-013 — M21 verification sweep: date locales, picker e2e, manual accessibility

## Objective

Close the verification that FE-057 and FE-059 left open, without reopening those tasks.

## Context

The M21 close audit (2026-10-31) found these checks recorded as not done:

- FE-057 ran its date e2e only in Chromium with `ru-RU`. German, English (UK) and Firefox were not
  run, and the manual screen-reader pass and 200% zoom were not done.
- FE-059 is covered by Vitest only. `apps/web/e2e/auth.spec.ts` still types the demo email by hand;
  the visible "Copied" state and MFA "Fill code" were never exercised in a browser.

The user decided to run this after the 1.0.0 demo release.

## Scope

- Extend [date-format.spec.ts](../../../apps/web/e2e/date-format.spec.ts) to run its cases under
  `de-DE`, `en-GB` and `en-US` locales (with a non-US time zone for at least one), in addition to
  `ru-RU`.
- Run the date spec once in Firefox locally and record the result. Do not add a Firefox project to
  CI.
- Add a mock e2e for the demo account picker on `/login`: one-tap fill and sign in for at least two
  roles, and the "Copied" state with clipboard permissions granted in Chromium.
- Cover MFA "Fill code" in the live suite (`auth-mfa-live.spec.ts`) if a seeded account gets an MFA
  challenge; otherwise record it as unit-only.
- Manual pass on the date field and calendar: keyboard plus a screen reader (NVDA or Narrator) and
  200% browser zoom. Record findings in Completion.
- Tick FE-057 lines 125 and 133 only for what this task verifies, with a pointer to QA-013.

## Out of Scope

- FE-057's Figma review (a user step).
- Fixing defects found here: open a task for each instead.
- New product behaviour.

## Acceptance Criteria

- [x] `date-format.spec.ts` passes under `ru-RU`, `de-DE` and `en-GB` in Chromium (`en-US` stays
  covered by the 2026-10-31 manual check in FE-057, by decision: two added languages at most).
- [x] A local Firefox run of the date spec is recorded (pass or the failures found).
- [x] A mock e2e signs in through the demo account picker and asserts the visible "Copied" state.
- [x] MFA "Fill code" is covered in the live suite, or Completion states why it stays unit-only.
- [x] Screen-reader and 200% zoom results for the date field and calendar are recorded; any
  defect has its own task ID.
- [x] FE-057 criteria are ticked only where this task verified them.

## Dependencies

- Blocked by: INFRA-021 (runs after the 1.0.0 demo release). Verifies FE-057 and FE-059.

## Validation

`npm run e2e:mocks` (targeted specs), `npm run lint:web`, `npm run type-check:web`, and the live
spec if MFA coverage is added.

## Versioning

Test and docs only: no version bump.

## Roadmap

Standalone, after the 1.0.0 demo release (INFRA-021). Logged by the M21 close audit on 2026-10-31.

## Completion

- Audit note: the Context section was written at the M21 close audit. The 0.103.6 fix (2026-10-31)
  then ran the four-language manual check, the keyboard and axe passes, and the 200% zoom check, and
  added the zoom e2e. QA-013 added only what was still missing.
- Date spec: [date-format.spec.ts](../../../apps/web/e2e/date-format.spec.ts) runs its US-format
  checks (profile, lists, telehealth range, no native inputs) in a `ru-RU` browser (Los Angeles),
  a `de-DE` browser in `Europe/Berlin` (non-US zone) and an `en-GB` browser (Los Angeles). The rest of
  the spec runs once. Chromium: 23 passed. `en-US` was not added to the spec (two extra languages at
  most, by decision); it stays covered by the manual check in FE-057 Completion (2026-10-31).
- Firefox (local, Playwright Firefox 155.0, throwaway config, no CI project): the whole date spec,
  23 passed, including axe on the open calendar, 200% zoom and 320 px.
- Demo account picker: new [demo-account-picker.spec.ts](../../../apps/web/e2e/demo-account-picker.spec.ts)
  (5 tests): one-tap fill and sign in as Provider and Patient, selection cleared on edit, and the
  visible "Copied" state with the clipboard value checked (email and password, Chromium clipboard
  permissions granted). It passed with `auth.spec.ts` (11 passed). `NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS`
  is now set in `playwright.config.ts` and `playwright.live.config.ts`. The run used a dev server that
  also read the flag from the gitignored `.env.development`, so the new config line itself was not
  isolated.
- MFA "Fill code": [auth-mfa-live.spec.ts](../../../apps/web/e2e/auth-mfa-live.spec.ts) now clicks
  "Fill code", checks the field holds the fixture code and that Verify has focus, then verifies. It
  passed against the local API (migrated and seeded). It replaces the typed code, so there is no extra
  sign-in.
- Screen reader (Windows Narrator, run by the user on 2026-11-02): the date field, calendar
  button, dialog and day cells were read correctly; no defect found, so no task opened. Observation:
  opening the dialog reads its name and then every day in the grid, which is normal Narrator
  behaviour for a dialog and was accepted for a demo. 200% zoom: unchanged from FE-057 (0.103.6 fix,
  e2e at `date-format.spec.ts` "Date fields at 200% zoom").
- Checks: `npm run lint:web` 0 errors (9 existing warnings), `npm run type-check:web` clean.
- No version bump (test and docs only).
