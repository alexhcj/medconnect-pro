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
([INFRA-005](../tasks/infrastructure/INFRA-005-github-actions-ci-quality-gates.md)). Secrets
classification, AWS secret retrieval, remote Terraform state, VPC, preview/production demo RDS,
the NestJS API image, ECS/Fargate hosting, Amplify Hosting for Next.js, and Amplify PR
previews exist
([INFRA-006](../tasks/infrastructure/INFRA-006-secrets-classification-and-aws-secret-retrieval.md)–[INFRA-011](../tasks/infrastructure/INFRA-011-production-delivery-workflow-and-rollback.md)).
The `v1.0.0` production-release gate remains **M9**
([INFRA-012](../tasks/infrastructure/INFRA-012-github-v1.0.0-release-notes-template.md)
shipped; [INFRA-014](../tasks/infrastructure/INFRA-014-aws-account-setup-and-hosted-first-apply.md)
pending, blocks [INFRA-013](../tasks/infrastructure/INFRA-013-v1.0.0-production-release-readiness.md);
INFRA-013 paused). M9 is **PAUSED / BLOCKED** — AWS account setup unavailable; it is **not
closed** and **not cancelled**. **M10** is shipped. **M11** is shipped (BE-014, FE-027, FE-028, BE-015,
FE-029, SEC-005). Next product module is **M12 — Telehealth Media Maturity** (no task IDs yet).
Topology is
[ADR-012](../decisions/ADR-012-deployment-topology.md): Amplify for Next.js, ECS/Fargate for
NestJS, environments `local` / `preview` / `production`. Operator apply and the Amplify GitHub
connection remain required
([INFRA-014](../tasks/infrastructure/INFRA-014-aws-account-setup-and-hosted-first-apply.md)).
Do not pull AWS work into M10.

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
- Secrets Manager (runtime `DATABASE_*`; Parameter Store unused)
- CloudWatch

EKS/Kubernetes is deferred until scale, team size or operational requirements justify it.
Per-PR ECS or RDS is out of scope ([ADR-012](../decisions/ADR-012-deployment-topology.md)).

## Networking

- VPC (one demo VPC; preview and production RDS isolated by security groups and secrets)
- public/private subnet separation with one NAT Gateway for private-subnet egress
- security groups (RDS is not reachable as public `0.0.0.0/0` Postgres; ALB HTTP is CloudFront-only)
- least-privilege IAM (ECS execution role reads that environment’s secret; task role is S3-only)
- SSM bastion for first-init migrate/seed port-forward. Routine hosted migrate is an in-VPC
  ECS `RunTask` from [INFRA-011](../tasks/infrastructure/INFRA-011-production-delivery-workflow-and-rollback.md)

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

## Hosted API

Preview and production each run one Fargate service in cluster `medconnect` (same image digest;
isolation is task env, secrets, security groups, RDS, and S3). Public HTTPS is CloudFront’s
default `*.cloudfront.net` hostname in front of an internet-facing ALB. The ALB listens on HTTP
and admits CloudFront’s origin-facing prefix list only — not a plaintext public API. Container
liveness is `GET /health`; ALB target-group health is `GET /ready`. Terraform outputs
`preview_api_url` and `production_api_url`.

## Hosted frontend

`apps/web` is AWS Amplify Hosting compute (SSR), Git-connected to `main`
([INFRA-009](../tasks/infrastructure/INFRA-009-aws-amplify-hosting-for-nextjs.md)). Install and
build run from the repository root ([amplify.yml](../../amplify.yml)). All-branch Amplify env
points at `preview_api_url`; the `main` branch override points only at `production_api_url`.
Failed builds do not replace the last successful publish. PR/branch frontend previews use the
Amplify-native preview feature and the **shared** preview ECS API and preview/demo database
([INFRA-010](../tasks/infrastructure/INFRA-010-preview-environment-and-pr-delivery.md)). Concurrent
PRs can overwrite that synthetic data. Console connect and `production_web_origins` apply:
[deploy.md](../workflows/deploy.md).

## Databases

| Name | Role | Current provision |
| --- | --- | --- |
| local Compose `medconnect` | Developer and API tests | [docker-compose.yml](../../docker-compose.yml) |
| preview/demo | Shared hosted preview | RDS PostgreSQL 18 in private subnets ([INFRA-007](../tasks/infrastructure/INFRA-007-preview-and-production-demo-databases.md)) |
| production/demo | Hosted production | Distinct RDS PostgreSQL 18 in private subnets ([INFRA-007](../tasks/infrastructure/INFRA-007-preview-and-production-demo-databases.md)) |

## IaC

Terraform root: [infra/terraform/](../../infra/terraform/). INFRA-006 bootstraps GitHub OIDC,
distinct preview/production Secrets Manager containers (`medconnect/preview/api`,
`medconnect/production/api`), and non-overlapping read policies. INFRA-007 adds encrypted
remote state (S3 AES-256 + DynamoDB lock), one VPC, two RDS PostgreSQL 18 demo instances
(AWS-managed encryption at rest, 7-day backups, `db.t4g.micro`), API security groups, and an
SSM bastion. INFRA-008 adds NAT, ECR `medconnect-api`, one ECS cluster with preview and
production Fargate services, ALB + CloudFront HTTPS, CloudWatch logs, and per-environment
document buckets (SSE-KMS with the AWS-managed S3 key). Amplify Hosting is Git-connected
([amplify.yml](../../amplify.yml)); it is not a Terraform resource. Apply is operator-run;
quality CI only formats and validates (`terraform init -backend=false`). Rotation, image
push, hosted migrate/seed, Amplify console connect, and `GET /ready`:
[deploy.md](../workflows/deploy.md).

