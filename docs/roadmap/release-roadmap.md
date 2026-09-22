# Release Roadmap

This is the scheduling source for demo milestones. Frontend and backend roadmaps are parallel
calendars; they do not replace this join table. Task files in `docs/tasks/` remain the
implementation contracts.

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

## Milestone crosswalk

A milestone may be **demonstrable on frontend mocks** before the matching NestJS surface exists. A
backend domain task is not done until authorization uses the Identity HTTP module ([BE-009](../tasks/backend/BE-009-identity-and-access-http.md)).

| Milestone | Tasks | Notes |
| --- | --- | --- |
| M0 Foundation | INFRA-001, INFRA-002, INFRA-003, BE-001, BE-002, DATA-001, QA-001, FE-001 | Platform and tenant persistence shipped before Identity HTTP. DATA-001 injects `TenantContext` in tests. |
| M1 Identity | SEC-001, FE-010 | Contract plus mock login and dashboard session gate. Nest identity is BE-009 (M1 backend / start of M2 backend), not live OAuth. |
| M1 backend / M2 prerequisite | BE-009 | Mock IdP/session HTTP and guards. Required before BE-003 authorization ACs. |
| M2 Patient | FE-002, FE-003, FE-004, BE-003, QA-002 | Frontend patient mocks may start after FE-010. Patient API waits on BE-009. |
| M3 Scheduling | FE-005, FE-006, BE-004, QA-003 | |
| M4 Clinical | BE-005, SEC-003 | Audit model with clinical records. |
| M5 Telehealth | FE-007, BE-006 | |
| M6 Billing | FE-008, BE-007 | |
| M7 Administration | FE-009, SEC-002, SEC-004, QA-004, BE-008 as needed | Practice/user admin, isolation hardening, authorization matrix. |

[Frontend roadmap](frontend-roadmap.md) slices map onto these milestones (auth → M1, patients → M2,
and so on). [Backend roadmap](backend-roadmap.md) numbered items are domain order, not the
historical ship order: core platform (BE-001/BE-002) and the tenant model (DATA-001) landed in M0
ahead of Identity HTTP (BE-009).

Real OAuth 2.0 / OIDC + PKCE remains the target in [ADR-003](../decisions/ADR-003-authentication.md)
and is **not** an M1 acceptance criterion.

## Release principle

Each milestone should be demonstrable independently and should not require the entire roadmap to be
complete.
