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
Next product module is **M11 — Application Security & Session Hardening**
([BE-014](../tasks/backend/BE-014-httponly-cookie-session-http.md),
[FE-027](../tasks/frontend/FE-027-live-cookie-session-client.md) shipped;
[FE-028](../tasks/frontend/FE-028-mock-mfa-challenge-ui.md),
[BE-015](../tasks/backend/BE-015-security-events-http.md),
[FE-029](../tasks/frontend/FE-029-security-events-ui.md),
[SEC-005](../tasks/security/SEC-005-production-gap-documentation.md) pending).
Local product work does not wait on AWS. Resume M9 when the AWS account can be
configured. Preview/production hosting remains M9, not M8 or M10.

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
Terraform/workflows as a hosted demo. Do not pull AWS work into M10.

### M10 — Product Analytics, Notifications & Role Administration

Live Nest dashboard overview, notification inbox/preferences UI on BE-008, and practice role
assignment. Local product work while M9 is paused. Tasks: DATA-002, BE-011, FE-024, BE-012,
FE-025, BE-013, FE-026 (shipped).

### M11 — Application Security & Session Hardening (planned)

Local session/cookie, mock MFA UI, security-events HTTP, and production-gap documentation.
Tasks: BE-014, FE-027 (shipped), FE-028, BE-015, FE-029, SEC-005 (pending). Not an AWS/infrastructure
milestone.

### M12 — Telehealth Media Maturity (planned)

Daily/WebRTC on the shipped session shell. No task IDs yet.

### M13 — Billing / Payments UX (planned)

Enable the existing Nest payment adapter and claims envelope in the UI. No task IDs yet.

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
| M9 Deployment / preview infrastructure | INFRA-004–INFRA-012 (shipped), INFRA-014 (pending; blocks INFRA-013), INFRA-013 (pending, paused) | **PAUSED / BLOCKED** — AWS account unavailable. GitHub Actions quality gates, secrets/OIDC bootstrap, preview/production demo databases, ECS/Fargate, Amplify, PR previews, production ECS delivery, GitHub `1.0.0` notes template, hosted first-apply, `v1.0.0` gate. Close audit found no missing IDs; M9 is not closed and not cancelled. Do not pull into M8 or M10. |
| M10 Product Analytics, Notifications & Role Administration | DATA-002, BE-011, FE-024, BE-012, FE-025, BE-013, FE-026 (shipped) | Live overview API and UI, notification producers + UI, role PATCH + UI. Bounded seed, Nest overview API, live dashboard cards, appointment producers, in-app notification center, and role assignment HTTP/UI shipped. No Redis, OAuth, Daily, Stripe, or AWS. |
| M11 Application Security & Session Hardening | BE-014, FE-027 (shipped), FE-028, BE-015, FE-029, SEC-005 (pending) | Nest HttpOnly cookies, live cookie client, mock MFA UI, security-events HTTP/UI, production-gap docs. Not OAuth, production MFA, rate limiting, Redis, or AWS. |

[Frontend roadmap](frontend-roadmap.md) slices map onto these milestones (auth → M1, patients → M2,
and so on). [Backend roadmap](backend-roadmap.md) numbered items are domain order, not the
historical ship order: core platform (BE-001/BE-002) and the tenant model (DATA-001) landed in M0
ahead of Identity HTTP (BE-009).

Real OAuth 2.0 / OIDC + PKCE remains the target in [ADR-003](../decisions/ADR-003-authentication.md)
and is **not** an M1 acceptance criterion.

## Release principle

Each milestone should be demonstrable independently and should not require the entire roadmap to be
complete.
