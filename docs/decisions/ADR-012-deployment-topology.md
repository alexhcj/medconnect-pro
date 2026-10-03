# ADR-012 — Deployment topology

## Status

Accepted

## Decision

MedConnect Pro deploys as two independently hosted applications with three named environments.

- **Frontend:** AWS Amplify Hosting for the Next.js app in `apps/web`.
- **API:** Amazon ECS on Fargate for the NestJS app in `apps/api`.
- **Environments:** `local` | `preview` | `production` (`APP_ENV`). Preview and production keep
  `NODE_ENV=production`.

| Environment | Frontend | API | Database |
| --- | --- | --- | --- |
| local | Next.js on localhost | Nest on localhost (`APP_ENV=local`) | Compose PostgreSQL (`medconnect`) |
| preview | Amplify PR/branch preview | One shared preview ECS service | One preview/demo RDS instance |
| production | Amplify `main` | One production ECS service | One production/demo RDS instance |

Preview uses **one shared** API and **one shared** preview/demo database. Production uses a
distinct API and production/demo database. There is no per-PR ECS service or per-PR database.
EKS/Kubernetes is out of scope.

The three databases are isolated from each other. Preview never reads production secrets or the
production database. Production never reads local or preview credentials. Local never requires
cloud credentials.

All three databases hold **synthetic/demo data only**. They must never contain real PHI
([ADR-005](ADR-005-synthetic-demo-data.md)). Runtime Nest uses `medconnect_app` on `DATABASE_URL`;
migrations and seed use table-owner `DATABASE_ADMIN_URL`
([ADR-010](ADR-010-postgresql-typeorm.md)).

The configuration contract (variable classification, fail-closed hosted `DATABASE_*` rules, CORS
origin list vs preview-host pattern) lives in
[environment-configuration.md](../contracts/environment-configuration.md). CORS **parser**
implementation is [INFRA-008](../tasks/infrastructure/INFRA-008-nestjs-api-container-and-ecs-fargate.md).
AWS provisioning, secret retrieval, and hosting are later M9 tasks; this decision only locks
topology and environment names.

## Rationale

Architecture previously named development / staging / production while the repository only had
local Compose. Hosted interviewer review needs a preview that cannot touch production data, without
the cost of a backend per pull request. Amplify PR previews plus one shared preview API match that
constraint. ECS/Fargate matches [ADR-001](ADR-001-modular-backend.md) (one Nest application, not
microservices).

## Consequences

- Docs and `APP_ENV` use local / preview / production, not development / staging / production.
- Later M9 tasks implement this topology; they must not introduce Kubernetes or a per-PR backend.
- Fail-closed hosted boot in `apps/api` rejects missing or Compose `DATABASE_*` URLs when
  `APP_ENV` is `preview` or `production`
  ([INFRA-004](../tasks/infrastructure/INFRA-004-environment-separation-and-configuration-contract.md)).
- Secret retrieval, RDS, ECS, Amplify, and CI deploy jobs remain INFRA-005–INFRA-011.
