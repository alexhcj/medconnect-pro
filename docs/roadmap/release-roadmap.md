# Release Roadmap

This is the scheduling source for demo milestones. Frontend and backend roadmaps are parallel
calendars; they do not replace this join table. Task files in `docs/tasks/` remain the
implementation contracts.

**Current position:** M0–M8 are shipped ([FE-017](../tasks/frontend/FE-017-marketing-website-foundation.md)
through [FE-023](../tasks/frontend/FE-023-marketing-polish-and-product-visuals.md)). Baseline:
[post-mvp-baseline.md](post-mvp-baseline.md). **M9 — Deployment / preview infrastructure** is
**PAUSED / BLOCKED** — AWS account setup unavailable. It is **not closed** and **not cancelled**.
[INFRA-004](../tasks/infrastructure/INFRA-004-environment-separation-and-configuration-contract.md)–[INFRA-012](../tasks/infrastructure/INFRA-012-github-v1.0.0-release-notes-template.md)
(shipped), [INFRA-014](../tasks/infrastructure/INFRA-014-aws-account-setup-and-hosted-first-apply.md)
(pending; blocks INFRA-013), [INFRA-013](../tasks/infrastructure/INFRA-013-v1.0.0-production-release-readiness.md)
(pending, paused). **M10 — Product Analytics, Notifications & Role Administration** is shipped.
**M11 — Application Security & Session Hardening** is shipped
([BE-014](../tasks/backend/BE-014-httponly-cookie-session-http.md),
[FE-027](../tasks/frontend/FE-027-live-cookie-session-client.md),
[FE-028](../tasks/frontend/FE-028-mock-mfa-challenge-ui.md),
[BE-015](../tasks/backend/BE-015-security-events-http.md),
[FE-029](../tasks/frontend/FE-029-security-events-ui.md),
[SEC-005](../tasks/security/SEC-005-production-gap-documentation.md)).
**M12 — Telehealth Media Maturity** is shipped
([BE-016](../tasks/backend/BE-016-telehealth-daily-media-token-http.md),
[FE-030](../tasks/frontend/FE-030-daily-media-session-shell.md)).
**M13 — Billing / Payments UX** is shipped
([FE-031](../tasks/frontend/FE-031-record-demo-payment.md),
[FE-032](../tasks/frontend/FE-032-claims-envelope-list.md)). Hosted Stripe/ACH, claims
submission / EDI 837, and invoice-create UI remain later. **M14 — OAuth / External Identity** is
shipped (SEC-006, DATA-003, BE-017, FE-033). **M15 — API Protection and Rate Limiting** is
shipped and **closed** at 0.80.0 (SEC-007, DATA-004, BE-018, BE-019, BE-020, FE-034). **M16 — Live
Telehealth** is shipped at 0.81.0 ([SEC-008](../tasks/security/SEC-008-live-telehealth-workflow-contract.md),
[BE-021](../tasks/backend/BE-021-telehealth-eligibility-and-lifecycle.md),
[FE-035](../tasks/frontend/FE-035-clinical-live-visit-ux.md)). Chat, recording, and Socket.IO
remain later. **M17 — Security and Compliance Maturity** is shipped and **closed** at 0.84.1
([SEC-009](../tasks/security/SEC-009-m17-security-findings-and-contract-reconciliation.md),
[BE-022](../tasks/backend/BE-022-clinical-record-read-audit.md),
[BE-023](../tasks/backend/BE-023-concurrent-session-inventory-http.md),
[FE-036](../tasks/frontend/FE-036-live-concurrent-session-chrome.md), and
[QA-005](../tasks/qa/QA-005-authorization-and-tenant-regression-expansion.md)). **M18 — Interview
Demo Readiness** is shipped and **closed** at 0.91.0
([QA-006](../tasks/qa/QA-006-live-demo-smoke.md),
[DATA-005](../tasks/backend/DATA-005-synthetic-patient-portal-account.md) (shipped),
[BE-024](../tasks/backend/BE-024-telehealth-open-session-lookup.md) (shipped),
[FE-037](../tasks/frontend/FE-037-demo-account-panel.md) (shipped),
[FE-038](../tasks/frontend/FE-038-telehealth-participant-entry.md) (shipped),
[FE-039](../tasks/frontend/FE-039-public-demo-oauth-unavailable.md) (shipped),
[INFRA-017](../tasks/infrastructure/INFRA-017-demo-presentation-pack.md) (shipped),
[QA-007](../tasks/qa/QA-007-m18-close-audit.md) (shipped)). It does not reopen M17 and does not close M9.
**M19 — Polish and list normalization** is shipped and **closed** at 0.96.3 (thirteen tasks shipped; declared closed by the user on 2026-10-22): FE-040 (0.91.1),
FE-041 (0.91.2), FE-042 (0.91.3), BE-025 (0.92.0), BE-026 (0.93.0), FE-043 (0.94.0), FE-044 (0.95.0), FE-045 (0.96.0), DATA-006 (0.96.1), FE-046 (0.96.2), FE-047 (0.96.3), QA-008 and QA-009 (test and docs only) are shipped.
The close audit added four tasks, all shipped: [FE-047](../tasks/frontend/FE-047-audit-event-time-column-no-wrap.md)
(audit and security event time column no-wrap, plus `patient-form.test.tsx` timeout fix; shipped at 0.96.3),
[FE-046](../tasks/frontend/FE-046-admin-event-filter-options-parity.md) (admin action filter options; shipped at 0.96.2) and
[DATA-006](../tasks/backend/DATA-006-live-seed-for-list-paging.md) (live seed volume so paging shows on the live stack; shipped at 0.96.1) and
[QA-008](../tasks/qa/QA-008-live-e2e-suite-green.md) (`e2e:live` passes twice in a row on a freshly seeded stack; shipped, no version bump).
The M19 close audit added one more, [QA-009](../tasks/qa/QA-009-live-paging-specs.md) (live specs that reach
page 2 of each list; shipped, test only, no version bump). Latest release: 0.96.3.
**M20 — PR previews and delivery lanes** is in progress: INFRA-018 is shipped (ADR-019 accepted,
workflow docs point at the lanes doc; docs only, no version bump); INFRA-019 is shipped at
0.97.0 (manual Render previews for marketing and web); QA-011 is shipped (API type-check fix; test only, no version bump); SEC-010 is shipped at 0.97.1 (production audit findings cleared); FE-048 is shipped at 0.97.2 (PR preview banner on web and marketing); INFRA-020 is shipped at 0.97.3 (`checksPass` deploys, Render-aware PR comment, PR template; branch protection on `main` applied 2026-10-23 and recorded in the task); SEC-011 is shipped at 0.97.4 (new production audit advisories cleared); standalone FE-049 is shipped at 0.98.0 and FE-050 at 0.99.0 (latest release 0.99.1);
QA-010 is pending
([INFRA-018](../tasks/infrastructure/INFRA-018-render-pr-preview-decision-and-delivery-lanes.md),
[INFRA-019](../tasks/infrastructure/INFRA-019-render-frontend-service-previews.md),
[QA-011](../tasks/qa/QA-011-fix-api-type-check-for-green-ci.md),
[SEC-010](../tasks/security/SEC-010-resolve-critical-production-audit-findings.md),
[SEC-011](../tasks/security/SEC-011-resolve-production-audit-regressions.md),
[INFRA-020](../tasks/infrastructure/INFRA-020-checks-gated-deploys-and-pr-workflow.md),
[FE-048](../tasks/frontend/FE-048-preview-environment-banner.md) (optional),
[QA-010](../tasks/qa/QA-010-preview-lanes-pilot.md)); see
[ADR-019](../decisions/ADR-019-render-pr-previews.md) and
[delivery-lanes.md](../workflows/delivery-lanes.md).
[FE-049](../tasks/frontend/FE-049-api-status-indicator.md) (API status indicator on `/login`) is a
standalone task outside any milestone, shipped at 0.98.0 (Figma frames approved; web indicator, wake ping, queued sign-in; real Render sleep test still to record).
[FE-050](../tasks/frontend/FE-050-auth-pages-marketing-logo-link.md) (logo link back to the marketing
site on the auth pages) is a standalone task outside any milestone, shipped at 0.99.0 (header and back link via `NEXT_PUBLIC_MARKETING_URL`; Figma frames approved). The untasked marketing copy sync (`/about` state, security-events wording, matrix "Last synced release" line, `docs:marketing-sync` drift check in CI) shipped at 0.99.1.
**M21 — Marketing design refresh** is proposed: [QA-012](../tasks/qa/QA-012-marketing-screenshot-capture.md),
[FE-051](../tasks/frontend/FE-051-marketing-design-system-extension.md),
[FE-052](../tasks/frontend/FE-052-homepage-refresh.md),
[FE-053](../tasks/frontend/FE-053-status-and-link-affordance.md),
[FE-054](../tasks/frontend/FE-054-about-roadmap-board.md),
[FE-055](../tasks/frontend/FE-055-architecture-page.md), and
[INFRA-021](../tasks/infrastructure/INFRA-021-v1.0.0-demo-release.md) (all pending).
**1.0.0** is redefined (user decision, 2026-10-28) as the feature-complete synthetic demo on Render,
released by INFRA-021 after M20 and M21 close. AWS production (INFRA-014, INFRA-013) becomes a later
1.x release and no longer gates 1.0.0.
Real Google OAuth credentials, chat, recording, Socket.IO, hosted Stripe, and
Redis stay deferred. Local product work does not wait on AWS. Resume M9 when the AWS account can
be configured. Preview/production hosting remains M9, not M8, M10, M11, or M18.
[INFRA-015](../tasks/infrastructure/INFRA-015-render-public-demo.md) is an interim Render public
demo (free web services and Free Postgres). It does not close M9, INFRA-014, or INFRA-013, and it
does not replace the AWS topology.

