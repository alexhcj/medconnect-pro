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
| `DOCUMENT_STORAGE_DIR` | api | Local filesystem adapter (`APP_ENV=local`). |
| `DOCUMENT_S3_BUCKET` | api | Hosted object-store bucket. Required when `APP_ENV` is preview or production. Not a secret; access is the ECS task role. |
| `API_BASE_URL` | web | Server-only BFF proxy origin. Same classification as `NEXT_PUBLIC_API_BASE_URL`. |
| `WEB_ORIGIN` | api | Single CORS origin. Local default `http://localhost:3000`. |
| `WEB_ORIGINS` | api | Comma-separated CORS allowlist. Unioned with `WEB_ORIGIN`. Preview may include `https://*.amplifyapp.com`. Production must be exact origins only. |
| `OIDC_PROVIDER` | api | Optional (BE-017). `google` or `fake`. Google is selected when issuer, client ID, secret, and redirect URI are all set. Fake is never selected when hosted. |
| `OIDC_ISSUER` | api | Provider issuer URL (e.g. `https://accounts.google.com`); validated against ID token `iss`. |
| `OIDC_CLIENT_ID` | api | Public client identifier; validated against ID token `aud`. |
| `OIDC_REDIRECT_URI` | api | Exact registered callback URL per environment (e.g. `http://localhost:3001/auth/oauth/google/callback`). |
| `OIDC_DEMO_EMAIL` | api | Optional. With `APP_ENV=local`, `seed:mock-identity` provisions this email as a practice admin so a real Google account can link, and the Fake adapter uses it as its default sign-in email. Ignored by the seed when hosted. |

### Secret

| Variable | App | Notes |
| --- | --- | --- |
| `DATABASE_URL` | api | Runtime Nest role (`medconnect_app`). Subject to RLS. |
| `DATABASE_ADMIN_URL` | api | Table owner for migrations and seed. |
| `DAILY_API_KEY` | api | Daily REST key for media-token minting. Unset selects the Fake adapter. Never `NEXT_PUBLIC_*`. Not in the current Secrets Manager JSON (hosted injection is M9, paused). |
| `OIDC_CLIENT_SECRET` | api | Optional (BE-017, [ADR-014](../decisions/ADR-014-oidc-bff-and-external-identity.md)). Confidential OIDC client secret. Unset selects the Fake OIDC adapter (`APP_ENV=local` / tests only); hosted without it, OAuth start returns 503 `OAUTH_UNAVAILABLE`. Never `NEXT_PUBLIC_*`. Hosted Secrets Manager injection is M9 / later. |

No JWT signing secret or payment processor key exists in the application. Do not invent those
here. `DAILY_API_KEY` and `OIDC_CLIENT_SECRET` are the only third-party secrets in this catalog.
`NEXT_PUBLIC_*` must never hold `DATABASE_*`, `DAILY_API_KEY`, `OIDC_CLIENT_SECRET`, or AWS keys.
Amplify configuration is public frontend values only. The Amplify console must not hold
`DATABASE_*` values, `DAILY_API_KEY`, `OIDC_CLIENT_SECRET`, or Secrets Manager ARNs as frontend
environment variables.

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

Terraform root: [infra/terraform/](../../infra/terraform/). Hosted `DATABASE_*` URLs are
written at RDS provision
([INFRA-007](../tasks/infrastructure/INFRA-007-preview-and-production-demo-databases.md)).
Do not copy Compose `medconnect` / `medconnect_app` passwords into these secrets. Do not
store SSM-tunnel localhost URLs in Secrets Manager.

ECS ([INFRA-008](../tasks/infrastructure/INFRA-008-nestjs-api-container-and-ecs-fargate.md))
injects keys as process environment via the task definition `secrets` block, for example
`valueFrom` `arn:…:secret:medconnect/preview/api:DATABASE_URL::`. Nest `ConfigModule` still
reads env; the API does not call the Secrets Manager SDK.

Future session-signing material, if the application ever needs it, is a new key on the same
per-environment secret. Do not create that key now.

### Non-secret hosted configuration

`APP_ENV`, `NODE_ENV`, `PORT`, `WEB_ORIGIN` / `WEB_ORIGINS`, `SWAGGER_UI_ENABLED`, and
`DOCUMENT_S3_BUCKET` are ECS task environment (plaintext), not Secrets Manager. Parameter Store
is unused: a second store is not simpler than task env.

