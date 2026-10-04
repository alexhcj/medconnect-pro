# MedConnect Pro

Feature-rich healthcare SaaS demonstration for portfolio, technical interviews, and potential-client
presentations.

The application is production-oriented in architecture and engineering practice. It is **not** a
deployed healthcare service and must **not** be described as HIPAA certified or HIPAA compliant.

Canonical product, architecture, contract, and task documentation lives in [`/docs`](./docs/README.md).

## Product

A multi-tenant practice platform covering:

- identity and access
- practice / provider management
- patient management
- scheduling
- EHR / clinical data
- telehealth
- billing
- notifications
- analytics
- administration and audit / compliance

Demo milestones M0–M8 are shipped (FE-017–FE-023). Current position:
[`docs/roadmap/post-mvp-baseline.md`](./docs/roadmap/post-mvp-baseline.md). **M9 — Deployment /
preview infrastructure** is in progress: INFRA-004–INFRA-012 shipped, INFRA-014 pending
(blocks INFRA-013), INFRA-013 paused.
Dashboard analytics, notifications UI, live video, payments, and production OAuth remain deferred.

All data is **synthetic**. Do not introduce real patient records, credentials, or other PHI.

## Repository layout

This repository is an **npm workspaces** monorepo.

```text
medconnect-pro/
  apps/web/          Next.js frontend
  apps/api/          NestJS API (platform foundation)
  apps/api/openapi/  Generated OpenAPI (`npm run openapi:generate`)
  packages/          Reserved for future shared packages
  postman/           Postman environments and collection conventions
  docs/              Canonical documentation
  infra/terraform/   M9 Terraform root (secrets, RDS, ECS)
  amplify.yml        Amplify Hosting buildspec for apps/web
  .github/workflows  GitHub Actions quality gates (`ci.yml`)
  .cursor/rules/     Project Cursor rules
  scripts/plane/     Plane task sync
```

The backend is a **separate modular NestJS application** under `apps/api`. Do not fold backend
domain logic into the Next.js app.

Frontend role and nav checks are UX only. Server-side authorization and tenant isolation in
`apps/api` are the authoritative controls.

## Stack

### Frontend (`apps/web`)

- Next.js App Router, React, TypeScript
- TanStack Query
- React Hook Form + Zod
- Tailwind CSS, Headless UI, Lucide React
- Recharts, React Big Calendar
- Daily SDK (telehealth client boundary)
- Socket.IO client (planned realtime)

### Backend (`apps/api`)

- Node.js current LTS, NestJS 12, TypeScript
- REST + OpenAPI (`npm run openapi:generate`, `/api/docs-json`, optional `/api/docs`)
- PostgreSQL (local Compose + TypeORM), Redis (not wired yet)
- S3 + KMS (planned)
- WebSockets / Socket.IO where justified
- WebRTC / Daily for telehealth

### Planned infrastructure

AWS, Docker, ECS/Fargate, Amplify Hosting ([amplify.yml](./amplify.yml)), Terraform
([infra/terraform/](./infra/terraform/)), CloudWatch, with
[local / preview / production](./docs/decisions/ADR-012-deployment-topology.md) separation.
GitHub Actions **quality gates** already run on pull requests and `main`
([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)). Amplify Git publishes `main`;
production ECS migrate/deploy is [`.github/workflows/production-deploy.yml`](./.github/workflows/production-deploy.yml).
The `v1.0.0` gate remains INFRA-013 (paused until INFRA-014 first-apply).

Significant architectural choices are recorded as ADRs under [`docs/decisions/`](./docs/decisions/).

## Security model

The demo models healthcare-oriented engineering patterns. **Implemented:** mock IdP sessions, mock
MFA challenge, RBAC and resource-level authorization, tenant isolation (including PostgreSQL RLS),
audit logging, least-privilege database role, secrets outside source control.

**Target, not implemented:** OAuth 2.0 / OpenID Connect (Authorization Code + PKCE), production MFA,
encryption at rest as an infrastructure property, TLS at the deployment edge.

The frontend may use a **mock identity / session** for demonstration. Mock authentication is not
production identity infrastructure.

### Roles

`SUPER_ADMIN`, `PRACTICE_ADMIN`, `PROVIDER`, `NURSE`, `RECEPTIONIST`, `PATIENT`

Authorization follows: identity → tenant / practice → role → permission → resource
ownership or assignment.

## Getting started

Local development is the Next.js app in `apps/web` (mock-first) plus the NestJS API in `apps/api`.
PostgreSQL is Docker Compose at the repository root (`docker compose up -d`, image
`postgres:18-alpine`). Redis is not part of this setup.

### Prerequisites

- Node.js **24** (Active LTS). See `.nvmrc` and the root `package.json` `engines` field.
- npm **10.x** or later
- Docker (for local PostgreSQL)

### Installation

1. Clone the repository.
2. Copy [`apps/web/.env.example`](./apps/web/.env.example) to `apps/web/.env.development`. Do not
   commit `.env.development`, `.env.test`, or secrets. For Vitest/Playwright local overrides, copy
   the example to `apps/web/.env.test` and set mock delay/error rate to `0` as noted in that file.
