# Master Task List

This is an index, not the detailed source of task requirements.

Milestone mapping lives in [docs/roadmap/release-roadmap.md](../roadmap/release-roadmap.md).

## Foundation

- INFRA-001 — Local development foundation
- INFRA-002 — Monorepo workspace structure
- INFRA-003 — OpenAPI, Postman, and Swagger workflow
- SEC-001 — Authentication and authorization model
- BE-001 — NestJS core platform foundation
- BE-002 — OpenAPI foundation
- DATA-001 — PostgreSQL tenant model
- QA-001 — Test foundation

## Frontend

- FE-001 — Dashboard shell
- FE-010 — Mock authentication UI and session gate
- FE-002 — Patient list
- FE-003 — Patient profile
- FE-004 — Patient create/edit
- FE-011 — Patient UI on the Nest patient API
- FE-005 — Appointment creation
- FE-006 — Calendar
- FE-012 — Appointment UI on the Nest appointment API
- FE-013 — Clinical UI on the Nest clinical API
- FE-007 — Telehealth session shell
- FE-014 — Telehealth UI on the Nest telehealth session API
- FE-008 — Billing dashboard
- FE-015 — Billing UI on the Nest billing API
- FE-009 — Administration/security UI
- FE-016 — Administration UI on the Nest admin APIs
- FE-017 — Marketing website foundation
- FE-018 — Design system and visual language
- FE-019 — Marketing homepage
- FE-020 — Platform overview
- FE-021 — Platform feature pages
- FE-022 — Security, About, and Demo pages
- FE-023 — Marketing polish and product visuals
- FE-024 — Live dashboard overview
- FE-025 — Notifications UI
- FE-026 — Role assignment UI
- FE-027 — Live cookie session client
- FE-028 — Mock MFA challenge UI
- FE-029 — Security-events UI
- FE-030 — Daily media in the telehealth session shell
- FE-031 — Record demo payment on Nest payment adapter
- FE-032 — Claims envelope list on Nest claims API
- FE-033 — OAuth login UX and session hydration
- FE-034 — Rate-limited auth UX
- FE-035 — Clinical live-visit UX on the session shell
- FE-036 — Live concurrent-session chrome
- FE-037 — Demo account panel
- FE-038 — Telehealth participant entry
- FE-039 — Public demo OAuth unavailable

## Backend

- BE-009 — Identity and access HTTP
- BE-003 — Patient API
- BE-004 — Appointment API
- BE-005 — Clinical record API
- BE-006 — Telehealth session API
- BE-007 — Billing API
- BE-008 — Notification domain
- BE-010 — Practice user directory HTTP
- DATA-002 — Bounded synthetic seed for live analytics and inbox
- BE-011 — Dashboard overview API
- BE-012 — Notification producers (in-process)
- BE-013 — Role assignment HTTP
- BE-014 — HttpOnly cookie session HTTP
- BE-015 — Security-events HTTP
- BE-016 — Telehealth Daily media token HTTP
- DATA-003 — External identity and OAuth flow-state persistence
- BE-017 — Nest OIDC client, mapping, and session issuance
- DATA-004 — Rate-limit bucket persistence
- BE-018 — Rate-limit platform and trusted client IP
- BE-019 — Auth and sensitive-route rate-limit policies
- BE-020 — API security headers and no-store auth responses
- BE-021 — Telehealth eligibility and lifecycle hardening
- BE-022 — Clinical record read audit
- BE-023 — Concurrent session inventory HTTP
- DATA-005 — Synthetic patient portal account
- BE-024 — Telehealth open-session lookup

## Security

- SEC-002 — Tenant isolation
- SEC-003 — Audit events
- SEC-004 — Document access control
- SEC-005 — Production-gap documentation
- SEC-006 — OIDC BFF contract and ADR-014
- SEC-007 — Rate-limit, proxy-trust, and API-header contract (ADR-015)
- SEC-008 — Live telehealth workflow and access contract
- SEC-009 — M17 security findings, ADR-016, and contract reconciliation

## QA

- QA-002 — Patient vertical-slice tests
- QA-003 — Appointment workflow tests
- QA-004 — Authorization/tenant isolation tests
- QA-005 — Authorization and tenant regression expansion
- QA-006 — Live demo smoke
- QA-007 — M18 close audit
- QA-008 — Live e2e suite green
- QA-009 — Live paging specs

## Deployment (M9)

- INFRA-004 — Environment separation and configuration contract
- INFRA-005 — GitHub Actions CI quality gates
- INFRA-006 — Secrets classification and AWS secret retrieval
- INFRA-007 — Preview and production demo databases
- INFRA-008 — NestJS API container and ECS/Fargate deployment
- INFRA-009 — AWS Amplify Hosting for Next.js
- INFRA-010 — Preview environment and PR delivery workflow
- INFRA-011 — Production delivery workflow and rollback
- INFRA-012 — GitHub v1.0.0 release-notes template
- INFRA-014 — AWS account setup and hosted first-apply
- INFRA-013 — AWS production release readiness (post-1.0; retargeted 2026-10-28, 1.0.0 is INFRA-021)
- INFRA-015 — Interim Render public demo (does not close M9)
- INFRA-016 — Render marketing static site (does not close M9)
- INFRA-017 — Demo presentation pack (M18; does not close M9)

## Product (M10)

- DATA-002 — Bounded synthetic seed for live analytics and inbox
- BE-011 — Dashboard overview API
- FE-024 — Live dashboard overview
- BE-012 — Notification producers (in-process)
- FE-025 — Notifications UI
- BE-013 — Role assignment HTTP
- FE-026 — Role assignment UI