## Demo milestones

### M0 — Foundation

Repository, documentation, frontend shell, mock infrastructure and development workflow.

### M1 — Identity

Authentication UI, roles, permissions model and protected dashboard.

### M2 — Patient

Patient list/profile/create/edit with synthetic data.

### M3 — Scheduling

Appointments and calendar.

### M4 — Clinical

Basic clinical record and audit model.

### M5 — Telehealth

Appointment-linked telehealth session shell.

### M6 — Billing

Billing dashboard and payment/claims boundaries.

### M7 — Administration

Practice/user administration and audit viewer.

### M8 — Marketing website and visual language

Public `(marketing)` route group, layout, and pages at `/`, `/platform`, `/platform/*`,
`/security`, `/about`, and `/demo` (FE-017–FE-023, shipped). Shared Figma design system and code
tokens (FE-018). Homepage, platform overview, feature pages, Security / About / Demo, and product
visuals. Not hosted deployment. **Closed** at 0.51.1.

### M9 — Deployment / preview infrastructure

GitHub Actions, Amplify Hosting for Next.js, ECS/Fargate for the NestJS API, isolated
local / preview / production demo databases, and the `v1.0.0` production-release gate.
Separate from M8. **PAUSED / BLOCKED** — AWS account setup unavailable. Close audit found no
missing task IDs; M9 is **not closed** and **not cancelled**. Tasks: INFRA-004–INFRA-012
(shipped), INFRA-014 (pending; blocks INFRA-013), INFRA-013 (pending, paused). Do not treat
Terraform/workflows as a hosted demo. Do not pull AWS work into M10. Since 2026-10-28 INFRA-013
is the post-1.0 AWS production release (1.x); the 1.0.0 demo release is INFRA-021 in M21.

