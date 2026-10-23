---
id: FE-048
type: task
area: frontend
feature: deployment
status: pending
priority: low
estimate: 1
dependencies: [INFRA-019]
related_adrs: [ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../contracts/environment-configuration.md,
    ../../workflows/delivery-lanes.md,
  ]
design:
  required: true
  tool: figma
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd"
  frame: ""
  status: not_started
implementation:
  status: not_started
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: 0556f581-ed3f-4b5e-8aef-d534769abb7e
  identifier: MEDCONNECT-134
---

# FE-048 — Preview environment banner

## Objective

Label PR previews of the application and marketing site so a reviewer never mistakes mock data
for the interviewer demo.

## Context

ADR-019 builds web previews on mock data. The login page and dashboard look the same as the demo,
so a reviewer can draw wrong conclusions about live behaviour.

## Scope

- A thin, non-dismissable banner: "PR preview · mock data · not the live demo" (copy to be
  approved in the design).
- Shown only when a provider-neutral build variable is set (for example
  `NEXT_PUBLIC_DEPLOY_CONTEXT=pr-preview`, set by INFRA-019's preview build). Absent everywhere
  else, including the demo and local dev.
- Both `apps/web` (all routes, above the app shell and login) and `apps/marketing`.
- Add the variable to `environment-configuration.md` and the `.env.*.example` files.

## Out of Scope

- Showing the PR number or commit
- Any change to mock data or the demo account panel

## Requirements

- Design tokens only; text contrast at least 4.5:1; does not cover the header or trap focus; on
  320 px it wraps and does not cause horizontal scroll.
- Rendered as a landmark-free `role="status"` or plain text, not an alert.

## Acceptance criteria

- [ ] With the variable set, the banner shows on `/login`, a dashboard route, and marketing `/`
- [ ] Without it, no banner and no extra DOM on any route
- [ ] Vitest covers both states in each app
- [ ] Contrast and 320 px checks recorded in Completion

## Dependencies

- Blocked by: INFRA-019 (sets the variable), design approval in the shared Figma file
- Figma: https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd (frame to be added)

## Validation

Run each app with and without the variable. Check the INFRA-019 preview after merge.

## Risks / considerations

- Optional for the milestone. If cut, rely on the PR comment (INFRA-020) to say "mock data".

## Implementation notes

New visible UI on previews only: PATCH bump.

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
