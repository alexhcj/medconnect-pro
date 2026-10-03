# Deploy runbook (secrets, remote state, and demo databases)

Operator steps for the Terraform root in [infra/terraform/](../../infra/terraform/).
Catalog: [environment-configuration.md](../contracts/environment-configuration.md).
ECS/Fargate is [INFRA-008](../tasks/infrastructure/INFRA-008-nestjs-api-container-and-ecs-fargate.md).
Production rollback is [INFRA-011](../tasks/infrastructure/INFRA-011-production-delivery-workflow-and-rollback.md).

Quality CI never assumes AWS roles. `terraform apply` is local (or a later deploy workflow).
Do not commit `*.tfstate`, `*.tfvars`, or `backend.hcl`.

All three databases (local Compose, preview/demo RDS, production/demo RDS) hold **synthetic/demo
data only**. Never load real PHI.

## Apply and remote state

Requires an AWS account and permission to create IAM, Secrets Manager, VPC, RDS, EC2, S3, and
DynamoDB resources. Copy [infra/terraform/terraform.tfvars.example](../../infra/terraform/terraform.tfvars.example)
to `infra/terraform/terraform.tfvars` (gitignored). Set `github_repository` to the GitHub
`OWNER/REPO` that matches `git remote get-url origin` (no `.git` suffix).

If this account already has a GitHub OIDC provider, import it instead of creating a second one:

```bash
terraform import aws_iam_openid_connect_provider.github \
  arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com
```

### First apply (local state)

Creates the state bucket, lock table, VPC, RDS instances, bastion, and secret containers.

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
| preview/demo RDS | Shared hosted preview | Private subnet; SSM tunnel for migrate/seed; ECS later |
| production/demo RDS | Hosted production | Same VPC, distinct instance, SG, and secret |

Preview application configuration must not use the production secret or production RDS.
Production must not use preview or local URLs. Nest fail-closed rules reject Compose
credentials, localhost, identical runtime/owner URLs, and a runtime username other than
`medconnect_app` when `APP_ENV` is `preview` or `production`.

## First-init migrate and seed (preview, then production)

RDS is not publicly reachable (`0.0.0.0/0` is not allowed). Operator migrate/seed uses
Session Manager port forwarding through the SSM bastion, then the local Node toolchain.
Leave `APP_ENV` unset (local). Hosted fail-closed rejects `127.0.0.1` when `APP_ENV` is
`preview` or `production`.

Do **not** add AWS credentials to quality CI. GitHub deploy-time `migration:run` waits for
INFRA-010 / INFRA-011 after ECS exists.

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
   store (S3 is INFRA-008).
8. Confirm Secrets Manager still has the RDS-hostname URLs, not the tunnel URL.
9. Repeat for production with that environment’s secret, RDS address, and admin URL.

After INFRA-008, `GET /ready` against that environment’s API is the hosted health check.
Until then, a successful `migration:run` against the tunneled admin URL is the check.

Runtime Nest must keep using `medconnect_app` (`DATABASE_URL`). Owner
`DATABASE_ADMIN_URL` is migrate/seed only. Pointing runtime at the owner bypasses RLS.

## Rotate `DATABASE_URL` / `DATABASE_ADMIN_URL`

1. Put the new connection strings into the environment’s secret only
   (`medconnect/preview/api` or `medconnect/production/api` JSON keys). Do not put values in Git,
   Docker images, Amplify, or GitHub Secrets.
2. `ALTER ROLE` (or RDS master password) to match. Re-run `ensure:app-role` through the tunnel
   if only the app role password changed.
3. After ECS exists (INFRA-008), replace or bounce the tasks so they fetch the new version.
4. Retire the old password on the database.

Terraform ignores `secret_string` changes (`lifecycle.ignore_changes`) so rotation does not
require a Terraform apply.

GitHub OIDC role ARNs, secret-read policy ARNs, and API security group IDs are Terraform
outputs for INFRA-008 (ECS task role / ENIs) and INFRA-010/INFRA-011 (deploy workflows).
