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

## Backend

- BE-009 — Identity and access HTTP
- BE-003 — Patient API
- BE-004 — Appointment API
- BE-005 — Clinical record API
- BE-006 — Telehealth session API
- BE-007 — Billing API
- BE-008 — Notification domain
- BE-010 — Practice user directory HTTP

## Security

- SEC-002 — Tenant isolation
- SEC-003 — Audit events
- SEC-004 — Document access control

## QA

- QA-002 — Patient vertical-slice tests
- QA-003 — Appointment workflow tests
- QA-004 — Authorization/tenant isolation tests

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
- INFRA-013 — v1.0.0 production release readiness
