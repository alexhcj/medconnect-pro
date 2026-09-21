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

## Planned technology

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

Backend:
- Node.js current LTS
- NestJS current stable
- PostgreSQL
- Redis
- S3/KMS
- REST/OpenAPI
- WebSockets/Socket.IO where appropriate
- WebRTC/Daily for telehealth

Infrastructure:
- AWS
- Docker
- ECS/Fargate initially
- Terraform
- GitHub Actions
- CloudWatch
- dev/staging/prod separation

## Demo-data policy

All data is synthetic. Patient names, addresses, dates of birth, identifiers, conditions,
medications and appointments are fictional.

## Current frontend state

The repository is an npm workspace. The Next.js frontend lives in `apps/web` with mock-mode
scripts for the planned feature set. `apps/api` is reserved for a separate modular NestJS
application; do not force backend concerns into the Next.js frontend.

## Implementation strategy

Start with complete vertical slices:

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