### M10 — Product Analytics, Notifications & Role Administration

Live Nest dashboard overview, notification inbox/preferences UI on BE-008, and practice role
assignment. Local product work while M9 is paused. Tasks: DATA-002, BE-011, FE-024, BE-012,
FE-025, BE-013, FE-026 (shipped).

### M11 — Application Security & Session Hardening (shipped)

Local session/cookie, mock MFA UI, security-events HTTP, and production-gap documentation.
Tasks: BE-014, FE-027, FE-028, BE-015, FE-029, SEC-005 (shipped). Not an AWS/infrastructure
milestone.

### M12 — Telehealth Media Maturity (shipped)

Daily/WebRTC on the shipped session shell. Tasks:
[BE-016](../tasks/backend/BE-016-telehealth-daily-media-token-http.md),
[FE-030](../tasks/frontend/FE-030-daily-media-session-shell.md) (shipped). Not chat, recording,
Socket.IO, or AWS.

### M13 — Billing / Payments UX (shipped)

Enable the existing Nest payment adapter and claims envelope in the UI. Tasks:
[FE-031](../tasks/frontend/FE-031-record-demo-payment.md) (record demo payment),
[FE-032](../tasks/frontend/FE-032-claims-envelope-list.md) (claims envelopes). Not hosted
Stripe, EDI 837 submission, invoice-create UI, or AWS. **Closed** at 0.75.0.

