# Deploy runbook (secrets, remote state, demo databases, ECS, and Amplify)

Operator steps for the Terraform root in [infra/terraform/](../../infra/terraform/) and Amplify
Hosting for `apps/web`. Catalog:
[environment-configuration.md](../contracts/environment-configuration.md).
ECS/Fargate: [INFRA-008](../tasks/infrastructure/INFRA-008-nestjs-api-container-and-ecs-fargate.md).
Amplify: [INFRA-009](../tasks/infrastructure/INFRA-009-aws-amplify-hosting-for-nextjs.md).
PR previews: [INFRA-010](../tasks/infrastructure/INFRA-010-preview-environment-and-pr-delivery.md).
Production ECS delivery and rollback: [INFRA-011](../tasks/infrastructure/INFRA-011-production-delivery-workflow-and-rollback.md).

Quality CI never assumes AWS roles. `terraform apply` is local (or a later deploy workflow).
Do not commit `*.tfstate`, `*.tfvars`, or `backend.hcl`.

All three databases (local Compose, preview/demo RDS, production/demo RDS) hold **synthetic/demo
data only**. Never load real PHI.

## Apply and remote state

Requires an AWS account and permission to create IAM, Secrets Manager, VPC, RDS, EC2, S3,
DynamoDB, ECS, ECR, ELB, CloudFront, CloudWatch, and Amplify Hosting resources. Copy [infra/terraform/terraform.tfvars.example](../../infra/terraform/terraform.tfvars.example)
to `infra/terraform/terraform.tfvars` (gitignored). Set `github_repository` to the GitHub
`OWNER/REPO` that matches `git remote get-url origin` (no `.git` suffix).

If this account already has a GitHub OIDC provider, import it instead of creating a second one:

```bash
terraform import aws_iam_openid_connect_provider.github \
  arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com
```

### First apply (local state)

Creates the state bucket, lock table, VPC, NAT, RDS instances, bastion, secret containers, ECR,
document buckets, ALBs, CloudFront distributions, and ECS services.

```bash
cd infra/terraform
terraform init -backend=false
terraform plan
terraform apply
```

Copy [infra/terraform/backend.hcl.example](../../infra/terraform/backend.hcl.example) to
`backend.hcl`. Set `bucket` to the `terraform_state_bucket` output
(`medconnect-terraform-state-<ACCOUNT_ID>`). Then migrate:

```bash
terraform init -backend-config=backend.hcl -migrate-state
```

Subsequent applies use `terraform init -backend-config=backend.hcl` (no `-backend=false`).
Quality CI keeps `terraform init -backend=false`.

### Secret values after INFRA-006

If the account already applied the empty INFRA-006 secret versions, `lifecycle.ignore_changes`
on `secret_string` will not fill RDS URLs on a normal apply. Replace once:

```bash
terraform apply \
  -replace=aws_secretsmanager_secret_version.preview_api \
  -replace=aws_secretsmanager_secret_version.production_api
```

A first-time apply of this root writes hosted `DATABASE_*` URLs on create. Later password
rotation is CLI `put-secret-value`, not Terraform. Never copy Compose `medconnect` /
`medconnect_app` passwords into Secrets Manager. Never put SSM-tunnel `127.0.0.1` URLs into
the secrets; secrets must use the RDS hostname (`sslmode=require`).

## Three databases

| Name | Role | How it is reached |
| --- | --- | --- |
| local Compose `medconnect` | Developer and API tests | `docker compose up -d`; defaults in `DATABASE_*` |
| preview/demo RDS | Shared hosted preview | Private subnet; SSM tunnel for migrate/seed; preview ECS tasks |
| production/demo RDS | Hosted production | Same VPC, distinct instance, SG, secret, and ECS service |

Preview application configuration must not use the production secret or production RDS.
Production must not use preview or local URLs. Nest fail-closed rules reject Compose
credentials, localhost, identical runtime/owner URLs, and a runtime username other than
`medconnect_app` when `APP_ENV` is `preview` or `production`.

## First-init migrate and seed (preview, then production)

