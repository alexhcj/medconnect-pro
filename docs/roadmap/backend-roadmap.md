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
    (pending). Not Socket.IO signaling, chat, or recording.

M0 shipped items 4 and 3 before item 2 so the platform and tenant persistence could exist without
login HTTP. That does not make Identity optional for later domain APIs.

M0–M7 domain HTTP listed above is in the repository. M8 is frontend marketing (FE-017–FE-023),
not a new backend domain. **M9 — Deployment / preview infrastructure** is **PAUSED / BLOCKED** —
AWS account unavailable (close audit found no missing IDs; not closed; not cancelled;
INFRA-004–INFRA-012 shipped; INFRA-014 pending, blocks INFRA-013; INFRA-013 paused). **M10** is
shipped (DATA-002, BE-011, FE-024, BE-012, FE-025, BE-013, FE-026). **M11** is shipped
(BE-014, FE-027, FE-028, BE-015, FE-029, SEC-005). Next product module is **M12 — Telehealth
Media Maturity** ([BE-016](../tasks/backend/BE-016-telehealth-daily-media-token-http.md)
shipped, [FE-030](../tasks/frontend/FE-030-daily-media-session-shell.md) pending). Local product
work does not wait on AWS.