### M14 — OAuth / External Identity (shipped)

Demo OAuth 2.0 / OIDC Authorization Code + PKCE with Nest as the client, issuing the existing
HttpOnly session. Google first; Fake adapter for local/CI. Mock password login and RBAC preserved.
Tasks: [SEC-006](../tasks/security/SEC-006-oidc-bff-contract-and-adr.md),
[DATA-003](../tasks/backend/DATA-003-external-identity-persistence.md),
[BE-017](../tasks/backend/BE-017-oidc-client-and-session-issuance.md),
[FE-033](../tasks/frontend/FE-033-oauth-login-ux.md) (shipped). Not NextAuth, JIT signup, rate
limiting, production MFA, Redis, or AWS. Rate limiting is deferred to M15. **Closed** at 0.77.0.

### M15 — API Protection and Rate Limiting (shipped)

Opt-in per-route rate limiting on a PostgreSQL bucket store, trusted-proxy client IP
(`TRUST_PROXY`), 429 `RATE_LIMITED` + `Retry-After`, `auth.rate_limited` security events, API
security headers with `no-store` on auth responses, and 429 UX on login/MFA/OAuth. Tasks:
[SEC-007](../tasks/security/SEC-007-rate-limit-and-api-protection-contract.md) (ADR-015, shipped),
[DATA-004](../tasks/backend/DATA-004-rate-limit-bucket-persistence.md) (shipped),
[BE-018](../tasks/backend/BE-018-rate-limit-platform-and-client-ip.md) (shipped),
[BE-019](../tasks/backend/BE-019-auth-and-sensitive-route-rate-limits.md) (shipped),
[BE-020](../tasks/backend/BE-020-api-security-headers.md) (shipped),
[FE-034](../tasks/frontend/FE-034-rate-limited-auth-ux.md) (shipped). Not Redis, WAF/CloudFront rules,
permanent lockout, production MFA, a new IdP, or AWS. **Closed** at 0.80.0.

### M16 — Live Telehealth (shipped)

Coherent appointment-linked live visit on the shipped M5 session shell and M12 Daily media:
eligibility on join/mint, join-before-mint, leave versus end, ineligible/ended UX, and pre-join
device guidance. Tasks: [SEC-008](../tasks/security/SEC-008-live-telehealth-workflow-contract.md),
[BE-021](../tasks/backend/BE-021-telehealth-eligibility-and-lifecycle.md),
[FE-035](../tasks/frontend/FE-035-clinical-live-visit-ux.md). Not chat, recording, transcription,
Socket.IO, Nest `/leave`, a session list API, or AWS. **Shipped** at 0.81.0.

### M17 — Security and Compliance Maturity (shipped and closed)

Application-level security and privacy hardening on shipped auth, audit, and session surfaces:
contract reconciliation (ADR-016), clinical read audit, live concurrent-session inventory, and
authorization-matrix expansion. [SEC-009](../tasks/security/SEC-009-m17-security-findings-and-contract-reconciliation.md),
[BE-022](../tasks/backend/BE-022-clinical-record-read-audit.md),
[BE-023](../tasks/backend/BE-023-concurrent-session-inventory-http.md),
[FE-036](../tasks/frontend/FE-036-live-concurrent-session-chrome.md), and
[QA-005](../tasks/qa/QA-005-authorization-and-tenant-regression-expansion.md)
are shipped. **Shipped** and **closed** at 0.84.1. Not AWS, HIPAA
certification, production MFA, Redis/WAF, OAuth unlink, patient DELETE, chat/recording, or hosted
Stripe.

### M18 — Interview Demo Readiness (shipped and closed)

