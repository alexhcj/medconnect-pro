---
id: INFRA-015
type: task
area: infrastructure
feature: deployment
status: implemented
priority: high
estimate: 5
dependencies: [INFRA-004, INFRA-008]
related_adrs: [ADR-005, ADR-010, ADR-012, ADR-017]
related_docs:
  [
    infrastructure-architecture.md,
    ../workflows/deploy-render.md,
    ../contracts/environment-configuration.md,
    ../roadmap/release-roadmap.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: a93c0dd7-7eb8-47ec-82d4-6f5fc35dd9be
  identifier: MEDCONNECT-108
---

# INFRA-015 — Interim Render public demo

## Objective

Make the existing Next.js and NestJS applications deployable as a public synthetic-data demo on
Render without removing the AWS topology or weakening RLS, RBAC, CSRF, or rate limits.

## Context

M9 remains paused on AWS account setup. Redis is not used. Hosted boot previously required
`DOCUMENT_S3_BUCKET` whenever `APP_ENV` was preview or production. The browser called the API
origin directly, so a CSRF cookie set on another host could not be read by the login page.

## Scope

- Provider-neutral `DOCUMENT_STORAGE_DRIVER` (`local` default only when `APP_ENV=local`; hosted
  default remains `s3`).
- Same-origin `/mcp-api` proxy and `PUBLIC_API_PREFIX` cookie paths. The CSRF cookie stays on `/`.
- Derive the `medconnect_app` runtime URL from the owner URL and `APP_ROLE_PASSWORD`.
- Free-tier `render.yaml`, placeholder env examples, ADR-017, and the Render runbook.

## Out of scope

- Creating Render resources, paid plans, or a public URL
- Railway
- Editing `infra/terraform/` or the AWS workflows
- Persistent document disk, live Daily, Google OAuth credentials, Redis, workers
- Closing M9, INFRA-014, or INFRA-013

## Acceptance criteria

- Preview with `DOCUMENT_STORAGE_DRIVER=local` boots without an S3 bucket. Preview with the s3
  driver still requires `DOCUMENT_S3_BUCKET`.
- A relative `NEXT_PUBLIC_API_BASE_URL` is preserved. The proxy forwards status, body, and
  `Set-Cookie`.
- Access, refresh, and MFA cookie paths include `PUBLIC_API_PREFIX` when it is set. The CSRF path
  stays `/`.
- `deriveRuntimeDatabaseUrl` refuses an empty password and an owner URL that already uses
  `medconnect_app`, and its errors do not contain the URL or password.
- Local Compose defaults and the AWS env examples still apply when the new variables are unset.
- The runbook covers first seed, smoke, clearing public Postgres access, `pg_dump`, free-to-paid
  upgrade, and rollback without `migration:revert`.

## Completion

- Implemented in the repository at 0.85.0. Render services were provisioned after that note, on
  2026-10-14. [INFRA-016](INFRA-016-render-marketing-static-site.md) splits marketing onto its own
  static site and does not close M9.
- First-deploy checks that remain operator work: `CREATE ROLE` on the Render owner, a real client
  IP with `TRUST_PROXY=1`, free-instance hour burn, Next.js memory on 512 MB, and browser storage
  of the proxied `Set-Cookie`.