RDS is not publicly reachable (`0.0.0.0/0` is not allowed). Operator migrate/seed uses
Session Manager port forwarding through the SSM bastion, then the local Node toolchain.
Leave `APP_ENV` unset (local). Hosted fail-closed rejects `127.0.0.1` when `APP_ENV` is
`preview` or `production`.

Do **not** add AWS credentials to quality CI. After first-init, hosted migrate is an in-VPC
ECS `RunTask` from [`.github/workflows/production-deploy.yml`](../../.github/workflows/production-deploy.yml).
Operator migrate through the bastion remains valid for first-init, `ensure:app-role`, and seed.

1. Read outputs: `bastion_instance_id`, `preview_rds_address` or `production_rds_address`.
2. Read that environment’s secret (`medconnect/preview/api` or `medconnect/production/api`)
   for `DATABASE_ADMIN_URL` (owner) and `DATABASE_URL` (runtime). Copy the **password**
   from the runtime URL as `APP_ROLE_PASSWORD`. Do not log the secret.
3. Port-forward (use a local port that is not Compose `5432` if Postgres is running locally):

```bash
aws ssm start-session \
  --target <BASTION_INSTANCE_ID> \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters "host=<RDS_ADDRESS>,portNumber=5432,localPortNumber=15432"
```

4. Build a **tunnel** owner URL from the secret’s admin URL: same user/password/database,
   host `127.0.0.1`, port `15432`, keep `sslmode=require`. Set `RDS_TLS_SERVERNAME` to the
   RDS hostname so TLS verifies the certificate without `rejectUnauthorized: false`.

```bash
export DATABASE_ADMIN_URL='postgresql://medconnect:<OWNER_PASSWORD>@127.0.0.1:15432/medconnect?sslmode=require'
export RDS_TLS_SERVERNAME='<RDS_ADDRESS>'
export APP_ROLE_PASSWORD='<RUNTIME_PASSWORD_FROM_DATABASE_URL>'
```

5. Create or repair `medconnect_app` with the generated password **before** (or after)
   migrations. Migration `1760000000007` would otherwise create the role with the Compose
   password, which hosted Nest rejects:

```bash
npm run ensure:app-role
```

6. Apply schema to **this** instance only:

```bash
npm run migration:run
```

7. **First initialization only:** `npm run seed:mock-identity`. Fixtures are synthetic
   (`@synthetic.example`, Harbor Synthetic Practice). Re-running seed is find-or-create and
   must not invent a second identity model; it does refresh the live telehealth appointment
   window. Treat hosted seed as run-once unless you intend that refresh. Seeded PDF bytes
   write to `DOCUMENT_STORAGE_DIR` on the operator machine and are not the hosted object
   store. Hosted demo documents persist after you upload through the HTTPS API; seed metadata
   may 404 until re-uploaded.
8. Confirm Secrets Manager still has the RDS-hostname URLs, not the tunnel URL.
9. Repeat for production with that environment’s secret, RDS address, and admin URL.

`GET /ready` against that environment’s API (`preview_api_url` / `production_api_url`) is the
hosted health check after migrate, image push, and ECS tasks are running.

Runtime Nest must keep using `medconnect_app` (`DATABASE_URL`). Owner
`DATABASE_ADMIN_URL` is migrate/seed only. Pointing runtime at the owner bypasses RLS.

## API image and ECS

Quality CI builds `apps/api/Dockerfile` without AWS credentials. Push on `main` is
[`.github/workflows/api-image.yml`](../../.github/workflows/api-image.yml). Set GitHub Actions
repository variable `AWS_PRODUCTION_ROLE_ARN` to the `github_production_role_arn` Terraform
output (optional `AWS_REGION`, default `us-east-1`). Do not store long-lived AWS access keys.

