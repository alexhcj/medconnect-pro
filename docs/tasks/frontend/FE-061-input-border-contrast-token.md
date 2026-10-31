---
id: FE-061
type: task
area: frontend
feature: design-system
status: pending
priority: medium
estimate: 2
dependencies: [FE-056, FE-058, INFRA-021]
related_adrs: [ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../workflows/design-requirements.md,
    FE-056-app-form-pages-surface-parity.md,
    FE-058-design-system-select-and-input-parity.md,
  ]
design:
  required: true
  tool: figma
  file_url: ""
  frame: ""
  status: not_started
implementation:
  status: not_started
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: 58a78bba-3f26-4fbd-8280-a9baca630ac1
  identifier: MEDCONNECT-153
---

# FE-061 — Input border contrast token

## Objective

Make every form control's border meet the WCAG 2.1 AA non-text contrast target (3:1) against the
white surface, so users can find the input boundary.

## Context

FE-056 left its responsive and AA criterion unticked: `--color-border-input` (#d1d5db) in
[tokens.css](../../../apps/web/src/styles/tokens.css) is about 1.5:1 on white. Keeping the token was
an approved design decision for M21 because it affects every input in the app; FE-056 asked for a
follow-up token task. The M21 close audit (2026-10-31) logged that follow-up as this task, to run
after the 1.0.0 demo release (user decision).

The token feeds the `border-input` utility used by `Input`, `SelectField`, `DateField`,
`DateTimeField`, `TimeField`, textarea styles in `form-field-styles.ts`, and the OAuth provider
button. `--color-border-strong` (hover) has the same value today, so hover shows no change.

## Scope

- Pick a new `--color-border-input` value with at least 3:1 on `--color-bg-surface` (white) and on
  the canvas (`bg-gray-50`) where controls sit on it.
- Give hover (`--color-border-strong` or a new hover token) a visible step above the new default,
  also at least 3:1.
- Update the Figma variable and the Input / Select field / Date field components to match
  (Figma first, per ADR-011).
- Check that disabled, error, and focus states stay distinct from the new default border.
- Keep card and divider borders (`--color-border-default`) unchanged; they are not control
  boundaries.

## Out of Scope

- Marketing site controls (the marketing app has no `border-input` users today).
- Control sizes, radius, or focus ring changes.
- Dark mode.

## Requirements

- One token change drives every control; no per-component colour overrides.
- Error borders stay the error colour; focus keeps the existing blue ring.

## Acceptance Criteria

- [ ] `--color-border-input` measures at least 3:1 on white and on the canvas colour; the value and
  ratios are recorded in Completion.
- [ ] Hover border is visibly different from the default and at least 3:1.
- [ ] Every `border-input` control (input, select, date, date-time, time, textarea, OAuth button)
  picks up the new value with no hard-coded border colour left.
- [ ] Layout holds at 375, 768, and 1280 px with no horizontal scroll (FE-056 check repeated).
- [ ] A unit test asserts the token ratio, and axe passes on the patient form, appointment form and
  admin filters.
- [ ] Figma variable and components are updated and approved before implementation, and the
  implementation matches them.
- [ ] FE-056's unticked responsive and AA criterion is ticked with a pointer to this task.

## Dependencies

- Blocked by: INFRA-021 (runs after the 1.0.0 demo release). Builds on FE-056 and FE-058.

## Validation

`npm run lint:web`, `npm run type-check:web`, `npm run test:web`, targeted `npm run e2e:mocks`
specs (`patient-form`, `appointment-form`, `administration`, `select-field`), and a browser check of
default, hover, focus, error and disabled states.

## Risks / considerations

- A darker border makes dense filter rows look heavier; check the admin and patient list filters.
- Screenshots that show inputs (patients, admin) will need a refresh at the next milestone close.

## Versioning

After 1.0.0: compatible visual fix → PATCH.

## Roadmap

Standalone, after the 1.0.0 demo release (INFRA-021). Logged by the M21 close audit on 2026-10-31.