Make the existing Render demo reliable for an interviewer. Not a redesign, not a second host, and
not a reopen of M9 or M17. Tasks:
[QA-006](../tasks/qa/QA-006-live-demo-smoke.md) (live smoke, shipped),
[DATA-005](../tasks/backend/DATA-005-synthetic-patient-portal-account.md) (one synthetic patient
login linked to Avery Quinn, shipped),
[BE-024](../tasks/backend/BE-024-telehealth-open-session-lookup.md) (open-session lookup, not a
session list, shipped),
[FE-037](../tasks/frontend/FE-037-demo-account-panel.md) (demo-only account panel, shipped),
[FE-038](../tasks/frontend/FE-038-telehealth-participant-entry.md) (patient and nurse enter an
open visit, shipped),
[FE-039](../tasks/frontend/FE-039-public-demo-oauth-unavailable.md) (hide unconfigured OAuth, shipped),
[INFRA-017](../tasks/infrastructure/INFRA-017-demo-presentation-pack.md) (README, screenshots,
GitHub About, shipped), and
[QA-007](../tasks/qa/QA-007-m18-close-audit.md) (two-browser close, shipped). **Shipped** and
**closed** at 0.91.0 after the 2026-10-19 provider/patient session check. Deferred: Render and Amplify
PR previews, real Google credentials, chat, recording, Socket.IO, hosted Stripe / EDI, Redis, and
a persistent document disk. `DAILY_API_KEY` stays an operator secret, not a committed value.

### M19 — Polish and list normalization (shipped, closed at 0.96.3)

Design parity and bounded lists on the shipped demo. No new capability claims, no AWS, no
reopen of M9, M17 or M18. Tasks:
[FE-040](../tasks/frontend/FE-040-responsive-header-logo-and-role-tag-parity.md) (header logo, RoleTag; shipped at 0.91.1),
[FE-041](../tasks/frontend/FE-041-billing-design-code-sync.md) (billing Figma/code sync; shipped at 0.91.2),
[FE-042](../tasks/frontend/FE-042-billing-role-scoped-content-and-status-colors.md) (mock role scoping, status colours; shipped at 0.91.3),
[BE-025](../tasks/backend/BE-025-billing-and-user-list-pagination-contract.md) (invoice, claims, user list paging; shipped at 0.92.0),
[BE-026](../tasks/backend/BE-026-audit-and-security-event-list-total.md) (audit, security-event list `total`; shipped at 0.93.0),
[FE-043](../tasks/frontend/FE-043-administration-paginated-lists.md) (audit, security events, users; shipped at 0.94.0),
[FE-044](../tasks/frontend/FE-044-patient-list-bounded-height.md) (patients list; shipped at 0.95.0), and
[FE-045](../tasks/frontend/FE-045-billing-bounded-invoice-and-claims-lists.md) (invoices, claims; shipped at 0.96.0).
Close-audit tasks:
[FE-047](../tasks/frontend/FE-047-audit-event-time-column-no-wrap.md) (audit and security event timestamps on one line; `patient-form.test.tsx` timeout fix; shipped at 0.96.3),
[FE-046](../tasks/frontend/FE-046-admin-event-filter-options-parity.md) (action filter options match the API; shipped at 0.96.2),
[DATA-006](../tasks/backend/DATA-006-live-seed-for-list-paging.md) (live seed has a second page of audit events, security events, users, invoices and claims; shipped at 0.96.1), and
[QA-008](../tasks/qa/QA-008-live-e2e-suite-green.md) (live e2e suite passes on a freshly seeded stack, shared sign-in sessions, no limit changes; shipped, test and docs only), and
[QA-009](../tasks/qa/QA-009-live-paging-specs.md) (live specs reach page 2 of patients, invoices, claims, audit events, security events and users; shipped, test only).
Order: FE-040 and FE-041 independent; FE-042 before FE-045; BE-025 before FE-045 and the users part
of FE-043; BE-026 before FE-043; FE-043 before FE-046 and FE-047; DATA-006 after BE-025, BE-026,
FE-043 and FE-045 (and should use the action names FE-046 settles); QA-008 after DATA-006, FE-046 and FE-047;
QA-009 after DATA-006 and QA-008.

State at the first audit (historical): paging was demonstrable in mock mode only. The live seed held
0 audit events, 0 security events, 4–5 users and 6 invoices (so 6 claims), which fit on one page
each. DATA-006 then seeded a second page of each (28 memberships, 19 invoices and claims, 45 extra
audit rows), and QA-008 made `e2e:live` green (two runs of 18).

Deferred with no owning task, recorded at the close audit: audit and security-event sorting
(the API orders `createdAt DESC, id DESC`; BE-026, FE-043, FE-046 and DATA-006 exclude it);
`total` on `GET /patients` and `GET /appointments` (the repositories already count; FE-044 uses
Previous/Next by design); a bound on the appointments list (FE-012 takes the first 50); resource-type
filter options for `condition`, `medication` and `external_identity` (FE-046 follow-up). Also not
done: keyboard-only and real 320 px checks for FE-043/044/045, and a Render redeploy with
`SEED_ON_DEPLOY=true` (operator step).