Amplify receives only public frontend configuration (`NEXT_PUBLIC_*` and server `API_BASE_URL`
for that environment’s API origin). No database URLs. No Secrets Manager ARNs. PR previews
inherit **all-branch** Amplify variables (set those to `preview_api_url`). Override `main` with
`production_api_url`. See [deploy.md](../workflows/deploy.md).

### AWS access and document storage

GitHub Actions authenticates to AWS with OIDC (IAM roles in the Terraform bootstrap). Do not
store `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` as GitHub Secrets for this purpose. Quality
CI ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)) stays free of AWS credentials;
image push on `main` ([`.github/workflows/api-image.yml`](../../.github/workflows/api-image.yml))
and [`.github/workflows/production-deploy.yml`](../../.github/workflows/production-deploy.yml)
assume the OIDC roles. Preview URL comments
([`.github/workflows/preview-status.yml`](../../.github/workflows/preview-status.yml)) do not
assume those roles; Amplify Git owns frontend publish.

Hosted document-bucket access is the ECS task role (preview task cannot write the production
bucket and the reverse), not static access keys.

`PLANE_API_KEY` stays in gitignored `scripts/plane/.env` only.

### API image contract

The API image ([apps/api/Dockerfile](../../apps/api/Dockerfile)) must not declare `ENV` or
`ARG` for `DATABASE_URL`, `DATABASE_ADMIN_URL`, AWS keys, or any secret. Runtime configuration
comes from the ECS task definition: plaintext for environment-specific variables; Secrets
Manager injection for `DATABASE_*`. Preview and production images are identical except for
injected env and secrets. See
[infrastructure-architecture.md](../architecture/infrastructure-architecture.md).

Rotation: [deploy.md](../workflows/deploy.md).

## Fail-closed hosted database URLs

When `APP_ENV` is `preview` or `production`, Nest refuses to boot if `DATABASE_URL` or
`DATABASE_ADMIN_URL` is missing/empty, or matches known local Compose credentials:

- exact Compose defaults (`postgresql://medconnect_app:medconnect_app@127.0.0.1:5432/medconnect`
  and `postgresql://medconnect:medconnect@127.0.0.1:5432/medconnect`, including `postgres://`);
- user/password `medconnect_app`/`medconnect_app` or `medconnect`/`medconnect`;
- host `127.0.0.1`, `localhost`, or `::1`.

It also refuses when `DATABASE_URL` equals `DATABASE_ADMIN_URL`, when the runtime username is
not `medconnect_app`, or when the admin URL uses the `medconnect_app` role. Preview versus
production host isolation is distinct Secrets Manager names and IAM, not a hardcoded hostname
list.

When `APP_ENV` is `local`, those Compose URLs remain the documented local defaults. Operator
migrate through an SSM tunnel must leave `APP_ENV` unset so localhost fail-closed does not
reject the forwarded port. Optional `RDS_TLS_SERVERNAME` (the RDS hostname) lets TypeORM/`pg`
verify TLS while the TCP target is `127.0.0.1`.

## CORS contract

`apps/api` unions `WEB_ORIGIN` and comma-separated `WEB_ORIGINS`. Production refuses to boot if
any entry is localhost or a wildcard / Amplify preview hostname pattern. Preview may include
the token `https://*.amplifyapp.com` so Amplify PR hosts can call the **preview** API only.

| `APP_ENV` | Allowed browser origins |
| --- | --- |
| `local` | `WEB_ORIGIN` default `http://localhost:3000` |
| `preview` | Preview Amplify origin allowlist and/or Amplify **preview** hostname pattern (`WEB_ORIGIN` / `WEB_ORIGINS`). Preview API only. |
| `production` | Exact production Amplify (or custom) origin only. No localhost. No preview hostname pattern. |

A preview frontend must not be configured with production API credentials. Production CORS must
not allow preview hosts, so a preview browser cannot call the production API.

Exact Amplify hostnames are operator-specific. After the first production Amplify publish, set
`production_web_origins` to that exact origin ([deploy.md](../workflows/deploy.md)). Do not put
a hardcoded `*.amplifyapp.com` on the production API (that pattern would also match previews).

## Examples

| File | Use |
| --- | --- |
| `apps/api/.env.example` | Local API overrides (`APP_ENV=local`) |
| `apps/api/.env.preview.example` | Preview placeholders |
| `apps/api/.env.production.example` | Production placeholders |
| `apps/web/.env.example` | Local web (mock-first) |
| `apps/web/.env.preview.example` | Preview web placeholders |
| `apps/web/.env.production.example` | Production web placeholders |
