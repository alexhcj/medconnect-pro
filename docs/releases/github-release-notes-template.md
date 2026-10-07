# GitHub v1.0.0 release-notes template

Paste the body below into the GitHub Releases UI for MedConnect Pro **1.0.0**. This is a
product-story outline, not a Keep a Changelog dump.

[INFRA-013](../tasks/infrastructure/INFRA-013-v1.0.0-production-release-readiness.md) fills every
`[INFRA-013: …]` token after production smoke. Do not invent live URLs, SHAs, or “production is
up” evidence here. Do not put secrets, tokens, credentials, or real patient information in the
GitHub text. There is no CI job that publishes this release. This GitHub body may describe the
Amplify + ECS topology; public marketing must not say “hosted production” until INFRA-013
updates the capability matrix.

Suggested GitHub fields (fill at INFRA-013):

- Tag: `v1.0.0`
- Title: `MedConnect Pro 1.0.0`
- Target: `[INFRA-013: commit SHA on main]`
- Pre-release checkbox: `[INFRA-013: draft / pre-release / published]`

---

## Release overview

MedConnect Pro **1.0.0** is the first **hosted production demo** of the M0–M10 product plus M9
hosting (AWS Amplify for Next.js, ECS/Fargate for NestJS). It is a portfolio and interview
demonstration of healthcare-oriented SaaS engineering. It is **not** a deployed healthcare
service and is **not** HIPAA certified or HIPAA compliant.

- Version: `1.0.0` (root `package.json`; [ADR-007](../decisions/ADR-007-semantic-versioning.md))
- Date: `[INFRA-013: release date]`
- Tag: `[INFRA-013: git tag v1.0.0]`
- Commit: `[INFRA-013: commit SHA]`
- Production web: `[INFRA-013: production Amplify URL]`
- Production API: `[INFRA-013: production API base URL]`
- Operator apply/connect: `[INFRA-013: terraform apply, Amplify GitHub App, GitHub production environment]`

## Product / feature scope

Shipped demo milestones **M0–M8** and **M10**, plus **M9** hosting contracts and workflows:

- M0 — repository, docs, frontend shell, local Compose
- M1 — mock identity UI, roles, protected dashboard
- M2 — patient list / profile / create / edit (synthetic data)
- M3 — appointments and calendar
- M4 — clinical record foundation and audit model
- M5 — appointment-linked telehealth **session shell** (create / join / end; not live video)
- M6 — billing dashboard (invoice list/detail; payment and claims are labeled boundaries)
- M7 — practice/user administration and audit viewer
- M8 — public marketing site at `/`, `/platform`, `/platform/*`, `/security`, `/about`, `/demo`
  (FE-017–FE-023)
- M9 — `local` / `preview` / `production` topology, quality CI, secrets/OIDC, preview and
  production demo RDS, ECS/Fargate, Amplify Hosting, PR previews, production ECS delivery
- M10 — live Nest dashboard overview, in-app notification inbox/preferences, and practice role
  assignment (DATA-002, BE-011, FE-024, BE-012, FE-025, BE-013, FE-026)

Live Nest integration covers login/logout/refresh, patients, clinical lists, document
list/download, appointments, telehealth session create/join/end, billing invoices, admin users,
role assignment, admin audit, dashboard overview cards, and the in-app notification inbox.
Dual mock/live frontend is intentional.

Not in this release: production OAuth, live telehealth media, hosted payments, claims
submission, Redis, or HIPAA certification. See **Known limitations**.

## Frontend

- Next.js App Router in `apps/web` (React, TypeScript, TanStack Query, React Hook Form + Zod,
  Tailwind CSS, Headless UI)
- Mock-first local scripts plus `dev:real` / `e2e:live` against Nest
- Authenticated dashboard and public `(marketing)` route group
- Frontend role and nav checks are UX only; Nest authorization is authoritative
- `[INFRA-013: production Amplify URL and NEXT_PUBLIC_USE_MOCKS=false]`

## Backend

- Modular NestJS 12 API in `apps/api` (Node.js current LTS, TypeScript)
- Server-side authentication, RBAC, tenant isolation, resource authorization, and audit events
- One Nest application (not microservices)
- `[INFRA-013: production ECS service healthy]`

## API

