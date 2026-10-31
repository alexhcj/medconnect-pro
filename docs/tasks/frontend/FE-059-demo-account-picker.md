---
id: FE-059
type: task
area: frontend
feature: identity-access
status: implemented
priority: medium
estimate: 2
dependencies: [FE-037, FE-049]
related_adrs: [ADR-005-synthetic-demo-data.md, ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../product/identity-access.md,
    ../../marketing/capability-matrix.md,
    ../../workflows/design-requirements.md,
    ../../mocks/demo-users.json,
    FE-037-demo-account-panel.md,
    FE-028-mock-mfa-challenge-ui.md,
    FE-049-api-status-indicator.md,
  ]
design:
  required: true
  tool: figma
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=455-2"
  frame: "FE-059 Demo account picker (page; node-id=455-2): components Icon/Copy 455:3, Icon/CircleAlert 455:7, Icon/Clock 456:126, Demo role button 455:26 (Default/Selected/Focus/Disabled/Selected disabled), Copy icon button 455:41 (Default/Copied/Focus), Credential row 455:42, Demo account panel 455:251 (Default/Filled/Copied/Copy blocked/Disabled); desktop 1440: 01 Default 456:130, 02 Filled 456:212, 09 MFA after Fill code 457:540; mobile 375: 03 Default 456:296, 04 Filled 456:378, 05 Copied 456:462, 06 Copy blocked 456:545, 07 Queued 456:636, 10 MFA Fill code 457:634; mobile 320: 08 Filled 456:729; notes 457:729."
  status: approved
implementation:
  status: complete
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: 522f17b1-881c-456c-87c8-b348005e0302
  identifier: MEDCONNECT-151
---

# FE-059 — Demo account picker: one-tap fill and visible copy feedback

## Objective

On `/login`, a demo user picks a role with one tap and the sign-in form fills in. Copying stays
available and always shows a visible result, on every viewport.

## Context

The FE-037 panel ([demo-account-panel.tsx](../../../apps/web/src/components/auth/demo-account-panel.tsx))
sits above the form ([login-form.tsx](../../../apps/web/src/components/auth/login-form.tsx), `{showDemoAccounts() && <DemoAccountPanel />}`)
and stacks four accounts with eight text buttons, about 500 px tall on mobile. Signing in means copy,
scroll, paste, then the same again for the password.

Copy feedback is only announced in an `sr-only` live region; a failed copy clears it and shows
nothing. On a non-secure origin (for example a phone on a LAN IP over plain HTTP)
`navigator.clipboard` is undefined, the call throws, and the catch hides it. Mobile users see
nothing happen.

The copy buttons use `Button size="sm"` (36 px), not the 44 px project convention.

## Scope

- Role picker: four buttons in a 2×2 grid (Practice admin, Provider, MFA nurse, Patient) inside the
  existing sign-in card, above the form.
- A tap fills email and password through React Hook Form `setValue` (validate + dirty), clears any
  form error, and moves focus to the Sign in button. No auto-submit.
- A visible status line below the picker: "Filled as {role}. Press Sign in."
- A details row for the selected account (Practice admin as a preview, without filling, when none
  is selected): email and password in plain monospace text, each with an icon copy button.
- Copy feedback: the icon swaps Copy → Check with a visible "Copied" label for about 2 s. On
  failure a visible line reads "Copy blocked. Select the text instead." Both go to the live region.
- Credential values use `select-all` so one tap selects the whole value when copy is blocked.
- The MFA nurse code stays as text on the panel. A "Fill code" button on the MFA challenge
  ([mfa-challenge-form.tsx](../../../apps/web/src/components/auth/mfa-challenge-form.tsx)) shown
  only when the demo flag is on.
- `DemoAccountPanel` takes `onSelect(account)` and `disabled` from `LoginForm`; the panel stays
  presentational.

## Out of Scope

- Auto-submit after a role tap
- Collapsible or side panel; changes to the shared auth layout (`app/(auth)/layout.tsx`, FE-050)
- Masked passwords (they stay plain text; public fixtures)
- A sign-in guide or tutorial
- Fixture, mock IdP password, or flag-contract changes
- A toast system or any new dependency