### M20 — PR previews and delivery lanes (in progress)

Per-PR review URLs on the Render demo without touching the interviewer data, and one documented
path from task to deploy. Marketing and web get manual Render service previews; web previews run
on frontend mocks; the API and database get none ([ADR-019](../decisions/ADR-019-render-pr-previews.md),
[delivery-lanes.md](../workflows/delivery-lanes.md)). No paid resources, no AWS, does not close M9.
Tasks:
[INFRA-018](../tasks/infrastructure/INFRA-018-render-pr-preview-decision-and-delivery-lanes.md) (accept ADR-019, point workflow docs at the lanes doc; docs only; shipped),
[INFRA-019](../tasks/infrastructure/INFRA-019-render-frontend-service-previews.md) (manual previews for marketing and web, mock-mode web build, no API upstream, spec test; shipped at 0.97.0),
[QA-011](../tasks/qa/QA-011-fix-api-type-check-for-green-ci.md) (fix the API type-check error; test only; shipped),
[SEC-010](../tasks/security/SEC-010-resolve-critical-production-audit-findings.md) (clear the 3 critical `npm audit --omit=dev` findings so the last `ci` step passes; shipped at 0.97.1),
[SEC-011](../tasks/security/SEC-011-resolve-production-audit-regressions.md) (clear the production audit advisories published after SEC-010: `zod`, `body-parser`, `fast-uri`, and `multer` through an override; shipped at 0.97.4),
[INFRA-020](../tasks/infrastructure/INFRA-020-checks-gated-deploys-and-pr-workflow.md) (`checksPass` deploys, Render-aware PR comment, PR template, branch protection; shipped at 0.97.3),
[FE-048](../tasks/frontend/FE-048-preview-environment-banner.md) (preview banner on web and marketing; optional; shipped at 0.97.2), and
[QA-010](../tasks/qa/QA-010-preview-lanes-pilot.md) (one real PR per lane, isolation evidence).
Order: INFRA-018 first; INFRA-019 after it; QA-011, then SEC-010, before INFRA-020 (a red
`ci` would stop `checksPass` deploys); FE-048 after INFRA-019; QA-010 last.
Deferred: a paid shared preview API and database (live web previews), a docs-only CI fast lane.

### M21 — Marketing design refresh (proposed)

The last design pass before 1.0.0. Section bands and responsive fixes on the homepage, a hero
product visual, module icons and links, a clearer slider, status badges distinct from links, an
About roadmap board, and a new `/architecture` page. Copy stays except where a new surface needs
it; Figma and code ship together (ADR-011). No new dependencies. Does not close M9.
Tasks:
[QA-012](../tasks/qa/QA-012-marketing-screenshot-capture.md) (repeatable screenshot capture without devtools icons),
[FE-051](../tasks/frontend/FE-051-marketing-design-system-extension.md) (badge, section band, split section, link card; Figma variants),
[FE-052](../tasks/frontend/FE-052-homepage-refresh.md) (homepage bands, hero visual, module icons and links, slider, principles),
[FE-053](../tasks/frontend/FE-053-status-and-link-affordance.md) (status badges vs link cards),
[FE-054](../tasks/frontend/FE-054-about-roadmap-board.md) (About shipped / in progress / up next board),
[FE-055](../tasks/frontend/FE-055-architecture-page.md) (`/architecture` page with system map), and
[INFRA-021](../tasks/infrastructure/INFRA-021-v1.0.0-demo-release.md) (1.0.0 demo release).
Order: QA-012 and FE-051 first; FE-052–FE-055 after FE-051; INFRA-021 last, after M20 (QA-010) and
M21 are closed.

## Milestone crosswalk

A milestone may be **demonstrable on frontend mocks** before the matching NestJS surface exists. A
backend domain task is not done until authorization uses the Identity HTTP module ([BE-009](../tasks/backend/BE-009-identity-and-access-http.md)).