- REST + generated OpenAPI (`npm run openapi:generate`; `apps/api/openapi/openapi.json`)
- Swagger UI (`/api/docs`) is optional and expected **off** in production-like deploys; hiding
  it is not a security control
- `[INFRA-013: Swagger UI disabled on production API]`

## Database

- PostgreSQL + TypeORM + row-level security on tenant-owned tables
- Three isolated databases, all **synthetic/demo only**: local Compose `medconnect`, one
  preview/demo RDS, one production/demo RDS
- Runtime role `medconnect_app` on `DATABASE_URL`; migrations/seed use table-owner
  `DATABASE_ADMIN_URL`
- `[INFRA-013: production/demo RDS migrated; synthetic seed present; no PHI]`

## Infrastructure

- Terraform root `infra/terraform/` (VPC, RDS, ECS/Fargate, CloudFront HTTPS, S3 documents,
  Secrets Manager, GitHub OIDC)
- Distinct secrets `medconnect/preview/api` and `medconnect/production/api`
- Quality CI never assumes AWS roles; live `terraform apply` is operator-run
- `[INFRA-013: AWS region / account alias only — never secret values]`

## Deployment

- GitHub Actions quality gates on pull requests and `main` (`.github/workflows/ci.yml`)
- Amplify Git is the **only** production web publisher (`amplify.yml`; `main` only)
- After quality CI on `main`, `.github/workflows/production-deploy.yml` migrates via in-VPC
  ECS `RunTask`, rolls the shared preview API, then production API behind the GitHub
  `production` environment
- Feature branches cannot publish production Amplify or production ECS
- `[INFRA-013: production-deploy.yml run URL / conclusion]`

## Environment separation

`APP_ENV` is `local` | `preview` | `production` ([ADR-012](../decisions/ADR-012-deployment-topology.md)).
Do not use development / staging / production as environment names. Preview and production keep
`NODE_ENV=production`.

| Environment | Frontend | API | Database |
| --- | --- | --- | --- |
| local | Next.js on localhost | Nest on localhost | Compose PostgreSQL |
| preview | Amplify PR/branch preview | One shared preview ECS service | One preview/demo RDS |
| production | Amplify `main` | One production ECS service | One production/demo RDS |

Preview uses **one shared** API and **one shared** preview/demo database. There is no per-PR
ECS service or per-PR database. Preview never reads production secrets or the production
database. Production never reads local or preview credentials. Local never requires cloud
credentials.

## Security

This release demonstrates healthcare-oriented engineering patterns. It is **not** a compliance
certification.

Implemented (demo): RBAC and resource-level authorization, tenant isolation including
PostgreSQL RLS, audit logging, document ACL, least-privilege database role, secrets outside
source control, GitHub OIDC (no long-lived AWS keys in CI when OIDC is used).

Frontend checks are not authorization. Do not trust a browser-supplied tenant id.

`[INFRA-013: client bundle has no database URLs or AWS keys; preview cannot read production secrets]`

## Authentication

Identity is a **mock IdP**: email/password, opaque bearer sessions, refresh-token rotation,
idle/absolute expiry, and a labeled mock MFA challenge on live `/login` (not production TOTP).

This is **not** production identity infrastructure. Production OAuth 2.0 / OpenID Connect
(Authorization Code + PKCE) and production MFA remain the target in
[ADR-003](../decisions/ADR-003-authentication.md) and are **not** in 1.0.0.

`[INFRA-013: seeded demo login works on production Amplify; still labeled mock identity]`

## Testing / QA

- Vitest + React Testing Library (web) and Vitest (API)
- Playwright mock (`e2e`) and live (`e2e:live`) critical workflows
- API HTTP, RLS, authorization-matrix, and OpenAPI contract tests
- GitHub Actions quality gates on pull requests and `main`

Production smoke is INFRA-013, not this template:

- `[INFRA-013: GET /health over HTTPS]`
- `[INFRA-013: GET /ready over HTTPS]`
- `[INFRA-013: one authorized domain GET with a demo bearer]`
- `[INFRA-013: browser smoke on /, /login, and one dashboard list]`

## UI / UX / design

- Authenticated dashboard (patients, calendar, clinical lists, telehealth session shell,
  billing invoices, admin users and audit)
- Public marketing site with the shared visual language from FE-018 (Figma as canonical visual
  source)
