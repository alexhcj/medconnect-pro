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
shipped (SEC-006, DATA-003, BE-017, FE-033). Local product work does not wait on AWS. Resume M9 when the AWS account can be
configured. Preview/production hosting remains M9, not M8, M10, or M11.

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

### M15 — API Protection and Rate Limiting (in progress)

Opt-in per-route rate limiting on a PostgreSQL bucket store, trusted-proxy client IP
(`TRUST_PROXY`), 429 `RATE_LIMITED` + `Retry-After`, `auth.rate_limited` security events, API
security headers with `no-store` on auth responses, and 429 UX on login/MFA/OAuth. Tasks:
[SEC-007](../tasks/security/SEC-007-rate-limit-and-api-protection-contract.md) (ADR-015, shipped),
[DATA-004](../tasks/backend/DATA-004-rate-limit-bucket-persistence.md) (shipped),
[BE-018](../tasks/backend/BE-018-rate-limit-platform-and-client-ip.md),
[BE-019](../tasks/backend/BE-019-auth-and-sensitive-route-rate-limits.md),
[BE-020](../tasks/backend/BE-020-api-security-headers.md),
[FE-034](../tasks/frontend/FE-034-rate-limited-auth-ux.md) (pending). Not Redis, WAF/CloudFront rules,
permanent lockout, production MFA, a new IdP, or AWS.

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
| M11 Application Security & Session Hardening | BE-014, FE-027, FE-028, BE-015, FE-029, SEC-005 (shipped) | Nest HttpOnly cookies, live cookie client, mock MFA UI, security-events HTTP/UI, production-gap docs. Not OAuth, production MFA, rate limiting, Redis, or AWS. |
| M12 Telehealth Media Maturity | BE-016, FE-030 (shipped) | Daily media token HTTP plus Daily call-object UI on the shipped session shell. Fake adapter when `DAILY_API_KEY` is unset. Not chat, recording, Socket.IO, Stripe, or AWS. |
| M13 Billing / Payments UX | FE-031, FE-032 (shipped) | Enable Nest `POST /billing/payments` and `GET /billing/claims` in the UI. Demo adapter and labeled envelopes; not hosted Stripe, EDI 837, invoice-create UI, or AWS. **Closed** at 0.75.0. |
| M14 OAuth / External Identity | SEC-006, DATA-003, BE-017, FE-033 (shipped) | Nest OIDC client + PKCE, `external_identities`, existing cookie session, OAuth login UX. Google + Fake adapter. Not NextAuth, rate limiting, production MFA, Redis, or AWS. **Closed** at 0.77.0. |
| M15 API Protection and Rate Limiting | SEC-007, DATA-004 (shipped), BE-018, BE-019, BE-020, FE-034 (pending) | PostgreSQL limiter store, `TRUST_PROXY`, auth and sensitive-route policies, 429 envelope, `auth.rate_limited`, API security headers, 429 auth UX. Not Redis, WAF, production MFA, or AWS. |

[Frontend roadmap](frontend-roadmap.md) slices map onto these milestones (auth → M1, patients → M2,
and so on). [Backend roadmap](backend-roadmap.md) numbered items are domain order, not the
historical ship order: core platform (BE-001/BE-002) and the tenant model (DATA-001) landed in M0
ahead of Identity HTTP (BE-009).

Real OAuth 2.0 / OIDC + PKCE remains the target in [ADR-003](../decisions/ADR-003-authentication.md)
and is **not** an M1 acceptance criterion.

## Release principle

Each milestone should be demonstrable independently and should not require the entire roadmap to be
complete.
