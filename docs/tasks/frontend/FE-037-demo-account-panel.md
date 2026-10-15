---
id: FE-037
type: task
area: frontend
feature: identity-access
status: pending
priority: high
estimate: 2
dependencies: [DATA-005, FE-010, FE-028]
related_adrs: [ADR-005-synthetic-demo-data.md, ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../product/identity-access.md,
    ../../marketing/capability-matrix.md,
    ../../workflows/design-requirements.md,
    ../../mocks/demo-users.json,
    FE-010-mock-authentication-ui.md,
    FE-028-mock-mfa-challenge-ui.md,
    FE-033-oauth-login-ux.md,
    ../backend/DATA-005-synthetic-patient-portal-account.md,
  ]
design:
  required: true
  tool: figma
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=182-2184"
  frame: "App / Login — FE-033 frames (182:2184); M18 demo-account delta approved with the milestone plan"
  status: approved
implementation:
  status: not_started
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: 5a7b20ae-9460-40ba-b708-17aa79082a76
  identifier: MEDCONNECT-112
---

# FE-037 — Demo account panel

## Objective

Show the four synthetic demo accounts on sign-in, with role labels, copy actions, and the MFA
code, only when the demo panel is explicitly enabled.

## Context

[login-form.tsx](../../../apps/web/src/components/auth/login-form.tsx) always prints practice
admin and MFA nurse as plain text. It omits the provider and has no copy feedback or MFA code.
The patient account does not exist until DATA-005.

Design delta is approved on the existing FE-033 login frame: same card, no new Figma file.

## Scope

- `NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=true` shows the panel. Unset or any other value hides it.
- Set the flag in the Render web service definition and in local web env examples. Do not set it
  for a future production build.
- Four rows after DATA-005: practice admin, provider, MFA nurse, patient. Each has a role label,
  copy email, and copy password.
- Accessible feedback: `aria-live` announces “Copied” (or “Email copied” / “Password copied”).
- One line: the MFA nurse code is `135790`.
- Keyboard access for every copy control.

## Out of Scope

- Account creation, password reset that works, or an account-admin page
- Changing mock IdP passwords
- Hiding OAuth (FE-039)
- Screenshot replacement (INFRA-017)

## Requirements

- Credentials come from the existing demo fixture list, not a new secret store.
- The panel is not a general user directory.
- Copy failure still leaves the address and password readable as text.

## Acceptance criteria

- [ ] With the flag unset, sign-in does not show emails or passwords
- [ ] With the flag set, all four accounts from `demo-users.json` are visible with role labels
- [ ] Copy email and copy password each move focus-safe text to the clipboard and announce success
- [ ] The MFA code `135790` is visible as demo instructions, not as a second password field
- [ ] Controls work by keyboard and expose accessible names
- [ ] Narrow viewport keeps the panel inside the sign-in card without horizontal scroll
- [ ] Render web env and local examples document the flag; production examples leave it unset

## Dependencies

- Blocked by: DATA-005, FE-010, FE-028
- Design: [FE-033 login frame](https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=182-2184), status approved
- Related: FE-039, identity-access.mock-idp-sessions

## Validation

Component tests for flag on/off, four rows, and the live announcement. Browser check of `/login`
at desktop and a narrow width when the flag is on. Update the release-roadmap crosswalk for FE-037.

## Risks / considerations

- The public demo will show these passwords on purpose. They are already public fixtures. The
  flag is what keeps a later production build from showing them.
- Do not log copied values.

## Implementation notes

Version bump when this ships is MINOR while `0.x` (new sign-in surface).

## Completion

- Implementation:
- Tests:
- PR:
- Notes: Not started.
