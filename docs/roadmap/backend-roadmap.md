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
10. Notifications (BE-008; frontend wiring deferred).
11. Analytics (deferred; no Nest `GET /dashboard/overview`).
12. Administration/compliance (SEC-002–004, QA-004, BE-010 user directory HTTP; shipped in M7).
13. Scale/reliability (deferred with M9 deploy/preview).

M0 shipped items 4 and 3 before item 2 so the platform and tenant persistence could exist without
login HTTP. That does not make Identity optional for later domain APIs.

M0–M7 domain HTTP listed above is in the repository. M8 is frontend marketing (FE-017–FE-023),
not a new backend domain. Remaining demo work is **M9 — Deployment / preview infrastructure**
(close audit found no missing IDs; not closed; INFRA-004–INFRA-012 shipped; INFRA-014 pending,
blocks INFRA-013; INFRA-013 paused). Product-feature work continues.
