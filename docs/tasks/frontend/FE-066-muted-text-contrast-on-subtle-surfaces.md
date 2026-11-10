---
id: FE-066
type: task
area: frontend
feature: design-system
status: implemented
priority: high
estimate: 1
dependencies: [FE-059, FE-061]
related_adrs: [ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../workflows/design-requirements.md,
    ../../workflows/frontend-testing.md,
    FE-059-demo-account-picker.md,
    FE-061-input-border-contrast-token.md,
    ../qa/QA-014-m22-verification-and-close-audit.md,
  ]
design:
  required: true
  tool: figma
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=557-2231"
  frame: "FE-066 Muted text contrast (page; review frame 557:2231): muted before and after, and secondary, on white, canvas, subtle, brand-subtle and danger-subtle, plus the demo account panel. Variables: new primitive gray/550 (#646b78); color/text/muted -> gray/550 (was gray/500). gray/500 and color/border/input-hover are unchanged."
  status: approved
implementation:
  status: complete
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: 1aa1bb4e-3609-4848-ad46-3664ec0571c8
  identifier: MEDCONNECT-166
---

# FE-066 — Muted text contrast on subtle surfaces

## Objective

Make muted helper text meet WCAG 2.1 AA text contrast (4.5:1) on the subtle surface, starting with
the `/login` demo account panel, so the live auth specs pass axe again and the live Playwright suite
can run.

## Context