## Requirements

- Flag gating unchanged: the panel and "Fill code" render only when
  `NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS` is exactly `true`.
- Values come only from `demoPanelAccounts()` and `DEMO_MFA_CODE`. Nothing new is stored. Filled
  or copied values are never logged.
- A role shows as selected (`aria-pressed="true"`) only while both form fields match that
  account. Editing either field so it no longer matches clears the selection.
- Role buttons are disabled while a sign-in is in flight or queued (FE-049 wake queue).
- A missing or rejecting `navigator.clipboard?.writeText` counts as a copy failure and shows the
  visible failure line.
- Target sizes: role buttons at least 44 px tall (`min-h-11`). Copy icon buttons 36 px with at
  least 8 px spacing (meets WCAG 2.2 SC 2.5.8 AA). See Decisions.
- Every control has a visible focus ring and an accessible name, for example
  "Fill sign-in as Provider", "Copy email for Provider", "Copy password for Provider".
- Keyboard: every control works with Tab, Enter and Space. Focus moves only on fill (to Sign in),
  never on copy.
- No horizontal scroll at 320 px; long emails wrap (`break-all`).
- Design tokens only; text and selected-state contrast meet WCAG AA.

## Acceptance Criteria

- [x] With the flag unset, `/login` shows no accounts or passwords, and the MFA challenge shows no
      "Fill code" button
- [x] With the flag set, four role buttons show; tapping one fills both fields, shows the status
      line, and moves focus to Sign in
- [x] Pressing Sign in after a fill reaches the dashboard (or the MFA challenge for the MFA nurse)
      without typing
- [x] Editing a filled field so it no longer matches clears the selected role
- [x] Copy email and copy password show a visible "Copied" state and announce it
- [x] A rejected or missing clipboard shows the visible failure line; the value stays readable and
      selectable
- [x] Role buttons are disabled while a sign-in request is in flight or queued
- [x] "Fill code" fills `135790` on the MFA challenge when the flag is on
- [x] Role buttons are at least 44 px tall; copy icons at least 36 px with 8 px spacing; all
      controls are named and keyboard operable
- [x] On a 375 px viewport the panel is at most about 270 px tall (approved frames: ~262 px, ~286 px
      with the copy-blocked line); no horizontal scroll at 320 px
- [x] Code matches the approved Figma frames (ADR-011)

## Dependencies

- Blocked by: FE-037 (panel), FE-049 (API wake queue on `/login`)
- Design: delta on the FE-033 login frame
  (https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=182-2184). Frames: desktop 1440 and
  mobile 375; states default, filled, copied, copy blocked, disabled (queued); MFA challenge with
  "Fill code". `design.status: approved` before code.
- Approved Figma design: https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=455-2
- Related: FE-028, FE-033, capability `identity-access.demo-account-panel`

## Validation

- Vitest: update `demo-account-panel.test.tsx` and `login-form.test.tsx`, add `mfa-challenge-form`
  coverage. Cover flag off/on, fill and focus, selection cleared on edit, copy success, rejection
  and missing clipboard, disabled while queued.
- `npm run lint:web`, `npm run type-check:web`, `npm run test:web`; `npm run e2e:mocks` for
  `e2e/auth.spec.ts`.
- Browser check of `/login` and the MFA challenge at 1440, 375 and 320 px with the flag on, then
  with it unset.
- Recapture marketing screenshots (`npm run screenshots:marketing`): the demo-page shot shows this
  panel. Keep the "Demo accounts" heading (`e2e/capture/marketing-screenshots.spec.ts`).

## Risks / considerations

- 36 px copy icons are a deliberate exception to the 44 px convention (see Decisions). FE-041 calls
  `min-h-11` "the FE-037 convention" while FE-037 code uses 36 px buttons; this task records the
  rule explicitly instead of editing shipped specs.
- Browsers may offer to save the password after a filled sign-in. Harmless: public fixtures.
- Fill does not bypass anything: the normal form, server auth, rate limiting and audit still run.
- Do not log filled or copied values.

## Decisions

- Fill only, no auto-submit (user, 2026-10-30): the interviewer sees the real form path.
- Passwords shown as plain text (user, 2026-10-30): public fixtures; the flag keeps them out of
  production builds.
