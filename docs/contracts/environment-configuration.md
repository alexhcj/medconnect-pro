# Environment configuration contract

Runtime configuration for `apps/web` and `apps/api`. This is not an OpenAPI schema and must not
duplicate generated API types.

Topology and environment names: [ADR-012](../decisions/ADR-012-deployment-topology.md).
Hosted secret retrieval (this catalog’s retrieval section, [INFRA-006](../tasks/infrastructure/INFRA-006-secrets-classification-and-aws-secret-retrieval.md)) extends these tables; it must not fork them.

## Environments

`APP_ENV` is `local` | `preview` | `production`. Unset `APP_ENV` is treated as `local`.

| `APP_ENV` | `NODE_ENV` | Frontend | API | Database |
| --- | --- | --- | --- | --- |
| `local` | `development` (tests: `test`) | localhost | localhost | Compose `medconnect` |
| `preview` | `production` | Amplify PR/branch preview | shared preview ECS | preview/demo RDS |
| `production` | `production` | Amplify `main` | production ECS | production/demo RDS |

Isolation:

- Local never requires cloud credentials.
- Preview never reads production secrets or the production database.
- Production never reads local or preview credentials.

All three databases are **synthetic/demo only**. Never introduce real PHI
([ADR-005](../decisions/ADR-005-synthetic-demo-data.md)).

Hosted processes receive configuration from the platform (ECS task env / Amplify). Nest
`ConfigModule` still loads only `.env.development` and `.env` for local overrides. Do not commit
real `.env`, `.env.preview`, or `.env.production` files.

## Classification

### Public (safe in the browser bundle)

| Variable | App | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_USE_MOCKS` | web | Hosted preview and production must be `false`. |
| `NEXT_PUBLIC_MOCK_DELAY` | web | Local mock timing only. |
| `NEXT_PUBLIC_MOCK_ERROR_RATE` | web | Local mock faults only. |
| `NEXT_PUBLIC_MOCK_LOG_LEVEL` | web | Local mock logging only. |
| `NEXT_PUBLIC_API_BASE_URL` | web | Environment-specific API origin. Public by design, not a secret. |

### Environment-specific (not secret)

| Variable | App | Notes |
| --- | --- | --- |
| `APP_ENV` | api | `local` \| `preview` \| `production`. Default `local`. |
| `NODE_ENV` | api, web | Preview and production keep `production`. |
| `PORT` | api | Default `3001`. |
| `SWAGGER_UI_ENABLED` | api | Optional. Defaults off when `NODE_ENV=production`. Production should set `false`. |
| `DOCUMENT_STORAGE_DIR` | api | Local filesystem adapter. Hosted object storage is INFRA-008. |
| `API_BASE_URL` | web | Server-only BFF proxy origin. Same classification as `NEXT_PUBLIC_API_BASE_URL`. |
| `WEB_ORIGIN` | api | Single CORS origin. Local default `http://localhost:3000`. |
| `WEB_ORIGINS` | api | Planned comma-separated allowlist for hosted CORS. Parser is INFRA-008. |

### Secret

| Variable | App | Notes |
| --- | --- | --- |
| `DATABASE_URL` | api | Runtime Nest role (`medconnect_app`). Subject to RLS. |
| `DATABASE_ADMIN_URL` | api | Table owner for migrations and seed. |

No JWT signing secret, payment processor key, or OAuth client secret exists in the application.
Do not invent them here. `NEXT_PUBLIC_*` must never hold `DATABASE_*` or AWS keys. Amplify
configuration is public frontend values only. The Amplify console must not hold `DATABASE_*`
values or Secrets Manager ARNs as frontend environment variables.

Plane `PLANE_API_KEY` is developer tooling, not application runtime, and must not be injected
into ECS or Amplify.

## Hosted retrieval

Local (`APP_ENV=local`) keeps using process env and optional gitignored `.env` files. Preview and
production do not bake secrets into Git, images, or Amplify.

### Secrets Manager

Runtime secrets live in AWS Secrets Manager JSON (not Parameter Store). Names are distinct;
preview IAM cannot read the production secret and production IAM cannot read the preview secret.

| Secret name | Environment | JSON keys |
| --- | --- | --- |
| `medconnect/preview/api` | preview | `DATABASE_URL`, `DATABASE_ADMIN_URL` |
| `medconnect/production/api` | production | `DATABASE_URL`, `DATABASE_ADMIN_URL` |

Terraform bootstrap: [infra/terraform/](../../infra/terraform/). Empty key values until
[INFRA-007](../tasks/infrastructure/INFRA-007-preview-and-production-demo-databases.md) writes
RDS URLs. Do not copy Compose `medconnect` / `medconnect_app` passwords into these secrets.

