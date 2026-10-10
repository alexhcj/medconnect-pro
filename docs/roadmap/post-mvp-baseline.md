# Post-MVP Baseline

Recorded after the whole-cycle audit of demo milestones M0–M7. Compare later milestone audits
against this file, not against the original “MVP then expansion” wording.

Canonical application version at this baseline: **0.44.0** (FE-016, 2026-09-27).

## Current position

M0–M8 in [release-roadmap.md](release-roadmap.md) are shipped in the repository. All 38 original
task files plus M8 (FE-017–FE-023) are `implemented` or `completed`. M8 marketing site shipped as
FE-017–FE-023 (0.45.0–0.51.1). Public copy must follow
[docs/product/](../product/README.md) and
[capability-matrix.md](../marketing/capability-matrix.md). Deployment and preview environments are
**M9**, **PAUSED / BLOCKED** — AWS account setup unavailable. Close audit found no missing task
IDs; M9 is **not closed** and **not cancelled**.
[INFRA-004](../tasks/infrastructure/INFRA-004-environment-separation-and-configuration-contract.md)–[INFRA-012](../tasks/infrastructure/INFRA-012-github-v1.0.0-release-notes-template.md)
are shipped; [INFRA-014](../tasks/infrastructure/INFRA-014-aws-account-setup-and-hosted-first-apply.md)
is pending and blocks [INFRA-013](../tasks/infrastructure/INFRA-013-v1.0.0-production-release-readiness.md),
which remains paused. **M10** is shipped (DATA-002, BE-011, FE-024, BE-012, FE-025,
BE-013, FE-026). **M11** is shipped (BE-014, FE-027, FE-028, BE-015, FE-029, SEC-005).
**M12 — Telehealth Media Maturity** is shipped
([BE-016](../tasks/backend/BE-016-telehealth-daily-media-token-http.md),
[FE-030](../tasks/frontend/FE-030-daily-media-session-shell.md)). **M13 — Billing / Payments UX**
is shipped ([FE-031](../tasks/frontend/FE-031-record-demo-payment.md),
[FE-032](../tasks/frontend/FE-032-claims-envelope-list.md)). Hosted Stripe/ACH, claims submission /
EDI 837, and invoice-create UI remain later. **M14 — OAuth / External Identity** is
shipped and **closed** at 0.77.0 (SEC-006, DATA-003, BE-017, FE-033). **M15 — API Protection
and Rate Limiting** is in progress: SEC-007, DATA-004, BE-018, BE-019, and BE-020 shipped; FE-034 pending. Local product work does not wait on AWS. Not part of M8.

## Actually complete

- Modular NestJS API in `apps/api` with generated OpenAPI
- PostgreSQL + TypeORM + RLS + synthetic `seed:mock-identity`
- Mock-first Next.js dashboard and live Nest mode (`dev:real` / `e2e:live`)
- Live integration: login/logout/refresh, patients, clinical lists, document list/download,
  appointments, telehealth session create/join/media-token/end plus Daily call-object media when
  `DAILY_API_KEY` is set (labeled unavailable otherwise; mock mode keeps placeholders), billing
  invoices, demo record-payment, labeled claims envelopes, admin users, role PATCH and assignment UI, admin audit, security-events HTTP and
  viewer, dashboard overview cards, in-app notification inbox
- Local Vitest (web + API), Playwright mock + live, API HTTP/RLS/authz-matrix/OpenAPI contract tests
- GitHub Actions quality gates on pull requests and `main` (INFRA-005)
- Secrets classification, GitHub OIDC, and Secrets Manager containers (INFRA-006; apply is operator-run)
- Preview/production demo RDS (INFRA-007; apply is operator-run)
- NestJS API image, ECS/Fargate, CloudFront HTTPS, and S3 document storage (INFRA-008; apply and
  image push are operator-run)
- Amplify Hosting for Next.js (`amplify.yml`, production from `main`; INFRA-009; console connect
  is operator-run)
- Amplify PR previews against the shared preview API (`preview-status.yml`; INFRA-010; console
  enablement is operator-run)
- Production ECS delivery and rollback (`production-deploy.yml`; INFRA-011; GitHub environment
  `production` and live `terraform apply` remain operator-run)
- GitHub `1.0.0` release-notes template (INFRA-012; INFRA-013 fills production evidence)

## Intentionally incomplete

Interviewer index for the remaining production and HIPAA-oriented gap:
[docs/security/](../security/README.md) and
[docs/compliance/](../compliance/hipaa-readiness.md). Cookie sessions, labeled mock MFA, and
security-events HTTP/UI are shipped **demo** surfaces, not remaining unshipped work.

- Production OAuth 2.0 / OIDC + PKCE ([ADR-003](../decisions/ADR-003-authentication.md))
- Socket.IO / application realtime; in-session chat, recording, and transcription
- Hosted Stripe/ACH and claims submission / EDI 837
- Hosted AWS first-apply (INFRA-014; blocks INFRA-013; M9 paused)
- `v1.0.0` production-release gate (INFRA-013; paused until INFRA-014)
- Redis, custom KMS hierarchy
- HIPAA certification

## Known non-defects

- Dual mock/live frontend is intentional.
- Frontend role/nav checks are UX only; Nest authorization is authoritative.
- Live dashboard overview UI calls Nest `GET /dashboard/overview` with the BE-009 bearer (FE-024).
  Mock mode still uses fixtures. M10 role assignment UI is shipped; do not treat it as a silent
  M0–M7 failure.
- Workspace package versions (`apps/web`, `apps/api`) may differ from the root version (ADR-007).

## Marketing claim rules

Do not describe mock identity as production OAuth, demo Daily media as production telehealth or
HIPAA-certified video, demo record-payment as hosted Stripe, labeled claims envelopes as EDI
submission, or local engineering patterns as HIPAA compliance. Public copy must follow
[00-project-spec.md](../00-project-spec.md), this baseline,
[docs/product/](../product/README.md), and
[capability-matrix.md](../marketing/capability-matrix.md).
