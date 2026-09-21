# Infrastructure Architecture

## Local development (current)

Until NestJS exists, local work is the Next.js app in `apps/web` with mock-first environment files.
Install and run commands from the repository root. Copy `apps/web/.env.example` to
`.env.development` (gitignored). Do not commit secrets.

Docker Compose, PostgreSQL, Redis, and GitHub Actions are **deferred**. Backend containers belong
with later backend/infrastructure tasks after [BE-001](../tasks/backend/BE-001-nestjs-core-platform-foundation.md).

See the root [README](../../README.md) for setup and validation commands.

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
- Secrets Manager / Parameter Store
- CloudWatch

EKS/Kubernetes is deferred until scale, team size or operational requirements justify it.

## Networking

- VPC
- public/private subnet separation
- security groups
- least-privilege IAM

## Environments

- development
- staging
- production

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
9. development deployment
10. staging deployment
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
