# Backend Roadmap

Domain order (not historical ship order). Join to demo milestones in the
[release roadmap crosswalk](release-roadmap.md).

1. Infrastructure/security foundation (INFRA-*, SEC-001 model).
2. Identity and access HTTP (BE-009) — after the M1 mock UI; before Patient API authorization.
3. Tenant model (DATA-001; shipped in M0 with test-injected `TenantContext`).
4. Core platform conventions (BE-001, BE-002; shipped in M0).
5. Patient (BE-003; depends on BE-009).
6. Scheduling (BE-004).
7. EHR (BE-005).
8. Telehealth (BE-006).
9. Billing (BE-007).
10. Notifications (BE-008 shipped; [BE-012](../tasks/backend/BE-012-notification-producers.md)
    producers shipped; [FE-025](../tasks/frontend/FE-025-notifications-ui.md) UI shipped).
11. Analytics ([BE-011](../tasks/backend/BE-011-dashboard-overview-api.md) `GET /dashboard/overview`;
    M10, shipped. Seed: [DATA-002](../tasks/backend/DATA-002-bounded-synthetic-seed.md)).
12. Administration/compliance (SEC-002–004, QA-004, BE-010 user directory HTTP; shipped in M7).
    Role PATCH is [BE-013](../tasks/backend/BE-013-role-assignment-http.md) (M10, shipped).
    Security-events HTTP is [BE-015](../tasks/backend/BE-015-security-events-http.md) (M11,
    shipped).
13. Scale/reliability (deferred with M9 deploy/preview; M9 paused on AWS).
14. Application security and session hardening (M11): cookie session HTTP
    ([BE-014](../tasks/backend/BE-014-httponly-cookie-session-http.md), shipped), security-events HTTP
    ([BE-015](../tasks/backend/BE-015-security-events-http.md), shipped), production-gap docs
    ([SEC-005](../tasks/security/SEC-005-production-gap-documentation.md), shipped).
15. Telehealth media (M12): Daily media token HTTP
    ([BE-016](../tasks/backend/BE-016-telehealth-daily-media-token-http.md), shipped).
    Frontend Daily session shell is [FE-030](../tasks/frontend/FE-030-daily-media-session-shell.md)
    (shipped). Not Socket.IO signaling, chat, or recording.
16. Billing payments/claims UX (M13): no new Nest routes. Frontend join is
    [FE-031](../tasks/frontend/FE-031-record-demo-payment.md) and
    [FE-032](../tasks/frontend/FE-032-claims-envelope-list.md) on shipped
    [BE-007](../tasks/backend/BE-007-billing-api.md). Not Stripe SDK or EDI generation.
17. OAuth / external identity (M14): contract and ADR-014
    ([SEC-006](../tasks/security/SEC-006-oidc-bff-contract-and-adr.md)), persistence
    ([DATA-003](../tasks/backend/DATA-003-external-identity-persistence.md)), Nest OIDC client and
    session issuance ([BE-017](../tasks/backend/BE-017-oidc-client-and-session-issuance.md)); all
    shipped. Reuses the BE-014 cookie session. Not NextAuth, Redis, or rate limiting.
18. API protection and rate limiting (M15): contract and ADR-015
    ([SEC-007](../tasks/security/SEC-007-rate-limit-and-api-protection-contract.md)), bucket
    persistence ([DATA-004](../tasks/backend/DATA-004-rate-limit-bucket-persistence.md)), limiter
    platform and `TRUST_PROXY` ([BE-018](../tasks/backend/BE-018-rate-limit-platform-and-client-ip.md))
    shipped; route policies ([BE-019](../tasks/backend/BE-019-auth-and-sensitive-route-rate-limits.md))
    and API security headers ([BE-020](../tasks/backend/BE-020-api-security-headers.md)) shipped.
    PostgreSQL store; not Redis or WAF. **Closed** at 0.80.0.
19. Live telehealth workflow (M16): contract
    ([SEC-008](../tasks/security/SEC-008-live-telehealth-workflow-contract.md)) and eligibility /
    join-before-mint / create-join rate limits
    ([BE-021](../tasks/backend/BE-021-telehealth-eligibility-and-lifecycle.md)) shipped. Frontend is
    [FE-035](../tasks/frontend/FE-035-clinical-live-visit-ux.md). Not chat, recording, or Socket.IO.
    **Shipped** at 0.81.0.
