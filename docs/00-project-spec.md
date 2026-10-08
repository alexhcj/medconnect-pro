# MedConnect Pro — Project Specification

## Project type

Feature-rich healthcare SaaS demonstration application for portfolio, interview and potential-client
presentations.

It is intentionally production-oriented in architecture and engineering practices but is not a
production healthcare service and must not be represented as HIPAA certified/compliant.

## Product concept

A multi-tenant practice platform covering:

- identity and access;
- practice/provider management;
- patient management;
- scheduling;
- EHR/clinical data;
- telehealth;
- billing;
- notifications;
- analytics;
- administration and audit/compliance.

Status of those surfaces: [docs/product/](product/README.md). Public claims:
[capability-matrix.md](marketing/capability-matrix.md).

## Primary demo goal

Demonstrate how a senior engineering team could design and implement a secure, accessible,
healthcare-workflow-aware SaaS product.

## Core principles

- privacy by design;
- least privilege;
- server-side authorization;
- tenant isolation;
- auditability;
- accessible healthcare UX;
- responsive tablet/mobile workflows;
- complete vertical slices;
- modular backend boundaries;
- explicit contracts;
- testable business rules;
- observable operations.

## Roles

- SUPER_ADMIN
- PRACTICE_ADMIN
- PROVIDER
- NURSE
- RECEPTIONIST
- PATIENT

Role meanings, the permission catalog, and default grants are defined in
[identity-and-access.md](contracts/identity-and-access.md).

## Technology

Current stack is listed first. Items marked planned are not in the repository.

Frontend:
- Next.js App Router
- React
- TypeScript
- TanStack Query
- React Hook Form
- Zod
- Tailwind CSS
- Headless UI
- Lucide React
- Recharts
- React Big Calendar

Backend (current):
- Node.js current LTS
- NestJS 12
- PostgreSQL (local Compose + TypeORM)
- REST/OpenAPI
- GitHub Actions quality gates (INFRA-005)

Backend / infrastructure (planned):
- Redis
- S3/KMS
- WebSockets/Socket.IO where appropriate
- WebRTC/Daily for telehealth media
- AWS, Docker, ECS/Fargate, Terraform, CloudWatch
- local / preview / production separation ([ADR-012](decisions/ADR-012-deployment-topology.md))

## Demo-data policy

All data is synthetic. Patient names, addresses, dates of birth, identifiers, conditions,
medications and appointments are fictional.

## Current implementation state

The repository is an npm workspace. The Next.js frontend lives in `apps/web` (mock-first scripts
plus `dev:real` against Nest). `apps/api` is a separate modular NestJS application; do not fold
backend domain logic into the Next.js frontend.

Demo vertical slices 1–12 below shipped in milestones M0–M7. M8 marketing site shipped
(FE-017–FE-023). Current position:
[post-mvp-baseline.md](roadmap/post-mvp-baseline.md). **M9 — Deployment / preview
infrastructure** is **PAUSED / BLOCKED** — AWS account setup unavailable (close audit found no
missing IDs; not closed; not cancelled; INFRA-004–INFRA-012 shipped; INFRA-014 pending, blocks
INFRA-013; INFRA-013 paused). **M10** is shipped. **M11** is shipped (BE-014, FE-027, FE-028, BE-015,
FE-029, SEC-005). **M12 — Telehealth Media Maturity** is shipped
([BE-016](tasks/backend/BE-016-telehealth-daily-media-token-http.md),
[FE-030](tasks/frontend/FE-030-daily-media-session-shell.md)). **M13 — Billing / Payments UX**
is shipped ([FE-031](tasks/frontend/FE-031-record-demo-payment.md),
[FE-032](tasks/frontend/FE-032-claims-envelope-list.md)). Hosted Stripe/ACH, claims submission /
EDI 837, and invoice-create UI remain later. Local product work does not wait on AWS.

## Implementation strategy

Complete vertical slices (shipped through M7):

1. authentication;
2. dashboard shell;
3. patient list;
4. patient profile;
5. create/edit patient;
6. appointment creation;
7. calendar;
8. patient → appointment workflow;
9. basic clinical record;
10. telehealth session shell;
11. billing dashboard;
12. practice/user administration.
