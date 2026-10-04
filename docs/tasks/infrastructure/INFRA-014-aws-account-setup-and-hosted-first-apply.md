---
id: INFRA-014
type: task
area: infrastructure
feature: deployment
status: pending
priority: high
estimate: 5
dependencies: [INFRA-004, INFRA-005, INFRA-006, INFRA-007, INFRA-008, INFRA-009, INFRA-010, INFRA-011]
related_adrs: [ADR-005, ADR-012]
related_docs:
  [
    infrastructure-architecture.md,
    ../workflows/deploy.md,
    ../contracts/environment-configuration.md,
    ../roadmap/release-roadmap.md,
    ../roadmap/post-mvp-baseline.md,
  ]
implementation:
  status: not_started
validation:
  responsive: false
  accessibility: false
  tests_required: false
plane:
  work_item_id: 01ded357-ff1f-444d-ae6b-38c10cdc4633
  identifier: MEDCONNECT-70
---

# INFRA-014 — AWS account setup and hosted first-apply

## Objective

Guide the owner through one sequenced AWS, GitHub, and Amplify first-apply so the M9 hosted
preview and production demo environments exist. Record non-secret evidence. Unblock
[INFRA-013](INFRA-013-v1.0.0-production-release-readiness.md). Do not tag `1.0.0`.

## Context

Why this task exists: INFRA-006–INFRA-011 shipped Terraform, workflows, and the Amplify
buildspec but left live apply and console connect as operator steps.
[INFRA-013](INFRA-013-v1.0.0-production-release-readiness.md) cannot honestly smoke production
until that happens. This task is the missing work item.

INFRA-013 stays pending and paused until this task records a successful first-apply.
Frontend, backend, and other product-feature work continues in parallel and is not blocked.

This is a portfolio/demo application containing synthetic data only. Do not claim HIPAA
compliance or suitability for real patient data. Do not claim a hosted production until
INFRA-013.

Cursor may prepare commands and record evidence. The owner executes AWS, GitHub, and Amplify
consoles.

## Scope

Ordered operator path. Detailed commands stay in
[docs/workflows/deploy.md](../../workflows/deploy.md); this task is the gate and evidence.

1. **Account prerequisites** — Select the demo AWS account. Configure the AWS CLI for
   `us-east-1`. Confirm IAM permission to create the resources listed in deploy.md (IAM,
   Secrets Manager, VPC, RDS, EC2, S3, DynamoDB, ECS, ECR, ELB, CloudFront, Amplify Hosting).
   Confirm GitHub admin on this repository. Confirm the repository is **private** (Amplify
   Hosting compute PR previews cannot use a public GitHub repository that has an IAM service
   role).
2. **Terraform first apply** — Copy
   [infra/terraform/terraform.tfvars.example](../../../infra/terraform/terraform.tfvars.example)
   to gitignored `infra/terraform/terraform.tfvars`. Set `github_repository` to the GitHub
   `OWNER/REPO` that matches `git remote get-url origin` (no `.git` suffix). Leave
   `api_desired_count = 0` until an image exists. `terraform init -backend=false`, then
   `plan`, then `apply`. Migrate remote state per deploy.md. If the account already has a
   GitHub OIDC provider, import it instead of creating a second one.
3. **Secrets** — If empty INFRA-006 secret versions already exist, one-time `-replace` of
   the preview and production secret versions. Never copy Compose `medconnect` /
   `medconnect_app` passwords into Secrets Manager. Never put SSM-tunnel `127.0.0.1` URLs
   into the secrets; secrets must use the RDS hostname (`sslmode=require`).
4. **First-init databases** — SSM bastion port-forward; `npm run ensure:app-role`;
   `npm run migration:run`; first-init `npm run seed:mock-identity` for **preview**, then
   **production**. Leave `APP_ENV` unset on the operator machine. Hosted fail-closed rejects
   `127.0.0.1` when `APP_ENV` is `preview` or `production`.
5. **First API image** — Push `apps/api` to ECR; set `api_desired_count = 1`; apply again.
   Confirm the task definition `secrets` use `valueFrom` JSON keys (`…:DATABASE_URL::`), not
   plaintext passwords.