If ECR has no image yet, first apply with `api_desired_count = 0` in `terraform.tfvars`, then:

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com
docker build -f apps/api/Dockerfile -t <ECR_REPOSITORY_URL>:latest .
docker push <ECR_REPOSITORY_URL>:latest
```

Set `api_desired_count = 1` and apply again. After that, `main` rolls both API services through
[`.github/workflows/production-deploy.yml`](../../.github/workflows/production-deploy.yml) (preview
ECS first, then production ECS behind the GitHub `production` environment). Do not bounce the
service by hand for routine image updates.

Inspect the task definition: `secrets` must use `valueFrom` JSON keys
(`…:DATABASE_URL::`, `…:DATABASE_ADMIN_URL::`), not plaintext passwords. Preview and production
must not share secrets, RDS security groups, or document buckets.

Verify:

```bash
curl -fsS "$PREVIEW_API_URL/health"
curl -fsS "$PREVIEW_API_URL/ready"
curl -fsS "$PRODUCTION_API_URL/health"
curl -fsS "$PRODUCTION_API_URL/ready"
```

Login with a seeded demo user uses the existing opaque bearer against that HTTPS origin. Browser
CORS for production waits on the exact Amplify origin in `production_web_origins` (see Amplify
below). Preview keeps `https://*.amplifyapp.com` so PR hosts can call the preview API only.

## Rotate `DATABASE_URL` / `DATABASE_ADMIN_URL`

1. Put the new connection strings into the environment’s secret only
   (`medconnect/preview/api` or `medconnect/production/api` JSON keys). Do not put values in Git,
   Docker images, Amplify, or GitHub Secrets.
2. `ALTER ROLE` (or RDS master password) to match. Re-run `ensure:app-role` through the tunnel
   if only the app role password changed.
3. Replace or bounce the ECS tasks so they fetch the new secret version.
4. Retire the old password on the database.

Terraform ignores `secret_string` changes (`lifecycle.ignore_changes`) so rotation does not
require a Terraform apply.

GitHub OIDC role ARNs, ECR repository URL, HTTPS API URLs, document bucket names, secret-read
policy ARNs, and API security group IDs are Terraform outputs for operators and for the
production deploy workflow. Preview frontend publish is Amplify-native; it does not assume the
GitHub preview OIDC role.

## Production ECS delivery (`main`)

[`.github/workflows/production-deploy.yml`](../../.github/workflows/production-deploy.yml) is the
only GitHub Action that updates ECS. It does **not** publish Amplify. Feature branches cannot
trigger it (`workflow_run` of quality CI on a `push` to `main`, plus `workflow_dispatch`).

Set GitHub Actions **repository variables** (not secrets):

| Variable | Value |
| --- | --- |
| `AWS_PRODUCTION_ROLE_ARN` | Terraform output `github_production_role_arn` |
| `PRODUCTION_API_URL` | Terraform output `production_api_url` |
| `AWS_REGION` | optional; default `us-east-1` |

Do not store `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY`. Re-apply Terraform so the production
OIDC role can register/run/update ECS (`iam:PassRole` only for the API execution/task roles) and
so both services use the deployment circuit breaker. ECS `task_definition` is ignored by later
Terraform applies so CI revisions are not reverted. After a Terraform change to task env
(`WEB_ORIGINS`, bucket name, and similar), either wait for the next `main` deploy (it copies the
latest family revision and swaps the image) or update the service to that new family revision by
hand.

### GitHub environment `production`

1. GitHub → Settings → Environments → New environment → name **`production`** (exact).
2. Required reviewers: at least one human. Do not invent a change-advisory board.
3. Deployment branches: selected branches, **`main` only**.
4. Do not add a `production` environment protection to quality CI or `api-image.yml`.

The preview ECS job does not use this environment so the shared preview API can roll without
waiting for production approval. The production ECS job `needs` a successful preview job on the
automatic path.

### What runs

1. Quality CI on `main` must succeed. A failing `ci` run does not start this workflow.
2. [`.github/workflows/api-image.yml`](../../.github/workflows/api-image.yml) may still push the
   SHA to ECR in parallel. The deploy script waits for `medconnect-api:$SHA` before migrating.
3. Preview: in-VPC migrate (`node apps/api/dist/persistence/run-migrations.js` on a RunTask
   **without** a container health check) then `update-service` for `preview-api`.