## Product (M11)

- BE-014 — HttpOnly cookie session HTTP
- FE-027 — Live cookie session client
- FE-028 — Mock MFA challenge UI
- BE-015 — Security-events HTTP
- FE-029 — Security-events UI
- SEC-005 — Production-gap documentation

## Product (M12)

- BE-016 — Telehealth Daily media token HTTP
- FE-030 — Daily media in the telehealth session shell

## Product (M13)

- FE-031 — Record demo payment on Nest payment adapter
- FE-032 — Claims envelope list on Nest claims API

## Product (M14)

- SEC-006 — OIDC BFF contract and ADR-014
- DATA-003 — External identity and OAuth flow-state persistence
- BE-017 — Nest OIDC client, mapping, and session issuance
- FE-033 — OAuth login UX and session hydration

## Product (M15, closed at 0.80.0)

- SEC-007 — Rate-limit, proxy-trust, and API-header contract (ADR-015)
- DATA-004 — Rate-limit bucket persistence
- BE-018 — Rate-limit platform and trusted client IP
- BE-019 — Auth and sensitive-route rate-limit policies
- BE-020 — API security headers and no-store auth responses
- FE-034 — Rate-limited auth UX

## Product (M16, shipped at 0.81.0)

- SEC-008 — Live telehealth workflow and access contract
- BE-021 — Telehealth eligibility and lifecycle hardening
- FE-035 — Clinical live-visit UX on the session shell

## Product (M17, closed at 0.84.1)

- SEC-009 — M17 security findings, ADR-016, and contract reconciliation
- BE-022 — Clinical record read audit
- BE-023 — Concurrent session inventory HTTP
- FE-036 — Live concurrent-session chrome
- QA-005 — Authorization and tenant regression expansion

## Product (M18, closed at 0.91.0)

Interview demo readiness on the existing Render host. Does not close M9 or reopen M17.

- QA-006 — Live demo smoke
- DATA-005 — Synthetic patient portal account
- BE-024 — Telehealth open-session lookup
- FE-037 — Demo account panel
- FE-038 — Telehealth participant entry
- FE-039 — Public demo OAuth unavailable
- INFRA-017 — Demo presentation pack
- QA-007 — M18 close audit

## Product (M19, shipped and closed at 0.96.3; 13 tasks)

Polish and list normalization. Does not close M9 or reopen M17/M18; see the release roadmap.

- FE-040 — Responsive header logo and RoleTag parity (shipped at 0.91.1)
- FE-041 — Billing design/code sync (shipped at 0.91.2)
- FE-042 — Billing role-scoped content and status colours (shipped at 0.91.3)
- BE-025 — Billing and user list pagination contract (shipped at 0.92.0)
- BE-026 — Audit and security-event list total (shipped at 0.93.0)
- FE-043 — Administration paginated lists (shipped at 0.94.0)
- FE-044 — Patient list bounded height (shipped at 0.95.0)
- FE-045 — Billing bounded invoice and claims lists (shipped at 0.96.0)
- FE-046 — Admin event filter options parity (shipped at 0.96.2)
- FE-047 — Audit and security event time column without wrapping (shipped at 0.96.3; includes `patient-form.test.tsx` timeout fix)
- DATA-006 — Live seed volume for list paging (shipped at 0.96.1; the live suite was red then, QA-008 made it green)
- QA-008 — Live e2e suite green (shipped; test and docs only, no version bump)
- QA-009 — Live paging specs (shipped; test only, no version bump)

## Product (M20, in progress)

PR previews and delivery lanes on the Render demo. Frontend previews only, web in mock mode
(ADR-019). Does not close M9 or add a preview API or database.

- INFRA-018 — Render PR preview decision and delivery lanes (shipped; docs only, no version bump)
- INFRA-019 — Render frontend service previews (marketing + web in mock mode) (shipped at 0.97.0)
- QA-011 — Fix API type-check error so CI runs green (shipped; test only, no version bump)
- SEC-010 — Resolve critical production audit findings (shipped at 0.97.1)
- SEC-011 — Resolve production audit regressions (shipped at 0.97.4)
- INFRA-020 — Checks-gated deploys and PR workflow (shipped at 0.97.3; branch protection is an operator step)
- FE-048 — Preview environment banner (optional; shipped at 0.97.2)
- QA-010 — Preview lanes pilot

## Product (M21, in progress)

Marketing design refresh, the last design pass before 1.0.0. Then 1.0.0 ships as the Render demo;
AWS production (INFRA-013) moves to a later 1.x release. Does not close M9.

- QA-012 — Repeatable marketing screenshot capture (shipped at 0.99.2; `npm run screenshots:marketing`)
- FE-051 — Marketing design-system extension (shipped at 0.99.3; Badge, MarketingBand, MarketingSplitSection, MarketingLinkCard)
- FE-052 — Homepage refresh (shipped at 0.99.4; homepage bands, hero visual, module links, slider, security and role cards)
- FE-053 — Status vs link affordance (shipped at 0.99.5; tone-mapped status badges, whole-card `/demo` route links)
- FE-054 — About: implementation state as a roadmap board (shipped at 0.99.6; Shipped / In progress / Up next lists and a Paused line)
- FE-055 — Architecture page
- INFRA-021 — 1.0.0 demo release

## Standalone (no milestone)

- FE-049 — API status indicator (shipped at 0.98.0; wakes the sleeping free-tier API and shows live status on `/login`)
- FE-050 — Auth pages marketing logo link (shipped at 0.99.0; logo link back to the marketing site on sign-in, register, and email-verification)