- Telehealth waiting-room and media controls are placeholders; billing payments/claims are
  labeled boundaries; dashboard overview cards are mock-only in live Nest mode
- No new design work is part of 1.0.0 itself

## Documentation

Canonical documentation is `/docs`. Start with:

- `docs/00-project-spec.md` — project identity and constraints
- `docs/product/` — statused capability catalog
- `docs/marketing/capability-matrix.md` — what public copy may claim
- `docs/roadmap/post-mvp-baseline.md` — shipped vs intentionally incomplete
- `docs/decisions/` — ADRs (synthetic data, versioning, auth target, deployment topology)
- `docs/workflows/release.md` and `docs/workflows/deploy.md` — release and operator runbooks
- `docs/contracts/environment-configuration.md` — public vs environment-specific vs secret

## Known limitations

- **Not HIPAA certified or HIPAA compliant.** Engineering patterns are not a formal assessment.
- **No live video.** Telehealth is an appointment-linked session shell (create/join/end,
  waiting-room placeholders). Daily / WebRTC media is not live.
- **No hosted payments or claims submission.** Invoices are synthetic demo data; payment and
  claims UI are labeled boundaries.
- **Shared preview API.** Amplify PR previews talk to one preview ECS API and one preview/demo
  database, not an isolated backend per pull request.
- **Mock identity, not production OAuth.**
- **No Redis, SNS/SQS, or custom KMS hierarchy** as live platform services.
- **Operator apply/connect** (Terraform, Amplify console, GitHub `production` environment)
  remains required until INFRA-013 records production as live.
- Notifications are an in-app inbox with mark-read and channel preferences (session user only);
  not push, SMS, or email carriers.
- Security-events HTTP is not shipped (M11).

## Demo-data / no-PHI statement

All data is **synthetic** ([ADR-005](../decisions/ADR-005-synthetic-demo-data.md)). Patient
names, addresses, dates of birth, identifiers, conditions, medications, appointments, invoices,
and audit fixtures are fictional.

Local Compose, preview/demo RDS, and production/demo RDS must **never** contain real PHI, real
credentials, or real clinical records. Do not seed production from a real practice export.

## Release verification

Fill during INFRA-013 against **production** URLs (not localhost, not preview):

- `[INFRA-013: production Amplify URL]`
- `[INFRA-013: production API URL]`
- `[INFRA-013: APP_ENV=production; CORS; mocks off]`
- `[INFRA-013: database migrated; synthetic demo accounts only]`
- `[INFRA-013: GET /health]`
- `[INFRA-013: GET /ready]`
- `[INFRA-013: one authorized API GET]`
- `[INFRA-013: browser /, /login, one dashboard list]`
- `[INFRA-013: Swagger UI off]`
- `[INFRA-013: no secrets in the client bundle]`
- `[INFRA-013: preview cannot read production secrets]`

Do not ship `1.0.0` if production smoke fails. Keep the 0.x version until the gate passes.

## Rollback considerations

Documented in `docs/workflows/deploy.md` (INFRA-011). Summary:

- **CI fails on a pull request** — no advertised preview URL
- **CI fails on `main`** — no production ECS deploy
- **Preview ECS fails** — production job does not start; previous preview task definition remains
- **Production ECS fails** — previous production task definition remains (circuit breaker)
- **Amplify `main` fails** — last successful production web remains
- **API rollback** — previous ECS task definition (`workflow_dispatch` `action=rollback`)
- **Web rollback** — Amplify console Redeploy of the last good job, or revert the commit on `main`
- **Database** — prefer a forward-fix migration; `migration:revert` only with explicit
  `workflow_dispatch` confirmation

A green Amplify publish is not proof the API migrated. `[INFRA-013: confirm rollback path still usable]`

## Future work

- OAuth 2.0 / OpenID Connect with Authorization Code + PKCE, and production MFA
- Live Daily / WebRTC telehealth media, chat, recording, signaling
- Hosted payments, claims submission, EDI
- Notifications UI
- Dashboard analytics API (`GET /dashboard/overview`)
- Redis / ElastiCache; SNS/SQS durable notification delivery
- Custom KMS hierarchy
- Organizational HIPAA assessment (out of this demo; never implied by hosting going live)
