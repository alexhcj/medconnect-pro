---
id: QA-013
type: task
area: qa
feature: testing
status: pending
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
  status: not_started
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

- [ ] `date-format.spec.ts` passes under `ru-RU`, `de-DE`, `en-GB` and `en-US` in Chromium.
- [ ] A local Firefox run of the date spec is recorded (pass or the failures found).
- [ ] A mock e2e signs in through the demo account picker and asserts the visible "Copied" state.
- [ ] MFA "Fill code" is covered in the live suite, or Completion states why it stays unit-only.
- [ ] Screen-reader and 200% zoom results for the date field and calendar are recorded; any
  defect has its own task ID.
- [ ] FE-057 criteria are ticked only where this task verified them.

## Dependencies

- Blocked by: INFRA-021 (runs after the 1.0.0 demo release). Verifies FE-057 and FE-059.

## Validation

`npm run e2e:mocks` (targeted specs), `npm run lint:web`, `npm run type-check:web`, and the live
spec if MFA coverage is added.

## Versioning

Test and docs only: no version bump.

## Roadmap

Standalone, after the 1.0.0 demo release (INFRA-021). Logged by the M21 close audit on 2026-10-31.
