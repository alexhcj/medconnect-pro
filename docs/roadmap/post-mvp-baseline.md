# Post-MVP Baseline

Recorded after the whole-cycle audit of demo milestones M0–M7. Compare later milestone audits
against this file, not against the original “MVP then expansion” wording.

Canonical application version at this baseline: **0.44.0** (FE-016, 2026-09-27).

## Current position

M0–M8 in [release-roadmap.md](release-roadmap.md) are shipped in the repository. All 38 original
task files plus M8 (FE-017–FE-023) are `implemented` or `completed`. M8 marketing site shipped as
FE-017–FE-023 (0.45.0–0.51.1). Public copy must follow
[capability-matrix.md](../marketing/capability-matrix.md). Deployment and preview environments are
**M9**. [INFRA-004](../tasks/infrastructure/INFRA-004-environment-separation-and-configuration-contract.md)–[INFRA-007](../tasks/infrastructure/INFRA-007-preview-and-production-demo-databases.md)
are shipped; [INFRA-008](../tasks/infrastructure/INFRA-008-nestjs-api-container-and-ecs-fargate.md)–[INFRA-013](../tasks/infrastructure/INFRA-013-v1.0.0-production-release-readiness.md)
remain pending. Not part of M8.

## Actually complete

- Modular NestJS API in `apps/api` with generated OpenAPI
- PostgreSQL + TypeORM + RLS + synthetic `seed:mock-identity`
- Mock-first Next.js dashboard and live Nest mode (`dev:real` / `e2e:live`)
- Live integration: login/logout/refresh, patients, clinical lists, document list/download,
  appointments, telehealth session create/join/end, billing invoices, admin users, admin audit
- Local Vitest (web + API), Playwright mock + live, API HTTP/RLS/authz-matrix/OpenAPI contract tests
- GitHub Actions quality gates on pull requests and `main` (INFRA-005)
- Secrets classification, GitHub OIDC, and Secrets Manager containers (INFRA-006; apply is operator-run)

## Intentionally incomplete

- Production OAuth 2.0 / OIDC + PKCE ([ADR-003](../decisions/ADR-003-authentication.md))
- Live video / Daily / Socket.IO
- Payments, claims submission, role assignment HTTP, security-events HTTP
- Notifications UI; dashboard analytics API (`GET /dashboard/overview`)
- Cloud deploy (RDS, ECS, Amplify), Dockerfiles, Redis, S3, KMS
- HIPAA certification

## Known non-defects

- Dual mock/live frontend is intentional.
- Frontend role/nav checks are UX only; Nest authorization is authoritative.
- Live dashboard overview is **not** integrated (cookie BFF + missing Nest route). Treat that as
  frontend Slice 2 / deferred analytics, not as a silent M0–M7 failure.
- Workspace package versions (`apps/web`, `apps/api`) may differ from the root version (ADR-007).

## Marketing claim rules

Do not describe mock identity as production OAuth, telehealth session shell as live video, invoice
list as payments, or local engineering patterns as HIPAA compliance. Public copy must follow
[00-project-spec.md](../00-project-spec.md), this baseline, and
[capability-matrix.md](../marketing/capability-matrix.md).
