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
  INFRA-013; INFRA-013 paused). **M10** is shipped. **M11** is shipped (BE-014, FE-027, FE-028, BE-015,
  FE-029, SEC-005). **M12 — Telehealth Media Maturity** is shipped
  ([BE-016](../tasks/backend/BE-016-telehealth-daily-media-token-http.md),
  [FE-030](../tasks/frontend/FE-030-daily-media-session-shell.md)). **M13 — Billing / Payments UX**
  is shipped ([FE-031](../tasks/frontend/FE-031-record-demo-payment.md),
  [FE-032](../tasks/frontend/FE-032-claims-envelope-list.md)). Hosted Stripe/ACH, claims submission /
  EDI 837, and invoice-create UI remain later. **M16 — Live Telehealth** is shipped at 0.81.0
  ([FE-035](../tasks/frontend/FE-035-clinical-live-visit-ux.md)). Chat, recording, and Socket.IO
  remain later. **M17 — Security and Compliance Maturity** is shipped and **closed** at 0.84.1
  ([FE-036](../tasks/frontend/FE-036-live-concurrent-session-chrome.md),
  [QA-005](../tasks/qa/QA-005-authorization-and-tenant-regression-expansion.md)). Local product work does
  not wait on AWS. **M18 — Interview Demo Readiness** is shipped and **closed** at 0.91.0
  ([FE-037](../tasks/frontend/FE-037-demo-account-panel.md) (shipped),
  [FE-038](../tasks/frontend/FE-038-telehealth-participant-entry.md) (shipped),
  [FE-039](../tasks/frontend/FE-039-public-demo-oauth-unavailable.md) (shipped); plus QA-006, DATA-005, BE-024 (shipped),
  INFRA-017 (shipped), QA-007 (shipped)). It does not reopen M17 or close M9. Render PR previews, real Google
  OAuth credentials, chat, recording, Socket.IO, hosted Stripe, and Redis stay deferred.

## Slice 11 — Application security and session hardening (M11)

- live cookie session client ([FE-027](../tasks/frontend/FE-027-live-cookie-session-client.md),
  shipped; depends on [BE-014](../tasks/backend/BE-014-httponly-cookie-session-http.md));
- mock MFA challenge UI ([FE-028](../tasks/frontend/FE-028-mock-mfa-challenge-ui.md), shipped);
- security-events UI ([FE-029](../tasks/frontend/FE-029-security-events-ui.md), shipped; depends on
  [BE-015](../tasks/backend/BE-015-security-events-http.md)).

## Slice 12 — Telehealth media maturity (M12)

- Daily media in the session shell ([FE-030](../tasks/frontend/FE-030-daily-media-session-shell.md),
  shipped; depends on [BE-016](../tasks/backend/BE-016-telehealth-daily-media-token-http.md), shipped).
  Mock mode keeps placeholders. Not chat, recording, or Socket.IO.

## Slice 13 — Billing payments and claims UX (M13)

- Record demo payment ([FE-031](../tasks/frontend/FE-031-record-demo-payment.md); shipped;
  depends on [FE-015](../tasks/frontend/FE-015-billing-ui-nest-api.md) and
  [BE-007](../tasks/backend/BE-007-billing-api.md)).
- Claims envelope list ([FE-032](../tasks/frontend/FE-032-claims-envelope-list.md); shipped;
  depends on FE-031). Not hosted Stripe, EDI 837 submission, or invoice-create UI.

## Slice 14 — OAuth / external identity (M14)

- OAuth login UX and session hydration ([FE-033](../tasks/frontend/FE-033-oauth-login-ux.md);
  shipped; depends on [BE-017](../tasks/backend/BE-017-oidc-client-and-session-issuance.md); design
  required). Not NextAuth or account-linking UI.

## Slice 15 — API protection and rate limiting (M15)

- Rate-limited auth UX ([FE-034](../tasks/frontend/FE-034-rate-limited-auth-ux.md); shipped;
  depends on [BE-019](../tasks/backend/BE-019-auth-and-sensitive-route-rate-limits.md); design not
  required, reuses the existing error alert). **Closed** at 0.80.0.

## Slice 16 — Live telehealth visit UX (M16)

- Clinical live-visit UX ([FE-035](../tasks/frontend/FE-035-clinical-live-visit-ux.md); shipped;
  depends on [BE-021](../tasks/backend/BE-021-telehealth-eligibility-and-lifecycle.md); design
  approved). Pre-join device check, leave versus end, ended/ineligible states. Not chat,
  recording, or Socket.IO. **Shipped** at 0.81.0.

## Slice 17 — Security and compliance maturity (M17)

- Live concurrent-session chrome ([FE-036](../tasks/frontend/FE-036-live-concurrent-session-chrome.md);
  shipped; depends on [BE-023](../tasks/backend/BE-023-concurrent-session-inventory-http.md);
  design not required, reuses the existing dialog). Not a session-policy editor, idle keep-alive,
  or production session manager. **Closed** at 0.84.1.

## Slice 18 — Interview demo readiness (M18)

Shipped and closed at 0.91.0. Does not reopen M17.

- Demo account panel ([FE-037](../tasks/frontend/FE-037-demo-account-panel.md); shipped; depends on
  [DATA-005](../tasks/backend/DATA-005-synthetic-patient-portal-account.md)).
- Participant entry from the telehealth lobby
  ([FE-038](../tasks/frontend/FE-038-telehealth-participant-entry.md); shipped; depends on
  [BE-024](../tasks/backend/BE-024-telehealth-open-session-lookup.md) (shipped)).
- Hide unconfigured OAuth on the public demo
  ([FE-039](../tasks/frontend/FE-039-public-demo-oauth-unavailable.md); shipped).
- Not chat, recording, Socket.IO, or a second host.

## Slice 19 — Polish and list normalization (M19)

Shipped and closed at 0.96.3; QA-009 (live paging specs) shipped. Does not reopen M17 or M18.

- Responsive header logo and RoleTag parity ([FE-040](../tasks/frontend/FE-040-responsive-header-logo-and-role-tag-parity.md); shipped).
- Billing design/code sync ([FE-041](../tasks/frontend/FE-041-billing-design-code-sync.md); shipped) and
  mock role scoping with status colours ([FE-042](../tasks/frontend/FE-042-billing-role-scoped-content-and-status-colors.md); shipped).
- Paged administration lists: audit events, security events, users
  ([FE-043](../tasks/frontend/FE-043-administration-paginated-lists.md); shipped; depends on BE-025, BE-026).
- Patient list paging ([FE-044](../tasks/frontend/FE-044-patient-list-bounded-height.md); shipped; the API already pages).
- Billing invoice and claims paging ([FE-045](../tasks/frontend/FE-045-billing-bounded-invoice-and-claims-lists.md); shipped; depends on BE-025).
- Event time column no-wrap and `patient-form.test.tsx` timeout fix
  ([FE-047](../tasks/frontend/FE-047-audit-event-time-column-no-wrap.md); shipped); admin action filter options
  parity ([FE-046](../tasks/frontend/FE-046-admin-event-filter-options-parity.md); shipped).
- Paging is demonstrable on the live stack since [DATA-006](../tasks/backend/DATA-006-live-seed-for-list-paging.md)
  (shipped at 0.96.1). [QA-008](../tasks/qa/QA-008-live-e2e-suite-green.md) made `e2e:live` green;
  [QA-009](../tasks/qa/QA-009-live-paging-specs.md) (shipped) adds live specs that reach page 2.
