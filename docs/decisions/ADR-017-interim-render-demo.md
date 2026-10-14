# ADR-017 — Interim Render public demo

## Status

Accepted

## Decision

While [ADR-012](ADR-012-deployment-topology.md) AWS hosting is paused, the synthetic public demo
may run on Render. This does not replace Amplify, ECS, RDS, or Terraform, and it does not close
M9.

- **Web:** one Render web service for `apps/web`, native Node 24.
- **API:** one Render web service for `apps/api`, native Node 24. The existing API image remains
  the ECS artifact.
- **Database:** one Render Postgres 18 database, separate from local Compose and from any future
  AWS preview or production database. The first Blueprint uses the Free plan so no paid resource
  is created without a later decision. Upgrade that database to a paid plan before it expires.
- **Environment name:** `APP_ENV=preview`. `production` stays reserved for the future AWS
  production demo.
- **Browser path:** the browser calls `/mcp-api` on the web origin. The Next.js route handler
  proxies to `API_BASE_URL`. `PUBLIC_API_PREFIX=/mcp-api` prefixes the access, refresh, and MFA
  cookie paths. The CSRF cookie stays on `/` so application pages can read it.
- **Documents:** `DOCUMENT_STORAGE_DRIVER=local` on Render. Unset driver still means `s3` when
  `APP_ENV` is preview or production, so AWS continues to require `DOCUMENT_S3_BUCKET`.
- **Runtime role:** `scripts/infra/start-api.mjs` derives `DATABASE_URL` for `medconnect_app`
  from `DATABASE_ADMIN_URL` and `APP_ROLE_PASSWORD`, then creates that role and migrates before
  Nest listens. Free web services cannot use a pre-deploy command. If `CREATE ROLE` fails, the
  process exits. The API must not use the owner URL.
- **Proxy hops:** `TRUST_PROXY=1` for Render’s edge. The proxy replaces `X-Forwarded-For` with
  the last address Render reported to the web service.

Redis, workers, object storage, and a persistent disk are not part of this demo. Uploaded
document bytes on a free web service do not survive spin-down, restart, or redeploy.

## Rationale

M9 cannot be applied until an AWS account is available. The application already runs as two Node
processes plus PostgreSQL, with rate limits and sessions in Postgres. Render can host that shape
without a second copy of the business logic. A same-origin proxy keeps session cookies first-party
on `onrender.com`, which is a public suffix.

## Consequences

- Railway, or another host, adds its own blueprint and secrets. It reuses this env contract.
- AWS preview, when it exists, must use a different database from the Render demo.
- Google OAuth and live Daily video stay unset until those credentials exist. Hosted OAuth start
  returns 503. Telehealth uses the Fake adapter.
- The demo is not a HIPAA-compliant or production system
  ([ADR-005](ADR-005-synthetic-demo-data.md)).
