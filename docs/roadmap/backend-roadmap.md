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
    producers and FE-025 UI are M10).
11. Analytics ([BE-011](../tasks/backend/BE-011-dashboard-overview-api.md) `GET /dashboard/overview`;
    M10, shipped. Seed: [DATA-002](../tasks/backend/DATA-002-bounded-synthetic-seed.md)).
12. Administration/compliance (SEC-002–004, QA-004, BE-010 user directory HTTP; shipped in M7).
    Role PATCH is [BE-013](../tasks/backend/BE-013-role-assignment-http.md) (M10).
13. Scale/reliability (deferred with M9 deploy/preview; M9 paused on AWS).

M0 shipped items 4 and 3 before item 2 so the platform and tenant persistence could exist without
login HTTP. That does not make Identity optional for later domain APIs.

M0–M7 domain HTTP listed above is in the repository. M8 is frontend marketing (FE-017–FE-023),
not a new backend domain. **M9 — Deployment / preview infrastructure** is **PAUSED / BLOCKED** —
AWS account unavailable (close audit found no missing IDs; not closed; not cancelled;
INFRA-004–INFRA-012 shipped; INFRA-014 pending, blocks INFRA-013; INFRA-013 paused). Next
product module is **M10** (DATA-002, BE-011 shipped; BE-012, BE-013, plus FE-024–FE-026). Local product
work does not wait on AWS.