4. Human approval on environment `production`.
5. The same migrate + service update for `production-api`.
6. `GET $PRODUCTION_API_URL/health` and `GET $PRODUCTION_API_URL/ready`.

Success is those two API checks plus Amplify serving the production web build (Amplify Git, not
this workflow). Full smoke is [INFRA-013](../tasks/infrastructure/INFRA-013-v1.0.0-production-release-readiness.md).

### Failure behavior

| Event | Behavior |
| --- | --- |
| CI fails on a pull request | No advertised preview URL ([INFRA-010](../tasks/infrastructure/INFRA-010-preview-environment-and-pr-delivery.md)) |
| CI fails on `main` | Production deploy workflow does not run. ECR may still receive the SHA; ECS is not updated |
| Preview ECS migrate or deploy fails | Production job does not start; previous preview task definition remains |
| Production ECS deploy fails | Circuit breaker + `deployment_minimum_healthy_percent = 100` keep the previous revision; the job is red |
| Amplify `main` build fails | Last successful Hosting publish remains. Do not treat a green Amplify job as proof the API migrated |
| Database | Prefer a forward-fix migration on `main`. `undoLastMigration` only with `workflow_dispatch` and `confirm_migration_revert` |

### Rollback drill

Default rollback is the **previous ECS task definition**. Amplify rollback is console **Redeploy
this version** of the last good job, or revert the commit on `main`. Database rollback is a
forward-fix unless an operator explicitly confirms revert.

Rehearse without touching production:

1. Actions → **Production deploy** → Run workflow.
2. `action` = `dry-run`, `service` = `preview-api`, leave `confirm_migration_revert` unchecked.
3. Confirm the job log prints the current and previous task definition ARNs and **Dry run only**.

To roll preview ECS to the previous revision (still not production):

1. Same workflow dispatch: `action` = `rollback`, `service` = `preview-api`.
2. Optionally set `task_definition` to `medconnect-preview-api:<revision>`.
3. Check `confirm_migration_revert` only if you intend to undo the last TypeORM migration.

Production rollback uses `service` = `production-api` and waits for the `production` environment
approval.

## Amplify Hosting (`apps/web`)

Amplify Git integration is the **only** production web publisher. Do not add a GitHub Action that
also publishes Amplify. Build settings live in [amplify.yml](../../amplify.yml)
(repository root; npm workspace install from `/`, Next app in `apps/web`, SSR artifacts
`apps/web/.next`). The buildspec writes `NEXT_PUBLIC_USE_MOCKS`, `NEXT_PUBLIC_API_BASE_URL`, and
`API_BASE_URL` into `apps/web/.env.production` and fails if any is empty. Do not static-export.

Requires the GitHub AWS Amplify GitHub App on this repository and permission to create an
Amplify app. Custom domain is optional; default hostname is `*.amplifyapp.com`.

**Repository visibility:** Amplify Hosting compute (WEB_COMPUTE / SSR) cannot enable pull-request
previews on a **public** GitHub repository that has an IAM service role. Keep this repository
**private** (or another AWS-supported equivalent). Do not add a second frontend host.

Connect **only** `main` as an Amplify branch. Do not add feature branches as extra production
branches. PR previews are ephemeral and are deleted when the pull request closes.

### Create the production app

1. Amplify console → Create new app → GitHub → this repository → branch `main`.
2. Check **My app is a monorepo** and set the app path to `apps/web`. The console sets
   `AMPLIFY_MONOREPO_APP_ROOT=apps/web`.
3. Use Amplify Hosting **compute** (not Classic Next.js 11 SSR). Do not enable pull-request
   previews on this step.
4. Confirm the build image uses Node **24** (`nvm use 24` in `amplify.yml`; Live package
   updates may also pin Node.js 24). This matches [`.nvmrc`](../../.nvmrc).
5. Set environment variables using the two-layer strategy below. If this app already has
   production URLs as **all-branch** defaults from INFRA-009, move those values onto the `main`
   branch override **before** enabling PR previews.