6. **GitHub wiring** — Set repository variables `AWS_PRODUCTION_ROLE_ARN` and
   `PRODUCTION_API_URL` (optional `AWS_REGION`, default `us-east-1`). Create GitHub
   environment **`production`** with at least one required reviewer and deployment branches
   **`main` only**. Do not store `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY`.
7. **Amplify** — Install the GitHub AWS Amplify GitHub App. Connect **only** `main`. Check
   **My app is a monorepo** and set the app path to `apps/web`. Use Amplify Hosting compute
   (not Classic Next.js 11 SSR). Pin Node **24**. Two-layer env: all-branch defaults point at
   Terraform `preview_api_url`; `main` branch overrides point at `production_api_url`;
   `NEXT_PUBLIC_USE_MOCKS=false` in both. Wait for a green `main` build.
8. **Production CORS** — Copy the exact production Amplify origin into
   `production_web_origins` in gitignored `terraform.tfvars`. `terraform apply`. Never use
   `https://*.amplifyapp.com` on production. Preview keeps
   `preview_web_origins = "https://*.amplifyapp.com"`.
9. **PR previews** — Enable Amplify Pull request previews on `main`. Set GitHub Actions
   repository variable `AMPLIFY_APP_ID`. Protect `main` so the `ci` status check is required.
   Do not create a per-PR Amplify backend, ECS service, or RDS instance.
10. **Minimum live proof** — `GET /health` and `GET /ready` succeed on both API HTTPS URLs.
    Production Amplify `/` and `/login` load. Full dashboard/auth smoke, GitHub `1.0.0`
    notes, and the version bump remain INFRA-013.

A short “First-apply sequence” index at the top of deploy.md that links existing sections is
allowed. Do not duplicate the runbook.

## Out of scope

- Re-implementing INFRA-004–INFRA-012
- INFRA-013 (`1.0.0`, GitHub release fill, capability-matrix “hosted production”)
- OAuth 2.0 / OIDC cutover
- HIPAA assessment or certification
- Real PHI
- Live Daily / WebRTC, payments, Redis, SNS/SQS, custom KMS
- Custom domain (optional, not a blocker)
- AWS Organizations / Control Tower / landing-zone design
- Blocking FE / BE / marketing feature tasks
- Committing `*.tfstate`, `*.tfvars`, `backend.hcl`, or secret values
- Creating a Plane work item from this change

## Requirements

- Follow [ADR-005](../../decisions/ADR-005-synthetic-demo-data.md) and
  [ADR-012](../../decisions/ADR-012-deployment-topology.md) (`local` / `preview` /
  `production`).
- Preview must not use production secrets or the production RDS. Production must not use
  preview or Compose URLs.
- Runtime remains `medconnect_app` on `DATABASE_URL`. Owner `DATABASE_ADMIN_URL` is
  migrate/seed only.
- Secrets stay in Secrets Manager or operator environment. Never Git, images, Amplify, or
  GitHub Secrets.
- Quality CI stays credential-free.
- Completion stores **non-secret** evidence only (account alias, region, Amplify origin,
  CloudFront API URLs, workflow run IDs). No passwords, secret string values, or seed
  credentials.
- Synthetic/demo data only. Never introduce real PHI.

## Technical constraints

- Follow ADR-005 and ADR-012. Do not introduce Kubernetes or a per-PR backend.
- Do not enable Swagger UI in production unless an explicit demo exception is documented.
- Do not static-export `apps/web` or silently downgrade Next.js if Amplify compute fails.
- Do not claim HIPAA compliance.

## Acceptance criteria

- [ ] Demo AWS account is selected; operator can apply the Terraform root in `us-east-1`
- [ ] Terraform applied; remote state in the account’s state bucket; preview and production
      RDS, ECS services, secrets, and document buckets exist as distinct resources
- [ ] Preview and production databases migrated; synthetic seed present; no PHI
- [ ] Preview and production API `GET /health` and `GET /ready` succeed over HTTPS
- [ ] Amplify production app is Git-connected to `main` with two-layer API URLs;
      `NEXT_PUBLIC_USE_MOCKS=false`; no `DATABASE_*` in Amplify
