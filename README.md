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

## Current state

This repository currently contains a **Next.js frontend foundation** with mock-mode APIs for early
UI and workflow development.

The backend is planned as a **separate modular NestJS application**. Do not fold backend domain
logic into the Next.js app.

Frontend checks are UX only. Server-side authorization and tenant isolation are the planned
authoritative controls.

## Stack

### Frontend (this repo)

- Next.js App Router, React, TypeScript
- TanStack Query
- React Hook Form + Zod
- Tailwind CSS, Headless UI, Lucide React
- Recharts, React Big Calendar
- Daily SDK (telehealth client boundary)
- Socket.IO client (planned realtime)

### Planned backend

- Node.js current LTS, NestJS, TypeScript
- REST + OpenAPI
- PostgreSQL, Redis
- S3 + KMS
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

### Prerequisites

- Node.js current LTS
- npm 10.x or later

### Installation

1. Clone the repository.
2. Copy [`.env.example`](./.env.example) to `.env.development` and adjust local values. Do not commit
   secrets.
3. Install dependencies:

```bash
npm install
```

4. Start the frontend with mocks (recommended until the NestJS API exists):

```bash
npm run dev:mocks
```

5. Open [http://localhost:3000](http://localhost:3000).

`npm run dev` starts the Next.js app without forcing mock mode. `npm run dev:real` points at a real
API base URL when one is available.

### Useful commands

```bash
npm run lint
npm run type-check
npm test
npm run test:watch
npm run test:coverage
npx playwright install chromium   # once per machine, before E2E
npm run e2e
npm run build
```

Frontend testing conventions: [docs/workflows/frontend-testing.md](./docs/workflows/frontend-testing.md).

## Documentation

| Path | Purpose |
| --- | --- |
| [`docs/README.md`](./docs/README.md) | Documentation map and source-of-truth hierarchy |
| [`docs/00-project-spec.md`](./docs/00-project-spec.md) | Project identity, goals, and constraints |
| [`docs/01-product-requirements.md`](./docs/01-product-requirements.md) | Product behavior |
| [`docs/architecture/`](./docs/architecture/) | System structure |
| [`docs/contracts/`](./docs/contracts/) | API and data contracts |
| [`docs/tasks/`](./docs/tasks/) | Implementation task contracts |
| [`docs/roadmap/`](./docs/roadmap/) | Sequencing |

Plane can mirror task metadata for project management. Git remains canonical for requirements,
architecture, ADRs, and task definitions.

## License

Proprietary — all rights reserved.