3. Install dependencies from the **repository root**:

```bash
npm install
```

4. Start local PostgreSQL and apply migrations (owner role). Nest runtime must use `medconnect_app`
   (`DATABASE_URL` in [`apps/api/.env.example`](./apps/api/.env.example)); do not point it at the
   table owner or row-level security is bypassed:

```bash
docker compose up -d
npm run migration:run
```

5. Start the frontend with mocks for UX-only work:

```bash
npm run dev:mocks
```

6. For live Nest APIs, start PostgreSQL (step 4), seed demo identity, start the API, then the
   frontend with mocks off:

```bash
npm run seed:mock-identity
npm run dev:api
npm run dev:real
```

7. Open [http://localhost:3000](http://localhost:3000).

`npm run dev` starts Next.js using `.env.development` (mock-first in the example).
`npm run dev:real` sets `NEXT_PUBLIC_USE_MOCKS=false`. The browser then calls Nest at
`NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:3001`) with the bearer from `POST /auth/login`.
When calling the Nest API from Next.js BFF routes, set `API_BASE_URL=http://localhost:3001` in
`.env.development`. Live dashboard overview metrics still use that BFF path and are **not** a
shipped Nest route; use mocks for overview cards. The same commands exist as `dev:web` aliases.

### Local versus hosted

Local development (`APP_ENV=local`) uses Compose PostgreSQL and the committed `.env.example`
files. It does not require AWS credentials. Preview and production are separate hosted
environments with isolated demo databases
([ADR-012](./docs/decisions/ADR-012-deployment-topology.md),
[environment-configuration.md](./docs/contracts/environment-configuration.md)). Copy
`.env.preview.example` / `.env.production.example` only as placeholders; real
`.env.preview` / `.env.production` stay gitignored. Hosted API boot fails closed if database
URLs are missing or still point at Compose. All three databases are synthetic/demo only.

### Useful commands

Run these from the repository root:

```bash
npm run lint
npm run lint:api
npm run type-check
npm run type-check:api
npm test
npm run test:api
npm run test:watch
npm run test:coverage
npx playwright install chromium   # once per machine, before E2E; run from apps/web if needed
npm run e2e
npm run build
npm run build:api
npm run clean                     # Next.js/test output under apps/web
npm run reset                     # clean + reinstall node_modules (cross-platform)
npm run dev:api                   # NestJS API on http://localhost:3001
npm run openapi:generate          # Write apps/api/openapi/openapi.json
npm run migration:run             # Apply TypeORM migrations to local Postgres
```

Pull requests and pushes to `main` run the same lint, type-check, test, and build commands via
[`.github/workflows/ci.yml`](./.github/workflows/ci.yml) (plus `npm run migration:run` before
`test:api`, and `npm audit --omit=dev`). Playwright e2e is local/release smoke, not every PR.
A failing quality-gate step fails the workflow. Mark the `ci` GitHub check required on `main` so
merges stay fail-closed.

Frontend testing conventions: [docs/workflows/frontend-testing.md](./docs/workflows/frontend-testing.md).

API contracts and Postman: [docs/workflows/api-contract-workflow.md](./docs/workflows/api-contract-workflow.md).
`npm run dev:api`, `npm run test:api`, and `npm run openapi:generate` are available. Import
`apps/api/openapi/openapi.json` into Postman as **MedConnect Pro API**.

## Documentation

| Path | Purpose |
| --- | --- |
| [`docs/README.md`](./docs/README.md) | Documentation map and source-of-truth hierarchy |
| [`docs/00-project-spec.md`](./docs/00-project-spec.md) | Project identity, goals, and constraints |
| [`docs/01-product-requirements.md`](./docs/01-product-requirements.md) | Product behavior |
| [`docs/architecture/`](./docs/architecture/) | System structure |
| [`docs/contracts/`](./docs/contracts/) | API and data contracts |
| [`docs/workflows/api-contract-workflow.md`](./docs/workflows/api-contract-workflow.md) | OpenAPI, Postman, optional Swagger UI |
| [`docs/workflows/design-requirements.md`](./docs/workflows/design-requirements.md) | Design workflow before Figma/Pencil |
| [`docs/marketing/`](./docs/marketing/requirements.md) | Public-site requirements, sitemap, capability matrix |
| [`docs/processes/`](./docs/processes/) | Cursor prompts and process flows |
| [`postman/`](./postman/README.md) | Postman environment templates |
| [`docs/tasks/`](./docs/tasks/) | Implementation task contracts |
| [`docs/roadmap/`](./docs/roadmap/) | Sequencing |
| [`docs/roadmap/post-mvp-baseline.md`](./docs/roadmap/post-mvp-baseline.md) | M0–M7 baseline; M8 remaining vs later deploy |

Plane can mirror task metadata for project management. Git remains canonical for requirements,
architecture, ADRs, and task definitions.

## License

Proprietary — all rights reserved.