QA-014 ran the live suite on the local stack (2026-11-10) and three `auth-wake-live` tests failed:
the axe test "API status indicator input modes and accessibility" at 320 and 1280 px, and the 320 px
test "the indicator does not cover the form or the Sign in button". Only the axe failure was
inspected: it reports `color-contrast` 4.39:1 (needed 4.5:1) for
`Preview: Practice admin. Tap a role to fill the sign-in form.` in
[demo-account-panel.tsx](../../../apps/web/src/components/auth/demo-account-panel.tsx), rendered as
`text-foreground-muted` (`--color-text-muted` #6b7280) on `bg-subtle` (`--color-bg-subtle` #f3f4f6).

The same colour is 4.83:1 on white, so it passes where it was designed (FE-061 recorded the muted
text against white). It fails on the subtle surface. The `auth` project is a dependency of `setup`
in `playwright.live.config.ts`, so these failures stop every live spec from running, not only the
auth ones. The 320 px layout failure has not been diagnosed; confirm whether it shares this cause
and, if not, log it as its own task. When the pairing first failed is also unknown: QA-008 recorded
the live suite as green, so a later panel or token change is the likely cause.

17 non-test files use `bg-subtle` and 20 use `text-foreground-muted`, so other pairings on the
subtle surface may fail the same way.

## Scope

- Audit every place `text-foreground-muted` (or another text colour below 4.5:1) sits on
  `bg-subtle` or another tinted surface. Record each pairing and its measured ratio in Completion.
- Fix the failing pairings. Decide in Figma first (ADR-011) between darkening `--color-text-muted`
  to at least 4.5:1 on `--color-bg-subtle`, or using `--color-text-secondary` (#4b5563) on subtle
  surfaces. Prefer the one token change if it leaves muted text on white and canvas readable and
  keeps the secondary/muted hierarchy.
- Update the Figma variable or the affected components, and `tokens.css` to match.
- Add a token test that asserts muted and secondary text are at least 4.5:1 on white, the canvas
  and the subtle surface.
- Get `npm run e2e:live` past the `auth` project: `auth-wake-live` axe tests pass at 320 and
  1280 px.

## Out of Scope

- Non-text contrast (borders: FE-061), focus rings, dark mode.
- Marketing site colours.
- Redesigning the demo account panel layout or copy.
- Any other live-suite failure that appears once this one is cleared (log it separately).

## Requirements

- One token change or one documented class swap per pairing; no per-component hex overrides.
- Text and non-text contrast targets stay: text 4.5:1, control boundaries 3:1.
- Muted still reads as quieter than secondary text.

## Acceptance Criteria

- [x] Frames or variable change approved on the task page before code
- [x] Every audited muted-on-tinted pairing measures at least 4.5:1, with the ratios recorded in Completion
- [x] A unit test asserts muted and secondary text at 4.5:1 or better on white, canvas and subtle
- [x] All three `auth-wake-live` tests above pass (or the layout one is logged separately with its cause), and `npm run e2e:live` runs the `setup` and `app` projects
- [x] Axe passes on `/login` with the demo panel in its preview and selected states, in the mock e2e
- [ ] Layout is unchanged at 375, 768 and 1280 px (no horizontal scroll)
- [x] CHANGELOG and version (ADR-007), PATCH

## Dependencies

- Builds on FE-059 (demo account picker) and FE-061 (contrast tokens).
- Unblocks the live-suite acceptance criterion of QA-014 ("Mock and live e2e suites green twice in a
  row on a fresh seed").

## Validation

`npm run lint:web`, `npm run type-check:web`, `npm run test:web`, `npm run e2e:mocks`, then the live
procedure in [frontend-testing.md](../../workflows/frontend-testing.md) (`npm run e2e:live`).

## Risks / Considerations

- Darkening a shared token shifts every muted label in the app. Check the notification inbox, the
  date and time pickers, the telehealth wrap-up and visit-ended pages, and the green room.
- Screenshots that show muted text may need a refresh at the next milestone close.

## Versioning

After 1.0.0: compatible visual fix → PATCH.

## Roadmap

Standalone. Found by the QA-014 live run on 2026-11-10. It does not belong to M22 (no telehealth
code is involved), but QA-014's live-suite criterion cannot be ticked until it ships.

## Completion

- Figma ([FE-066 page](https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=557-2231)):
  new primitive gray/550 `#646b78`; `color/text/muted` rebound to it. `gray/500` and
  `color/border/input-hover` are unchanged. Approved by the user on 2026-11-10 before code.
- Token ([tokens.css](../../../apps/web/src/styles/tokens.css)): `--color-text-muted` `#6b7280` -> `#646b78`.
- Audit (muted text on a tinted surface; ratio before -> after; all measured with the formula in `tokens.test.ts`):
  - `demo-account-panel.tsx` preview line and Email/Password labels, on subtle: 4.39 -> 4.87
  - `mfa-challenge-form.tsx` "Theater only" hint, on subtle: 4.39 -> 4.87
  - `notification-item.tsx` "Info" type chip, on subtle: 4.39 -> 4.87
  - `notification-item.tsx` timestamp on an unread row, on brand-subtle: 4.44 -> 4.93
  - `calendar.tsx` outside-month day on hover, on subtle: 4.39 -> 4.87
  - Already passing, still passing: `user-role-list.tsx` (canvas 4.63 -> 5.13), `api-status-indicator.tsx` (warning-subtle 4.66 -> 5.17)
  - Exempt (disabled controls, WCAG 1.4.3): `form-field-styles.ts`, `select-field.tsx`, `time-field.tsx`, `date-field.tsx`, `oauth-provider-button.tsx` unavailable state
  - Secondary text (unchanged `#4b5563`): 6.87 on subtle, 6.94 on brand-subtle, 7.56 on white
- Also fixed: the demo panel's credential rows were a `<dl>` containing buttons (axe `definition-list`,
  found by the new axe check). They are now `<ul>/<li>` with spans; same classes, no layout change.
- Tests: `tokens.test.ts` asserts muted and secondary at 4.5:1 or better on surface, canvas, subtle,
  brand-subtle, danger-subtle and warning-subtle, and muted lighter than secondary. `demo-account-picker.spec.ts`
  runs axe on `main` in the preview and selected states.
- Validation: `npm run lint:web` 0 errors (10 existing warnings); `npm run type-check:web` clean;
  `npm run test:web` 128 files, 934 tests passed; `npm run e2e:mocks -- demo-account-picker` 6 passed.
- Live (`npm run e2e:live`, fresh seed, local stack): `auth` project all passed, including the three tests named
  in Context (the 320 px layout test passed too; its original failure was never diagnosed, so its cause is
  unknown and may have been stale limiter or session state); `setup` 4 passed; `app` 15 of 16 passed; `teardown`
  passed. The failure is `telehealth-live.spec.ts` "provider, patient and nurse share one visit" (120 s timeout
  in `patient.context.close()`); it is outside this task and not diagnosed. Logged as [QA-015](../qa/QA-015-telehealth-live-three-participant-timeout.md).
- Browser (mock preview, `/login`): no horizontal scroll at 375 px (scrollWidth 375) and 768 px (768); the muted token computes `#646b78` and the preview line `rgb(100, 107, 120)`. 1280 px could not be set in the browser pane, so that width is unchecked and the layout criterion stays unticked.
- Version 1.6.1 -> 1.6.2 (PATCH: compatible visual and accessibility fix).
- Not done: refreshed screenshots wait for the next milestone close.
