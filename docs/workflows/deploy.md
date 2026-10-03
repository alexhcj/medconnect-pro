# Deploy runbook (secrets bootstrap)

Operator steps for the INFRA-006 Terraform root. Catalog:
[environment-configuration.md](../contracts/environment-configuration.md). Database
provisioning is [INFRA-007](../tasks/infrastructure/INFRA-007-preview-and-production-demo-databases.md).
Production rollback is [INFRA-011](../tasks/infrastructure/INFRA-011-production-delivery-workflow-and-rollback.md).

Quality CI never assumes AWS roles. `terraform apply` is local (or a later deploy workflow).

## Apply the secrets bootstrap

Requires an AWS account and permission to create IAM OIDC providers, IAM roles/policies, and
Secrets Manager secrets. Copy [infra/terraform/terraform.tfvars.example](../../infra/terraform/terraform.tfvars.example)
to `infra/terraform/terraform.tfvars` (gitignored). Set `github_repository` to the GitHub
`OWNER/REPO` that matches `git remote get-url origin` (no `.git` suffix).

```bash
cd infra/terraform
terraform init
terraform plan
terraform apply
```

Backend is local state until INFRA-007 introduces remote state. Do not commit `*.tfstate` or
`*.tfvars`.

If apply fails because `token.actions.githubusercontent.com` already exists in the account:

```bash
terraform import aws_iam_openid_connect_provider.github \
  arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com
```

Then `terraform plan` / `terraform apply` again. Do not create a second GitHub OIDC provider.

Secret **values** stay empty until INFRA-007 writes hosted `DATABASE_*` URLs. Empty values fail
closed in Nest when `APP_ENV` is `preview` or `production`. Never copy Compose `medconnect` /
`medconnect_app` passwords into Secrets Manager.

## Rotate `DATABASE_URL` / `DATABASE_ADMIN_URL`

1. Put the new connection strings into the environment’s secret only
   (`medconnect/preview/api` or `medconnect/production/api` JSON keys). Do not put values in Git,
   Docker images, Amplify, or GitHub Secrets.
2. After ECS exists (INFRA-008), replace or bounce the tasks so they fetch the new version.
3. Retire the old password on the database.

Terraform ignores `secret_string` changes (`lifecycle.ignore_changes`) so rotation does not
require a Terraform apply.

GitHub OIDC role ARNs and secret-read policy ARNs are Terraform outputs for INFRA-008 (ECS task
role) and INFRA-010/INFRA-011 (deploy workflows).