- Primary role buttons 44 px; secondary copy icons 36 px with 8 px spacing (WCAG 2.2 2.5.8 AA).
- Design approved (user, 2026-10-31), brief recommendations as drawn: selected role = brand-subtle
  fill, brand border and check icon; compact credential rows; inline "Copied"; Practice admin
  previewed when nothing is selected; MFA nurse code in the panel header row; "Fill code" Outline
  beside the field on desktop, full width below it on mobile; focus moves to Verify after "Fill code".
- Panel height target raised from about 200 px to about 270 px at 375 (user, 2026-10-31): heading,
  two 44 px role rows and two 36 px copy rows with 8 px spacing already exceed 200 px.

## Versioning

MINOR while `0.x` (new sign-in capability): expected 0.102.0 → 0.103.0, with a `CHANGELOG.md`
entry. At ship, change "copy actions" to "fill and copy actions" in
`docs/product/identity-access.md` (`identity-access.demo-account-panel`) and
`docs/marketing/capability-matrix.md`, and update the progress trackers.

## Completion

- Implementation: `components/auth/demo-account-panel.tsx` is presentational (`onSelect`,
  `disabled`, `selectedEmail`): header with the MFA nurse code (wraps on narrow screens), 2×2 outline
  role buttons (`min-h-11`, `aria-pressed`, "Fill sign-in as {role}", check icon and brand-subtle
  fill when pressed), status line (`aria-live`), one account's credentials in a `dl` (Practice admin
  preview until a role is picked; `font-mono break-all select-all`), 36 px ghost icon copy buttons
  with 8 px spacing. Copy feedback is per account: Check + "Copied" for 2 s, or "Copy blocked. Select
  the text instead." with the value highlighted when `navigator.clipboard?.writeText` is missing or
  rejects; both go to the `sr-only` live region. `login-form.tsx` fills through `setValue` (validate
  + dirty), clears the form error and focuses Sign in; selection is derived from `useWatch` on both
  fields; role buttons are disabled while `login.isPending` or queued. `mfa-challenge-form.tsx`:
  flag-gated Outline "Fill code" (beside the field from `sm`, full width and 44 px below it on
  mobile) fills `DEMO_MFA_CODE` and focuses Verify; card padding `px-4 py-6 sm:p-8` to match the
  sign-in card and the Figma mobile frame (user, 2026-10-31). Version 0.102.0 -> 0.103.0 (MINOR: new
  sign-in capability; no API, contract, fixture or flag change).
- Tests: Vitest 742 passed (`demo-account-panel.test.tsx` rewritten: preview, select, pressed state,
  disabled, Copied with fake timers, keyboard copy, rejected and missing clipboard;
  `login-form.test.tsx`: flag-on picker, fill + focus, fill then Enter to dashboard, MFA nurse to the
  challenge, edit clears selection, tap clears the error, disabled in flight;
  `login-form-wake.test.tsx`: disabled while queued, enabled after Cancel;
  `mfa-challenge-form.test.tsx`: flag matrix, Fill code + focus Verify, disabled when expired).
  Playwright mocks 65 passed (`e2e/auth.spec.ts` unchanged). `npm run lint:web` 0 errors (9 existing
  warnings); `npm run type-check:web` clean. `npm run screenshots:marketing` recaptured `login.png`.
- Browser (mock dev server, flag on): 375 px panel 262 px, role buttons 44 px, copy buttons 36 × 36
  with 8 px between; tap Provider fills both fields, presses the role and focuses Sign in; tap MFA
  nurse then Enter reaches `/dashboard`; the browser pane denies clipboard writes, which showed the
  visible blocked line; 320 px no horizontal scroll (panel 294 px, header and "Practice admin" wrap);
  1440 panel 382 × 262 as in Figma; no console errors.
- PR:
- Notes: Not browser-checked: the visible "Copied" state (the pane denies clipboard; covered in
  Vitest), the MFA "Fill code" step (mock mode never issues an MFA challenge; covered in Vitest), and
  `/login` with the flag unset (covered in Vitest).
- User verification (2026-10-31): implementation matches the approved Figma frames.
