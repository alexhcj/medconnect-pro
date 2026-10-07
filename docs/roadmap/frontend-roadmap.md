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

## Slice 2 — Dashboard product surfaces (M10)

Not closed with M0–M7. Owned by **M10**. Live mode renders Nest overview cards ([FE-024](../tasks/frontend/FE-024-live-dashboard-overview.md), shipped). Mock mode still renders fixtures.

- analytics API ([BE-011](../tasks/backend/BE-011-dashboard-overview-api.md), shipped) and live
  cards ([FE-024](../tasks/frontend/FE-024-live-dashboard-overview.md), shipped);
- bounded seed ([DATA-002](../tasks/backend/DATA-002-bounded-synthetic-seed.md), shipped);
- notifications UI ([FE-025](../tasks/frontend/FE-025-notifications-ui.md), shipped; BE-008 HTTP
  exists; [BE-012](../tasks/backend/BE-012-notification-producers.md) producers shipped);
- role assignment UI is Slice 8 follow-on ([FE-026](../tasks/frontend/FE-026-role-assignment-ui.md), shipped),
  not this slice;
- alert banners remain unscheduled.

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
- administration UI against the Nest admin APIs (FE-016);
- role assignment UI ([FE-026](../tasks/frontend/FE-026-role-assignment-ui.md); M10, shipped).

## Slice 9 — Responsive polish

- mobile/PWA-oriented polish and responsive workflows.

## Slice 10 — Marketing website and visual language (M8)

- public `(marketing)` route group, layout, and pages ([FE-017](../tasks/frontend/FE-017-marketing-website-foundation.md), shipped):
  `/`, `/platform`, `/security`, `/about`, `/demo` (`/demo` → existing `/login`).
- Shared Figma design system and code tokens ([FE-018](../tasks/frontend/FE-018-design-system-and-visual-language.md), shipped).
- Homepage ([FE-019](../tasks/frontend/FE-019-marketing-homepage.md), shipped).
- Platform overview ([FE-020](../tasks/frontend/FE-020-platform-overview.md), shipped).
- `/platform/*` feature pages ([FE-021](../tasks/frontend/FE-021-platform-feature-pages.md), shipped).
- Security, About, and Demo ([FE-022](../tasks/frontend/FE-022-security-about-and-demo-pages.md), shipped).
- Polish and product visuals ([FE-023](../tasks/frontend/FE-023-marketing-polish-and-product-visuals.md), shipped).
- Deploy/preview is **M9**, **PAUSED / BLOCKED** — AWS account unavailable (close audit found no
  missing IDs; not closed; not cancelled; INFRA-004–INFRA-012 shipped; INFRA-014 pending, blocks
  INFRA-013; INFRA-013 paused). **M10** is shipped. Next product module is **M11** (BE-014, FE-027, FE-028 shipped;
  BE-015, FE-029, SEC-005 pending). Local product
  work does not wait on AWS.

## Slice 11 — Application security and session hardening (M11)

- live cookie session client ([FE-027](../tasks/frontend/FE-027-live-cookie-session-client.md),
  shipped; depends on [BE-014](../tasks/backend/BE-014-httponly-cookie-session-http.md));
- mock MFA challenge UI ([FE-028](../tasks/frontend/FE-028-mock-mfa-challenge-ui.md), shipped);
- security-events UI ([FE-029](../tasks/frontend/FE-029-security-events-ui.md); depends on
  [BE-015](../tasks/backend/BE-015-security-events-http.md)).
