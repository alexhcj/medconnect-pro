# Infrastructure Architecture

## Local development (current)

Local work is the Next.js app in `apps/web` (mock-first environment files) and the NestJS API in
`apps/api` (`npm run dev:api`, port 3001). Install and run commands from the repository root. Copy
`apps/web/.env.example` to `.env.development` (gitignored). Copy `apps/api/.env.example` only if you
need API overrides. Do not commit secrets.

Local PostgreSQL is Docker Compose (`docker compose up -d` at the repository root). Apply schema
with `npm run migration:run` (uses `DATABASE_ADMIN_URL`, default table owner `medconnect`). Nest
runtime `DATABASE_URL` must be the non-owner role `medconnect_app` or RLS is bypassed. Demo
credentials in Compose and those URLs are not production secrets. Local Compose PostgreSQL is
**18** (`postgres:18-alpine`). Redis and SNS/SQS remain deferred. Notification email/SMS use
in-process demo adapters
([BE-008](../tasks/backend/BE-008-notification-domain.md)); do not add AWS SDKs for this slice.

See the root [README](../../README.md) for setup and validation commands.

M8 marketing site is in the repository (FE-017–FE-023). GitHub Actions **quality gates** exist
([INFRA-005](../tasks/infrastructure/INFRA-005-github-actions-ci-quality-gates.md)). Docker images,
preview environments, and AWS hosting remain **M9**
([INFRA-006](../tasks/infrastructure/INFRA-006-secrets-classification-and-aws-secret-retrieval.md)–[INFRA-013](../tasks/infrastructure/INFRA-013-v1.0.0-production-release-readiness.md)),
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

Quality gates: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) (INFRA-005). Triggers:
`pull_request`, `push` to `main`, and `workflow_dispatch`. One job `ci` on `ubuntu-latest`. Node
**24** from `.nvmrc`. Install from the repository root (`npm ci`). PostgreSQL **18**
(`postgres:18-alpine` service, same demo credentials as Compose). Schema before API tests:
`npm run migration:run`. Commands, in order:

1. `npm run lint` / `npm run lint:api`
2. `npm run type-check` / `npm run type-check:api`
3. `npm test` (web Vitest)
4. `npm run test:api` (API Vitest; requires the Postgres service)
5. `npm run build:production` / `npm run build:api`
6. `npm audit --omit=dev`

A failing lint, type-check, test, or build fails the workflow. Mark the `ci` check required on
`main` in GitHub branch protection so merge is fail-closed. Playwright mock e2e and `e2e:live` are
not in this workflow (`e2e:live` is [INFRA-013](../tasks/infrastructure/INFRA-013-v1.0.0-production-release-readiness.md)).
The workflow file contains no production secrets; Compose demo database credentials are not GitHub
Secrets.

Not in this workflow (later M9):

- Docker image build ([INFRA-008](../tasks/infrastructure/INFRA-008-nestjs-api-container-and-ecs-fargate.md))
- Preview deploy ([INFRA-010](../tasks/infrastructure/INFRA-010-preview-environment-and-pr-delivery.md))
- Production deploy and approval gate ([INFRA-011](../tasks/infrastructure/INFRA-011-production-delivery-workflow-and-rollback.md))

Keep deploy jobs in separate workflow files so this quality workflow never gains AWS credentials.

## Reliability

Infrastructure work continues throughout the project:

- backups;
- monitoring;
- scaling;
- observability;
- disaster recovery;
- security;
- cost optimization.
