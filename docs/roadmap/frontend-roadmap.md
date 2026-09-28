# Frontend Roadmap

Slices below are sequencing, not a calendar independent of
[release milestones](release-roadmap.md). Task IDs are the implementation contracts.

## Slice 1 — Identity and UI foundation (M0–M1)

- authentication (FE-010 mock IdP UI and dashboard gate);
- security-aware forms;
- query/data foundation;
- shared UI;
- loading/error patterns;
- dashboard shell (FE-001; shipped with M0).

## Slice 2 — Dashboard product surfaces (deferred)

Not closed with M0–M7. No task IDs yet. Live Nest `GET /dashboard/overview` does not exist; mock
mode still renders overview cards.

- analytics;
- notifications UI (BE-008 HTTP exists; frontend unwired);
- alert banners.

## Slice 3 — Patient management (M2)

- patient list/profile/create/edit (FE-002, FE-003, FE-004);
- patient UI against the Nest patient API (FE-011).

## Slice 4 — Appointments and calendar (M3)

- appointment creation and calendar (FE-005, FE-006);
- appointment UI against the Nest appointment API (FE-012).

## Slice 5 — Clinical record (M4)

- patient profile clinical lists against the Nest clinical API (FE-013).

## Slice 6 — Telehealth UI (M5)

- telehealth session shell (FE-007);
- telehealth UI against the Nest telehealth session API (FE-014).

## Slice 7 — Billing (M6)

- billing dashboard and payment/claims boundaries (FE-008);
- billing UI against the Nest billing API (FE-015).

## Slice 8 — Settings and security administration (M7)

- FE-009;
- administration UI against the Nest admin APIs (FE-016).

## Slice 9 — Responsive polish

- mobile/PWA-oriented polish and responsive workflows.

## Slice 10 — Marketing website foundation (M8)

- public marketing route group, layout, and placeholder pages ([FE-017](../tasks/frontend/FE-017-marketing-website-foundation.md)).
- Design, finished copy, feature pages, and deploy/preview are later work.