- [ ] `production_web_origins` is the exact production Amplify origin; preview CORS remains
      `https://*.amplifyapp.com`
- [ ] GitHub environment `production` exists (`main` only, required reviewer); Actions
      variables set; no long-lived AWS keys
- [ ] Amplify PR previews enabled (repository private); `AMPLIFY_APP_ID` set; `main` requires
      `ci`
- [ ] Completion evidence recorded without secrets
- [ ] INFRA-013 remains unstarted for `1.0.0`; copy still does not claim hosted production or
      HIPAA compliance

## Dependencies

- Blocked by: INFRA-004 through INFRA-011 (shipped)
- Related: INFRA-012 (release-notes template; not required for first-apply), ADR-005,
  ADR-012, [deploy.md](../../workflows/deploy.md),
  [environment-configuration.md](../../contracts/environment-configuration.md)
- Unblocks: INFRA-013
- Does not block: FE / BE / SEC / QA product-feature tasks

## Validation

Execute against real AWS and GitHub, not localhost. Use the commands in deploy.md.

1. Confirm `github_repository` matches `git remote get-url origin` and the repository is
   private.
2. `terraform plan` then `apply`; remote state migrated; preview and production resources
   are distinct.
3. First-init migrate and seed preview, then production, through the SSM bastion. Confirm
   Secrets Manager still has RDS-hostname URLs, not the tunnel URL.
4. First image in ECR; ECS desired count 1; task secrets use `valueFrom` JSON keys.
5. `GET $PREVIEW_API_URL/health`, `/ready`, and the same on `$PRODUCTION_API_URL`.
6. Amplify `main` is green; all-branch env uses `preview_api_url`; `main` override uses
   `production_api_url`; no database URLs in Amplify.
7. Browser: production Amplify `/` and `/login` load over HTTPS.
8. GitHub environment `production` and Actions variables exist; no long-lived AWS keys.
9. Amplify PR previews enabled; `AMPLIFY_APP_ID` set; `main` requires `ci`.
10. Record non-secret evidence in Completion. Do not treat these health checks as INFRA-013
    production smoke.

If Amplify compute fails on Next.js 16 or on Turbopack `.next/node_modules` symlinks, **stop**.
Do not switch to `output: 'export'`. Do not silently downgrade Next.js.

## Documentation impact

- This task file and [docs/tasks/00-master-task-list.md](../00-master-task-list.md)
- INFRA-013 dependencies and pause note
- M9 current-position lines (release roadmap, post-MVP baseline, product / frontend /
  backend roadmaps, project spec, AGENTS.md, capability matrix)
- Optional first-apply sequence index in deploy.md (links only)

Writing this spec is not a version bump. Executing this task later is still not `1.0.0`
(that remains INFRA-013).

## Risks / considerations

- RDS, NAT, and CloudFront incur cost. A billing alarm is recommended, not an acceptance
  criterion.
- Re-running seed refreshes the live telehealth appointment window. Treat hosted seed as
  run-once unless that refresh is intended.
- A public GitHub repository blocks Amplify SSR PR previews. Make the repository private or
  document that the INFRA-010 console step cannot complete.
- First apply with `api_desired_count = 1` and an empty ECR repository will fail. Follow the
  zero-then-push path in deploy.md.
- Cursor cannot complete AWS, GitHub, or Amplify console steps; the owner must.
- Do not treat this task’s `/health` and `/ready` checks as INFRA-013 production smoke.

## Implementation notes

Suggested implementation order: after INFRA-012 (already shipped); immediately before
INFRA-013. Last M9 *operator* task; INFRA-013 remains the last M9 *release* task.

Do not bump to `1.0.0` here. Do not fill
[docs/releases/github-release-notes-template.md](../../releases/github-release-notes-template.md).

Product-feature development continues while this task is pending.

## Completion

- Implementation:
- Tests:
- PR:
- Notes: Pending operator first-apply. Do not claim HIPAA compliance.