## Secrets retrieval

Classification: [environment-configuration.md](../contracts/environment-configuration.md).

Preview and production `DATABASE_URL` / `DATABASE_ADMIN_URL` come from Secrets Manager JSON keys.
ECS injects them as task `secrets` (`valueFrom` `arn:…:DATABASE_URL::`) on the **execution**
role. Nest reads process env; do not add a Secrets Manager SDK to `apps/api`. Non-secret hosted
config (`APP_ENV`, `WEB_ORIGIN` / `WEB_ORIGINS`, `PORT`, `DOCUMENT_S3_BUCKET`, …) is ECS task
environment. Amplify holds public `NEXT_PUBLIC_*` (and `API_BASE_URL`) only — no database URLs,
no secret ARNs.

GitHub Actions authenticates to AWS with those OIDC roles. Do not store long-lived AWS access
keys as GitHub Secrets. Quality CI never assumes the roles. Image **push** on `main` uses
`.github/workflows/api-image.yml` and `medconnect-github-production`. ECS migrate and service
update use [`.github/workflows/production-deploy.yml`](../../.github/workflows/production-deploy.yml)
([INFRA-011](../tasks/infrastructure/INFRA-011-production-delivery-workflow-and-rollback.md)).

### API image contract

The API image is [apps/api/Dockerfile](../../apps/api/Dockerfile) (build context: repository
root). Preview and production use the same digest; only injected env and secrets differ.

- `apps/api/Dockerfile` must not declare `ENV` or `ARG` for `DATABASE_URL`, `DATABASE_ADMIN_URL`,
  AWS keys, or any secret.
- `.dockerignore` must exclude `.env*`, keys, and document blobs.
- Runtime configuration comes from the ECS task definition: plaintext for environment-specific
  variables; Secrets Manager injection for `DATABASE_*`.
- Hosted documents use `DOCUMENT_S3_BUCKET` and `@aws-sdk/client-s3` with the task role. Do not
  put AWS SDK clients in the web bundle.

## CI/CD

Quality gates: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) (INFRA-005). Triggers:
`pull_request`, `push` to `main`, and `workflow_dispatch`. Job `ci` on `ubuntu-latest` plus a
credential-free `api-image` Docker **build** (no ECR login). Node **24** from `.nvmrc`. Install
from the repository root (`npm ci`). PostgreSQL **18** (`postgres:18-alpine` service, same demo
credentials as Compose). Schema before API tests: `npm run migration:run`. Commands, in order:

1. `npm run ci:secrets` (tracked `.env`, AWS access-key material, Compose URLs in hosted/Terraform paths)
2. `npm run test:ci-secrets` / `npm run test:amplify-buildspec` / `npm run test:preview-delivery` / `npm run test:production-delivery` / `npm run test:ensure-app-role`
3. `terraform fmt -check` / `terraform init -backend=false` / `terraform validate` in `infra/terraform`
   (no AWS credentials)
4. `npm run lint` / `npm run lint:api`
5. `npm run type-check` / `npm run type-check:api`
6. `npm test` (web Vitest)
7. `npm run test:api` (API Vitest; requires the Postgres service)
8. `npm run build:production` / `npm run build:api`
9. `npm audit --omit=dev`

A failing lint, type-check, test, or build fails the workflow. Mark the `ci` check required on
`main` in GitHub branch protection so merge is fail-closed. Playwright mock e2e and `e2e:live` are
not in this workflow (`e2e:live` is [INFRA-013](../tasks/infrastructure/INFRA-013-v1.0.0-production-release-readiness.md)).
The quality workflow file contains no production secrets and no AWS credentials; Compose demo
database credentials are not GitHub Secrets. GitHub OIDC roles exist in Terraform for image push
and production deploy workflows only. Preview URL comments
([`.github/workflows/preview-status.yml`](../../.github/workflows/preview-status.yml)) do not assume
those roles.

Not in the quality workflow (separate files):

- Image **push** to ECR on `main` ([`.github/workflows/api-image.yml`](../../.github/workflows/api-image.yml))
- Amplify Git publish of `apps/web` from `main` ([INFRA-009](../tasks/infrastructure/INFRA-009-aws-amplify-hosting-for-nextjs.md); console-connected)
- Preview URL comment after CI ([`.github/workflows/preview-status.yml`](../../.github/workflows/preview-status.yml); Amplify-native PR previews)
- Production ECS migrate/deploy and GitHub environment approval ([`.github/workflows/production-deploy.yml`](../../.github/workflows/production-deploy.yml); [INFRA-011](../tasks/infrastructure/INFRA-011-production-delivery-workflow-and-rollback.md))

Keep deploy and push jobs in separate workflow files so this quality workflow never gains AWS
credentials.

## Reliability

Infrastructure work continues throughout the project:

- backups;
- monitoring;
- scaling;
- observability;
- disaster recovery;
- security;
- cost optimization.
