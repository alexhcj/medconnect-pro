---
id: FE-025
type: task
area: frontend
feature: notifications
status: implemented
priority: high
estimate: 3
dependencies: [FE-001, BE-008, BE-012, DATA-002]
related_adrs: [ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../contracts/api-endpoints.md,
    ../../contracts/identity-and-access.md,
    ../../product/notifications.md,
    ../../workflows/design-requirements.md,
    ../backend/BE-008-notification-domain.md,
  ]
design:
  required: true
  tool: figma
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd"
  frame: "App / Notifications — 07 Inbox popover — populated (111:9)"
  status: approved
implementation:
  status: complete
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: cc7fe6ae-6a97-453b-bb31-c48c5130d5f6
  identifier: MEDCONNECT-77
---

# FE-025 — Notifications UI

## Objective

Wire the dashboard Bell to the shipped Nest notification HTTP so the authenticated user can
read an inbox, mark items read, and update channel preferences.

## Context

BE-008 already exposes `GET /notifications`, `PATCH /notifications/:id/read`,
`GET/PATCH /notifications/preferences`. The header Bell has no `onClick` (FE-016 forbade
wiring it). Zustand `ui-store` toasts are not the domain inbox.

Implements / extends `notifications.notification-center`.

**Do not implement application code until `design.status` is `approved` on this task.**

## Scope

- Design (same task, shared Figma file) then implementation
- Bell → inbox (popover, drawer, or page — design decision)
- Mark-read against Nest
- Preferences UI against Nest
- Live client + mock fixtures
- Self-scope only (identity contract: no practice-wide inbox)
- One `e2e:live` check that seed/producer rows render for the practice admin
- Update `docs/product/notifications.md` and the capability-matrix notifications row when
  shipped

## Out of Scope

- Client create-notification
- Push, SMS/email carriers, SNS/SQS
- Practice-admin viewing another user’s inbox
- Cookie session cutover (M11)
- Redis
- Unrelated marketing visual notes

## Requirements

### UI / design

- Reuse dashboard shell, buttons, and tokens from the shared Figma file
  https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd
- States: loading, empty, error, populated, mark-read success
- Responsive: usable at desktop and tablet; mobile must not trap focus
- Accessibility: Bell has an accessible name; unread count if shown is not color-only; keyboard
  to inbox and preferences
- Repeat the approved Figma URL in this Dependencies section when design is approved

### Technical

- Live calls Nest with Bearer; no client `practiceId` authorization
- Do not reopen BE-008
- Existing mock Playwright stays on mocks

## Acceptance Criteria

- [x] `design.status` is `approved` with `file_url` and `frame` before implementation
- [x] With mocks off, Bell opens an inbox that lists Nest notifications for the session user
- [x] Mark-read persists (item reflects read on refresh)
- [x] Preferences GET/PATCH round-trip against Nest
- [x] Other-user notifications never appear
- [x] One non-mock browser check: practice admin sees a non-empty inbox after DATA-002 seed
- [x] Product catalog + capability matrix no longer say “do not present a notification center”
  without the shipped limits (still not push/SMS carriers)

## Dependencies

- FE-001 (Bell in header), BE-008, DATA-002 (seed rows), BE-012 (live produce; seed can satisfy
  the e2e if producers slip)
- Design brief via [design-brief-prompt.md](../../processes/prompts/design-brief-prompt.md) on
  **this** task. Do not create a separate design task.

Figma (shared library; approved page **App / Notifications**, primary frame
`07 Inbox popover — populated` / `111:9`):
https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=111-9

## Validation

- Vitest for live client mapping
- `npm run e2e:live` notifications spec
- Accessibility of the chosen surface (dialog/popover/page)

## Risks / Considerations

- Unread badge must not leak PHI in the accessible name (count only).
- Do not confuse toast `ui-store` with the domain inbox.

## Implementation notes

Suggested order: after DATA-002 and BE-008; BE-012 preferred. Design is approved on this
task; implementation may proceed via the plan-mode prompt.

Writing this spec is not a version bump. Design-metadata approval is not a version bump.

## Completion

- Implementation: Dashboard Bell opens a self-scoped inbox (`GET /notifications`) with mark-read
  (`PATCH /notifications/:id/read`) and in-panel channel preferences
  (`GET/PATCH /notifications/preferences`). Desktop (`lg+`) uses Headless UI Popover; below `lg`
  uses a full-screen Dialog. Live Nest client via `apiFetch` + Bearer; mock fixtures for
  `NEXT_PUBLIC_USE_MOCKS=true`. No new route. No `practiceId` on the client. No ui-store.
- Tests: Vitest for RDO mapping, live client URLs/Bearer, mock mark-read/self-scope, format
  helpers, and NotificationCenter RTL. `apps/web/e2e/notifications-live.spec.ts` for practice
  admin non-empty inbox, absent provider titles, mark-read, and preferences round-trip. Mock
  Playwright stays on mocks.
- PR:
- Notes: Version 0.63.0 → 0.64.0 (MINOR, new in-app inbox). Not push/SMS/email carriers.
  `npm run e2e:live -- notifications-live` passed against seeded Nest on this machine.