ECS ([INFRA-008](../tasks/infrastructure/INFRA-008-nestjs-api-container-and-ecs-fargate.md))
injects keys as process environment via the task definition `secrets` block, for example
`valueFrom` `arn:…:secret:medconnect/preview/api:DATABASE_URL::`. Nest `ConfigModule` still
reads env; the API does not call the Secrets Manager SDK.

Future session-signing material, if the application ever needs it, is a new key on the same
per-environment secret. Do not create that key now.

### Non-secret hosted configuration

`APP_ENV`, `NODE_ENV`, `PORT`, `WEB_ORIGIN` / `WEB_ORIGINS`, and `SWAGGER_UI_ENABLED` are ECS
task environment (plaintext), not Secrets Manager. Parameter Store is unused: a second store
is not simpler than task env.

Amplify receives only public frontend configuration (`NEXT_PUBLIC_*` and server `API_BASE_URL`
for that environment’s API origin). No database URLs. No Secrets Manager ARNs.

### AWS access and document storage

GitHub Actions authenticates to AWS with OIDC (IAM roles in the Terraform bootstrap). Do not
store `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` as GitHub Secrets for this purpose. Quality
CI ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)) stays free of AWS credentials;
deploy workflows ([INFRA-010](../tasks/infrastructure/INFRA-010-preview-environment-and-pr-delivery.md),
[INFRA-011](../tasks/infrastructure/INFRA-011-production-delivery-workflow-and-rollback.md))
assume the OIDC roles.

Hosted document-bucket access is the future ECS task role
([INFRA-008](../tasks/infrastructure/INFRA-008-nestjs-api-container-and-ecs-fargate.md)), not
static access keys.

`PLANE_API_KEY` stays in gitignored `scripts/plane/.env` only.

### API image contract

The API image ([INFRA-008](../tasks/infrastructure/INFRA-008-nestjs-api-container-and-ecs-fargate.md)
Dockerfile) must not declare `ENV` or `ARG` for `DATABASE_URL`, `DATABASE_ADMIN_URL`, AWS keys,
or any secret. Runtime configuration comes from the ECS task definition: plaintext for
environment-specific variables; Secrets Manager injection for `DATABASE_*`. Preview and
production images are identical except for injected env and secrets. See
[infrastructure-architecture.md](../architecture/infrastructure-architecture.md).

Rotation: [deploy.md](../workflows/deploy.md).

## Fail-closed hosted database URLs

When `APP_ENV` is `preview` or `production`, Nest refuses to boot if `DATABASE_URL` or
`DATABASE_ADMIN_URL` is missing/empty, or matches known local Compose credentials:

- exact Compose defaults (`postgresql://medconnect_app:medconnect_app@127.0.0.1:5432/medconnect`
  and `postgresql://medconnect:medconnect@127.0.0.1:5432/medconnect`, including `postgres://`);
- user/password `medconnect_app`/`medconnect_app` or `medconnect`/`medconnect`;
- host `127.0.0.1`, `localhost`, or `::1`.

When `APP_ENV` is `local`, those Compose URLs remain the documented local defaults.

## CORS contract

Implemented today: a single `WEB_ORIGIN` string (default `http://localhost:3000`) in
`apps/api`. Origin-list and preview-host **parser** implementation is
[INFRA-008](../tasks/infrastructure/INFRA-008-nestjs-api-container-and-ecs-fargate.md).

| `APP_ENV` | Allowed browser origins |
| --- | --- |
| `local` | `WEB_ORIGIN` default `http://localhost:3000` |
| `preview` | Preview Amplify origin allowlist and/or Amplify **preview** hostname pattern (`WEB_ORIGIN` / `WEB_ORIGINS`). Preview API only. |
| `production` | Exact production Amplify (or custom) origin only. No localhost. No preview hostname pattern. |

A preview frontend must not be configured with production API credentials. Production CORS must
not allow preview hosts, so a preview browser cannot call the production API.

Exact Amplify hostnames are operator-specific until INFRA-009. Document placeholders, not a
hardcoded `*.amplifyapp.com` on the production API (that pattern would also match previews).

## Examples

| File | Use |
| --- | --- |
| `apps/api/.env.example` | Local API overrides (`APP_ENV=local`) |
| `apps/api/.env.preview.example` | Preview placeholders |
| `apps/api/.env.production.example` | Production placeholders |
| `apps/web/.env.example` | Local web (mock-first) |
| `apps/web/.env.preview.example` | Preview web placeholders |
| `apps/web/.env.production.example` | Production web placeholders |
