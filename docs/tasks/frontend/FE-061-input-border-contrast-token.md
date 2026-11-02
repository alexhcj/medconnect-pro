---
id: FE-061
type: task
area: frontend
feature: design-system
status: implemented
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
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=469-50"
  frame: "FE-061 Input border contrast (page; node-id=469-50): review frame 469:51 shows Input, Select field, Date field, outline Button and ProviderButton (default, hover, disabled) on white and canvas. Variables: color/border/input -> new primitive gray/450 (#808896); new color/border/input-hover -> gray/500. Variants rebound: Select field Hover 442:35 and 442:119, Input Hover 442:1029, new Date field State=Hover 468:4240; Disabled strokes (Select field, Input, Date field, Date time field, ProviderButton) now color/border/default."
  status: approved
implementation:
  status: complete
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
- Decided (user, 2026-11-02): default softened after review to a lighter AA gray, new primitive gray/450 `#808896` (3.57:1 on white, 3.42:1 on canvas; first pick gray/500 read too heavy);
  hover is a new `--color-border-input-hover` = gray/500 `#6b7280` (4.83:1 on white).
  `--color-border-strong` stays `#d1d5db` (cards, preview banner and status pill use it).
- Disabled controls step down to `--color-border-default` (gray/200); WCAG exempts disabled
  controls and the lighter border reads as inactive next to the darker default.
- In scope beyond `border-input` users: the outline `Button` variant, and the hard-coded
  `border-gray-300` controls in `concurrent-session-dialog.tsx` (checkbox, cancel button) and
  `session-extension-modal.tsx` (button); switch them to the token.
- Check that error and focus states stay distinct from the new default border.
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

- [x] `--color-border-input` measures at least 3:1 on white and on the canvas colour; the value and
  ratios are recorded in Completion.
- [x] Hover border is visibly different from the default and at least 3:1.
- [x] Every `border-input` control (input, select, date, date-time, time, textarea, OAuth button)
  picks up the new value with no hard-coded border colour left.
- [x] Layout holds at 375, 768, and 1280 px with no horizontal scroll (FE-056 check repeated).
- [x] A unit test asserts the token ratios (default and hover on white and canvas), and axe passes
  on the patient form, appointment form and admin filters.
- [x] Tests cover every updated control: component tests assert `Input`, `SelectField`,
  `DateField`, `TimeField`, `DateTimeField`, textarea, outline `Button`, `OAuthProviderButton`
  and the session dialog controls use the token classes (hover and disabled included) with no
  `border-gray-*` left on controls.
- [x] Figma variable and components are updated and approved before implementation, and the
  implementation matches them.
- [x] FE-056's unticked responsive and AA criterion is ticked with a pointer to this task.

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

## Completion

- Tokens ([tokens.css](../../../apps/web/src/styles/tokens.css)): `--color-border-input`
  `#d1d5db` -> `#808896` (gray-450): 3.57:1 on white, 3.42:1 on the canvas `#f9fafb`. New
  `--color-border-input-hover` `#6b7280` (gray-500): 4.83:1 on white, with the `border-input-hover`
  Tailwind utility. `--color-border-strong` stays `#d1d5db` (cards, preview banner, status pill).
- Controls: `formControlBaseClassName` (Input, textarea, DateField, TimeField, DateTimeField) and
  `SelectField` use `hover:border-input-hover` and `disabled:border-border`; outline `Button`,
  `OAuthProviderButton` (unavailable state uses `border-border`), the concurrent-session dialog
  checkbox and buttons and the session-extension modal button moved from `border-gray-300` to the
  token. No `border-gray-300` or `hover:border-border-strong` is left on a control.
- Figma ([FE-061 page](https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=469-50)):
  variable updated, `color/border/input-hover` added, Select field and Input hover rebound, Date field
  `State=Hover` variant added, disabled variants rebound to `color/border/default`. Approved by the
  user on 2026-11-02 before implementation.
- Tests: `tokens.test.ts` asserts both tokens at 3:1 or better on white and canvas, hover darker
  than default, and error/focus colours distinct. New `components/ui/control-borders.test.tsx`
  renders Input, textarea, SelectField, DateField, TimeField, DateTimeField, outline Button and
  OAuthProviderButton (default, hover and disabled classes) and checks both session files for
  hard-coded gray borders. New `e2e/helpers/axe.ts` plus axe checks in `patient-form`,
  `appointment-form` and `administration` specs (WCAG 2.2 AA tags).
- Validation: `npm run lint:web` 0 errors (9 existing warnings); `npm run type-check:web` clean;
  `npm run test:web` 112 files, 760 tests passed; `npm run e2e:mocks -- patient-form
  appointment-form administration select-field date-format` 37 passed.
- Browser (mock preview): Add patient input, select and date field compute `rgb(107, 114, 128)`;
  the generated CSS has the hover and disabled rules; no horizontal scroll at 375, 768 and 1280 px.
  Pointer hover could not be driven in the preview pane, so hover colour is covered by the CSS rule
  check and the unit tests. Admin filters were checked by the axe spec at 768 px only.
- Version 1.0.0 -> 1.0.1 (PATCH: compatible visual fix).
- Not done: refreshed screenshots that show inputs (patients, admin) wait for the next milestone
  close, as the spec says.

## Roadmap

Standalone, after the 1.0.0 demo release (INFRA-021). Logged by the M21 close audit on 2026-10-31.
Shipped at 1.0.1.