20. Security and compliance maturity (M17): contract and ADR-016
    ([SEC-009](../tasks/security/SEC-009-m17-security-findings-and-contract-reconciliation.md),
    shipped), clinical read audit ([BE-022](../tasks/backend/BE-022-clinical-record-read-audit.md),
    shipped), concurrent
    session inventory HTTP ([BE-023](../tasks/backend/BE-023-concurrent-session-inventory-http.md),
    shipped),
    authz-matrix expansion ([QA-005](../tasks/qa/QA-005-authorization-and-tenant-regression-expansion.md),
    shipped).
    Frontend is [FE-036](../tasks/frontend/FE-036-live-concurrent-session-chrome.md) (shipped). Not AWS, HIPAA
    certification, Redis, or WAF. **Closed** at 0.84.1.
21. Interview demo readiness (M18, pending): synthetic patient portal account
    ([DATA-005](../tasks/backend/DATA-005-synthetic-patient-portal-account.md)) and open-session
    lookup ([BE-024](../tasks/backend/BE-024-telehealth-open-session-lookup.md)). Not a session
    list, not Google credentials, and not a reopen of M17.

M0 shipped items 4 and 3 before item 2 so the platform and tenant persistence could exist without
login HTTP. That does not make Identity optional for later domain APIs.

M0–M7 domain HTTP listed above is in the repository. M8 is frontend marketing (FE-017–FE-023),
not a new backend domain. **M9 — Deployment / preview infrastructure** is **PAUSED / BLOCKED** —
AWS account unavailable (close audit found no missing IDs; not closed; not cancelled;
INFRA-004–INFRA-012 shipped; INFRA-014 pending, blocks INFRA-013; INFRA-013 paused). **M10** is
shipped (DATA-002, BE-011, FE-024, BE-012, FE-025, BE-013, FE-026). **M11** is shipped
(BE-014, FE-027, FE-028, BE-015, FE-029, SEC-005). **M12 — Telehealth Media Maturity** is
shipped ([BE-016](../tasks/backend/BE-016-telehealth-daily-media-token-http.md),
[FE-030](../tasks/frontend/FE-030-daily-media-session-shell.md)). **M13 — Billing / Payments UX**
is shipped ([FE-031](../tasks/frontend/FE-031-record-demo-payment.md),
[FE-032](../tasks/frontend/FE-032-claims-envelope-list.md)). Hosted Stripe/ACH, claims submission /
EDI 837, and invoice-create UI remain later. **M14** is shipped and **closed** at 0.77.0.
**M15 — API Protection and Rate Limiting** is shipped and **closed** at 0.80.0 (SEC-007,
DATA-004, BE-018, BE-019, BE-020, FE-034). **M16 — Live Telehealth** is shipped at 0.81.0 (SEC-008,
BE-021, FE-035). **M17 — Security and Compliance Maturity** is shipped and **closed** at 0.84.1 (SEC-009, BE-022, BE-023, FE-036,
QA-005). **M18 — Interview Demo Readiness** is the next milestone and is **pending**
([QA-006](../tasks/qa/QA-006-live-demo-smoke.md) (shipped),
[DATA-005](../tasks/backend/DATA-005-synthetic-patient-portal-account.md),
[BE-024](../tasks/backend/BE-024-telehealth-open-session-lookup.md),
[FE-037](../tasks/frontend/FE-037-demo-account-panel.md),
[FE-038](../tasks/frontend/FE-038-telehealth-participant-entry.md),
[FE-039](../tasks/frontend/FE-039-public-demo-oauth-unavailable.md),
[INFRA-017](../tasks/infrastructure/INFRA-017-demo-presentation-pack.md),
[QA-007](../tasks/qa/QA-007-m18-close-audit.md) (pending)). It does not reopen M17 or close M9. Render PR
previews, real Google OAuth credentials, chat, recording, Socket.IO, hosted Stripe, and Redis
stay deferred. Local product work does not wait on AWS.
