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

The portfolio MVP focuses on authentication, dashboard shell, patient management, scheduling, basic
audit logging, and basic analytics. EHR, telehealth, billing, and administration follow as expansion
slices.

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
  .cursor/rules/     Project Cursor rules
  scripts/plane/     Plane task sync
```

The backend is a **separate modular NestJS application** under `apps/api`. Do not fold backend
domain logic into the Next.js app.

Frontend checks are UX only. Server-side authorization and tenant isolation are the planned
authoritative controls.

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

AWS, Docker, ECS/Fargate, Terraform, GitHub Actions, CloudWatch, with development / staging /
production separation.

Significant architectural choices are recorded as ADRs under [`docs/decisions/`](./docs/decisions/).

## Security model

The demo models healthcare-oriented engineering patterns:

- OAuth 2.0 / OpenID Connect (Authorization Code + PKCE)
- MFA
- RBAC and resource-level authorization
- tenant isolation
- audit logging
- encryption at rest and TLS in transit
- least-privilege access and secure secrets handling

The frontend may use a **mock identity / session** for demonstration. Mock authentication is not
production identity infrastructure.

### Roles

`SUPER_ADMIN`, `PRACTICE_ADMIN`, `PROVIDER`, `NURSE`, `RECEPTIONIST`, `PATIENT`

Authorization follows: identity → tenant / practice → role → permission → resource
ownership or assignment.

## Getting started

Local development is the Next.js app in `apps/web` (mock-first) plus the NestJS API in `apps/api`.
PostgreSQL is Docker Compose at the repository root (`docker compose up -d`). Redis is not part of
this setup.

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

4. Start local PostgreSQL and apply migrations:

```bash
docker compose up -d
npm run migration:run
```

5. Start the frontend with mocks (recommended until domain APIs exist):

```bash
npm run dev:mocks
```

6. Optionally start the NestJS API (health/readiness on port 3001; readiness requires Postgres):

```bash
npm run dev:api
```

7. Open [http://localhost:3000](http://localhost:3000).

`npm run dev` starts Next.js using `.env.development` (mock-first in the example).
`npm run dev:real` sets `NEXT_PUBLIC_USE_MOCKS=false`. When calling the Nest API from Next.js BFF
routes, set `API_BASE_URL=http://localhost:3001` in `.env.development`. The same commands exist as
`dev:web` aliases.

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
| [`postman/`](./postman/README.md) | Postman environment templates |
| [`docs/tasks/`](./docs/tasks/) | Implementation task contracts |
| [`docs/roadmap/`](./docs/roadmap/) | Sequencing |

Plane can mirror task metadata for project management. Git remains canonical for requirements,
architecture, ADRs, and task definitions.

## License

Proprietary — all rights reserved.