6. Save and deploy. Wait for a green `main` build. Failed Amplify builds do not replace the
   last successful production publish (atomic Hosting deploy). Retry from the console
   (**Redeploy this version** / retry job). Do not force-push `main`.

If compute fails on Next.js 16 or on Turbopack `.next/node_modules` symlinks, **stop**. Do not
switch to `output: 'export'`. Do not silently downgrade Next.js. Escalate before changing the
Amplify build command.

### Environment variables (preview vs production)

Amplify PR previews inherit **all-branch** (app-level) environment variables, not the
destination branch’s overrides. Set:

| Scope | Variable | Value |
| --- | --- | --- |
| All branches (default) | `NEXT_PUBLIC_USE_MOCKS` | `false` |
| All branches (default) | `NEXT_PUBLIC_API_BASE_URL` | Terraform output `preview_api_url` |
| All branches (default) | `API_BASE_URL` | the same `preview_api_url` |
| `main` branch override | `NEXT_PUBLIC_USE_MOCKS` | `false` |
| `main` branch override | `NEXT_PUBLIC_API_BASE_URL` | Terraform output `production_api_url` |
| `main` branch override | `API_BASE_URL` | the same `production_api_url` |

Never put `DATABASE_URL`, `DATABASE_ADMIN_URL`, Secrets Manager ARNs, AWS access keys, or
`PLANE_API_KEY` in Amplify. Do not point `main` at `preview_api_url`. Do not point previews at
`production_api_url`.

### Enable pull-request previews

1. Confirm the GitHub repository is private (see visibility note above).
2. Amplify console → Hosting → Previews → select `main` → enable **Pull request previews**.
3. This app has no Amplify backend. If the console asks about a backend environment, point PRs
   at none / an existing environment. **Do not** create a per-PR Amplify backend, ECS service, or
   RDS instance. Frontend previews are PR-specific; the API and preview/demo database are
   **shared**. Concurrent PRs can overwrite that synthetic data. Never seed production identities
   into the preview database.
4. Set GitHub Actions repository variable `AMPLIFY_APP_ID` to the Amplify app id (the hostname
   segment in `https://pr-<number>.<appId>.amplifyapp.com`). It is not a secret.
5. GitHub → Settings → Branches → protect `main`: require the `ci` status check. Optionally
   also require Amplify’s web-preview check (the exact check name is account-specific; confirm
   it on the first PR). Do not allow feature branches to skip these checks and publish
   production.
6. Open a pull request. Quality CI runs in GitHub Actions. Amplify may start a native preview
   build in parallel. [`.github/workflows/preview-status.yml`](../../.github/workflows/preview-status.yml)
   posts or updates the **project-advertised** review URL only after `ci` succeeds. A failed
   `ci` run must not get that green review comment. Treat Amplify’s own check as an extra
   signal, not as permission to skip CI.

Preview URL pattern: `https://pr-<number>.<appId>.amplifyapp.com`. Sign in with preview demo
credentials. Confirm the browser API host is `preview_api_url`. Confirm `main` Amplify env
still uses `production_api_url`.

### Production CORS after the first URL

The production API allowlist is exact origins only. After the first successful publish:

1. Copy the production Amplify origin (`https://<app>.amplifyapp.com`, or the custom domain if
   you attached one). Do not use `https://*.amplifyapp.com` on production.
2. Set `production_web_origins` in gitignored `infra/terraform/terraform.tfvars` (see
   [terraform.tfvars.example](../../infra/terraform/terraform.tfvars.example)).
3. `terraform apply` so the production ECS task `WEB_ORIGINS` matches that origin.
4. Confirm a browser on the Amplify origin can call the production API; a preview host must
   not. Preview CORS keeps `preview_web_origins = "https://*.amplifyapp.com"`.

Verify marketing `/` and `/login` over HTTPS, live login with a seeded demo user, and one
dashboard **list** page (patients). Network calls must go to the production API host. The
client bundle must not contain `DATABASE_URL` or AWS keys. Mock identity stays same-origin
`/login`; do not rewrite auth to cookies. Dashboard overview cards are still mock-only (no
live Nest `GET /dashboard/overview`).