| Milestone | Tasks | Notes |
| --- | --- | --- |
| M0 Foundation | INFRA-001, INFRA-002, INFRA-003, BE-001, BE-002, DATA-001, QA-001, FE-001 | Platform and tenant persistence shipped before Identity HTTP. DATA-001 injects `TenantContext` in tests. |
| M1 Identity | SEC-001, FE-010 | Contract plus mock login and dashboard session gate. Nest identity is BE-009 (M1 backend / start of M2 backend), not live OAuth. |
| M1 backend / M2 prerequisite | BE-009 | Mock IdP/session HTTP and guards. Required before BE-003 authorization ACs. |
| M2 Patient | FE-002, FE-003, FE-004, BE-003, QA-002, FE-011 | Frontend patient mocks may start after FE-010. Patient API waits on BE-009. FE-011 connects the shipped UI to that API. |
| M3 Scheduling | FE-005, FE-006, BE-004, QA-003, FE-012 | Frontend appointment mocks may start after FE-010. Appointment API waits on BE-009. FE-012 connects the shipped UI to that API. |
| M4 Clinical | BE-005, SEC-003, FE-013 | Clinical records plus audit model. FE-013 connects the patient-profile lists to Nest. |
| M5 Telehealth | FE-007, BE-006, FE-014 | Session shell plus Nest API. FE-014 connects the lobby and session shell to Nest. |
| M6 Billing | FE-008, BE-007, FE-015 | Frontend billing mocks may start after FE-010. Billing API waits on BE-009. FE-015 connects the shipped dashboard to that API. |
| M7 Administration | FE-009, FE-016, BE-010, SEC-002, SEC-004, QA-004, BE-008 as needed | User directory HTTP plus admin UI on Nest. Isolation hardening and authorization matrix remain. BE-008 is the notifications domain, not admin UI. **Closed** at 0.44.0. |
| M8 Marketing website and visual language | FE-017–FE-023 (shipped) | Public marketing site and shared visual language. Deploy/preview is M9. **Closed** at 0.51.1. |
| M9 Deployment / preview infrastructure | INFRA-004–INFRA-012 (shipped), INFRA-014 (pending; blocks INFRA-013), INFRA-013 (pending, paused) | **PAUSED / BLOCKED** — AWS account unavailable. GitHub Actions quality gates, secrets/OIDC bootstrap, preview/production demo databases, ECS/Fargate, Amplify, PR previews, production ECS delivery, GitHub `1.0.0` notes template, hosted first-apply, `v1.0.0` gate. Close audit found no missing IDs; M9 is not closed and not cancelled. Do not pull into M8 or M10. INFRA-015 is an interim Render demo and is not part of this AWS close. INFRA-016 adds the marketing static site on that demo and does not close M9. Since 2026-10-28 INFRA-013 is the post-1.0 AWS production release (1.x); 1.0.0 is INFRA-021 (M21). |
| M10 Product Analytics, Notifications & Role Administration | DATA-002, BE-011, FE-024, BE-012, FE-025, BE-013, FE-026 (shipped) | Live overview API and UI, notification producers + UI, role PATCH + UI. Bounded seed, Nest overview API, live dashboard cards, appointment producers, in-app notification center, and role assignment HTTP/UI shipped. No Redis, OAuth, Daily, Stripe, or AWS. |
| M11 Application Security & Session Hardening | BE-014, FE-027, FE-028, BE-015, FE-029, SEC-005 (shipped) | Nest HttpOnly cookies, live cookie client, mock MFA UI, security-events HTTP/UI, production-gap docs. Not OAuth, production MFA, rate limiting, Redis, or AWS. |
| M12 Telehealth Media Maturity | BE-016, FE-030 (shipped) | Daily media token HTTP plus Daily call-object UI on the shipped session shell. Fake adapter when `DAILY_API_KEY` is unset. Not chat, recording, Socket.IO, Stripe, or AWS. |
| M13 Billing / Payments UX | FE-031, FE-032 (shipped) | Enable Nest `POST /billing/payments` and `GET /billing/claims` in the UI. Demo adapter and labeled envelopes; not hosted Stripe, EDI 837, invoice-create UI, or AWS. **Closed** at 0.75.0. |
| M14 OAuth / External Identity | SEC-006, DATA-003, BE-017, FE-033 (shipped) | Nest OIDC client + PKCE, `external_identities`, existing cookie session, OAuth login UX. Google + Fake adapter. Not NextAuth, rate limiting, production MFA, Redis, or AWS. **Closed** at 0.77.0. |
| M15 API Protection and Rate Limiting | SEC-007, DATA-004, BE-018, BE-019, BE-020, FE-034 (shipped) | PostgreSQL limiter store, `TRUST_PROXY`, auth and sensitive-route policies, 429 envelope, `auth.rate_limited`, API security headers, 429 auth UX. Not Redis, WAF, production MFA, or AWS. **Closed** at 0.80.0. |
| M16 Live Telehealth | SEC-008, BE-021, FE-035 (shipped) | Eligibility on join/mint, join-before-mint, leave versus end (client/Daily leave; Nest end), 502 `MEDIA_UNAVAILABLE`, create/join rate limits, pre-join device UX. Not chat, recording, Socket.IO, or AWS. **Shipped** at 0.81.0. |
| M17 Security and Compliance Maturity | SEC-009, BE-022, BE-023, FE-036, QA-005 (shipped) | ADR-016 session-tenant SUPER_ADMIN, clinical read audit, live concurrent-session inventory, authz-matrix expansion. Not AWS, HIPAA certification, production MFA, Redis/WAF, or patient DELETE. **Closed** at 0.84.1. |
| M18 Interview Demo Readiness | QA-006, DATA-005, BE-024, FE-037, FE-038, FE-039, INFRA-017, QA-007 (all shipped; closed at 0.91.0) | Render interviewer path: smoke, one patient portal login, open-session lookup, demo account panel, participant entry, hide unconfigured OAuth, presentation pack, two-browser close. Does not close M9 or reopen M17. PR previews, real Google OAuth, chat/recording/Socket.IO, hosted Stripe, and Redis stay deferred. |
| M19 Polish and list normalization | FE-040–FE-045, BE-025, BE-026 (shipped, 0.96.0); DATA-006 (shipped, 0.96.1); FE-046 (shipped, 0.96.2); FE-047 (shipped, 0.96.3); QA-008 (shipped, no version bump); QA-009 (shipped, no version bump) | Header logo and RoleTag parity, billing design sync, mock role scoping and status colours, paged invoices/claims/users, bounded audit, security-event and patient lists. Time column no-wrap with `patient-form.test.tsx` timeout fix, live seed volume for paging and event filter options parity shipped. QA-008 (live e2e suite green) and QA-009 (live paging specs) shipped. **Closed** at 0.96.3. Does not close M9 or reopen M17/M18. |
| M20 PR previews and delivery lanes | INFRA-018 (shipped, docs only), INFRA-019 (shipped at 0.97.0), QA-011 (shipped, test only), SEC-010 (shipped at 0.97.1), SEC-011 (shipped at 0.97.4), FE-048 (optional; shipped at 0.97.2), INFRA-020 (shipped at 0.97.3); QA-010 (pending) | Render service previews for marketing and web only; web previews on frontend mocks; no API or database preview; `main` deploys after `ci`; PR-only flow. No paid resources. Does not close M9 or change the AWS topology (ADR-012, INFRA-010). |
| M21 Marketing design refresh | QA-012, FE-051, FE-052, FE-053, FE-054, FE-055, INFRA-021 (all pending) | **Proposed.** Homepage bands and responsive fixes, hero visual, module icons and links, slider, status badges vs links, About roadmap board, `/architecture` page, repeatable screenshots. INFRA-021 releases 1.0.0 as the Render demo; AWS production (INFRA-013) moves to 1.x. Does not close M9. |
| Standalone (no milestone) | FE-049 (shipped at 0.98.0); FE-050 (shipped at 0.99.0) | API status indicator on `/login` and a gesture-gated wake ping for the sleeping Render Free API (ADR-017). Not part of M20. No paid resources, keep-alive pinger, or API change. FE-050: logo link to the marketing site on the auth pages via `NEXT_PUBLIC_MARKETING_URL`; no API or auth change. |

[Frontend roadmap](frontend-roadmap.md) slices map onto these milestones (auth → M1, patients → M2,
and so on). [Backend roadmap](backend-roadmap.md) numbered items are domain order, not the
historical ship order: core platform (BE-001/BE-002) and the tenant model (DATA-001) landed in M0
ahead of Identity HTTP (BE-009).

Real OAuth 2.0 / OIDC + PKCE remains the target in [ADR-003](../decisions/ADR-003-authentication.md)
and is **not** an M1 acceptance criterion.

## Release principle

Each milestone should be demonstrable independently and should not require the entire roadmap to be
complete.
