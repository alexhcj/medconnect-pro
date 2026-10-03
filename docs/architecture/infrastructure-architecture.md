# Infrastructure Architecture

## Local development (current)

Local work is the Next.js app in `apps/web` (mock-first environment files) and the NestJS API in
`apps/api` (`npm run dev:api`, port 3001). Install and run commands from the repository root. Copy
`apps/web/.env.example` to `.env.development` (gitignored). Copy `apps/api/.env.example` only if you
need API overrides. Do not commit secrets.

Local PostgreSQL is Docker Compose (`docker compose up -d` at the repository root). Apply schema
with `npm run migration:run` (uses `DATABASE_ADMIN_URL`, default table owner `medconnect`). Nest
runtime `DATABASE_URL` must be the non-owner role `medconnect_app` or RLS is bypassed. Demo
credentials in Compose and those URLs are not production secrets. Redis, SNS/SQS, and GitHub
Actions remain deferred. Notification email/SMS use in-process demo adapters
([BE-008](../tasks/backend/BE-008-notification-domain.md)); do not add AWS SDKs for this slice.

See the root [README](../../README.md) for setup and validation commands.

M8 marketing site is in the repository (FE-017–FE-023). Docker images, GitHub Actions, preview
environments, and AWS remain this target architecture and are **M9**
([INFRA-004](../tasks/infrastructure/INFRA-004-environment-separation-and-configuration-contract.md)–[INFRA-013](../tasks/infrastructure/INFRA-013-v1.0.0-production-release-readiness.md)),
not M8. Topology is [ADR-012](../decisions/ADR-012-deployment-topology.md): Amplify for Next.js,
ECS/Fargate for NestJS, environments `local` / `preview` / `production`.

## Target

AWS.

## Initial runtime

- Docker
- ECS
- Fargate
- RDS PostgreSQL
- ElastiCache Redis
- S3
- KMS
- SNS / SQS (notification fan-out and durable delivery; local Nest `DeliveryBus` until then)
- Secrets Manager / Parameter Store
- CloudWatch

EKS/Kubernetes is deferred until scale, team size or operational requirements justify it.
Per-PR ECS or RDS is out of scope ([ADR-012](../decisions/ADR-012-deployment-topology.md)).

## Networking

- VPC
- public/private subnet separation
- security groups
- least-privilege IAM

## Environments

`APP_ENV` is `local` | `preview` | `production`. Preview and production keep `NODE_ENV=production`.
Do not use development / staging / production as environment names.

- **local** — Next.js and Nest on the developer machine; Compose PostgreSQL (`medconnect`). No
  cloud credentials required.
- **preview** — Amplify PR/branch frontend; one shared preview ECS API; one preview/demo RDS
  instance. Isolated from production secrets and the production database.
- **production** — Amplify `main`; one production ECS API; one production/demo RDS instance.
  Isolated from local and preview credentials.

The three databases are synthetic/demo only and must never contain real PHI
([ADR-005](../decisions/ADR-005-synthetic-demo-data.md)). Runtime configuration classification is
[environment-configuration.md](../contracts/environment-configuration.md).

## Databases

| Name | Role | Current provision |
| --- | --- | --- |
| local Compose `medconnect` | Developer and API tests | [docker-compose.yml](../../docker-compose.yml) |
| preview/demo | Shared hosted preview | Planned (INFRA-007) |
| production/demo | Hosted production | Planned (INFRA-007) |

## IaC

Terraform.

## CI/CD

GitHub Actions:

1. install
2. lint
3. type-check
4. unit tests
5. frontend build
6. backend build
7. Docker build
8. dependency/security scan
9. preview deployment (shared preview API + Amplify PR preview)
10. production deployment
11. production approval gate

## Reliability

Infrastructure work continues throughout the project:

- backups;
- monitoring;
- scaling;
- observability;
- disaster recovery;
- security;
- cost optimization.
