# Render public demo

Interim host for the synthetic demo ([ADR-017](../decisions/ADR-017-interim-render-demo.md),
[ADR-018](../decisions/ADR-018-render-marketing-static-site.md),
[INFRA-015](../tasks/infrastructure/INFRA-015-render-public-demo.md),
[INFRA-016](../tasks/infrastructure/INFRA-016-render-marketing-static-site.md)). AWS steps stay in
[deploy.md](deploy.md). This runbook does not create paid resources. The committed Blueprint
uses Render’s Free web services and one Free Postgres database.

Catalog: [environment-configuration.md](../contracts/environment-configuration.md).
Placeholders: `apps/api/.env.render.example`, `apps/web/.env.render.example`, and
`apps/marketing/.env.render.example`.

All data is synthetic. Never load real PHI. Never commit filled env files, `APP_ROLE_PASSWORD`,
or `RATE_LIMIT_KEY_SECRET`.

## What the Blueprint creates

[render.yaml](../../render.yaml), region Frankfurt:

| Service | Plan | Role |
| --- | --- | --- |
| `medconnect-web` | Free web | Next.js application. `/` redirects to `/login`. Browser calls `/mcp-api` on this origin. |
| `medconnect-marketing` | Static site | Public pages. No database and no application secrets. |
| `medconnect-api` | Free web | NestJS. Health check `/health`. |
| `medconnect-postgres` | Free Postgres 18 | One database. Render may suffix `databaseName`. Internal URL only after external access is cleared. |

Free web services sleep after about 15 minutes without inbound traffic and use an ephemeral disk.
Free Postgres expires 30 days after creation, then has a 14-day grace period before deletion. It
has no backups and is limited to one database per workspace. The database applied on 2026-10-14
expires on 2026-11-13. Upgrade it to a paid plan before that date to keep the data. The smallest
paid Postgres compute plan is about $6 per month, plus storage at about $0.30 per GB. A Starter
web service (`0.5c-512mb`) is about $7 per month and is still 512 MB of RAM. It removes spin-down.
It does not fix an out-of-memory failure; that needs a larger plan. Re-check
[Render pricing](https://render.com/pricing) before changing a plan. Hobby workspaces include 2
custom domains and 5 GB of outbound bandwidth; extra domains are about $0.25 per month and extra
bandwidth is about $0.15 per GB.

`APP_ENV=preview` on Render is this demo. It must not share a database with a future AWS preview
or production environment. Do not set `production` on Render.

The API service sets `NODE_ENV=production`, and Render exposes that during the build. `npm ci`
then skips devDependencies, including `@nestjs/cli`. The Blueprint build command is
`npm ci --include=dev && npm run build:api` so `nest build` can run. The start command still
launches `dist/main.js` and does not need the CLI.

## First apply

1. In the Render dashboard, create a Blueprint from this repository. Do not paste secrets into Git.
2. Confirm the API, application, and Postgres are in Frankfurt. The API reaches Postgres on the
   internal URL (`fromDatabase` `connectionString`). The static site is published from
   `apps/marketing/out` and has no `region`; Render rejects that field on a static site.
3. The committed Blueprint sets `SEED_ON_DEPLOY=false` so a later sync does not re-seed. On a
   brand-new database, set `SEED_ON_DEPLOY=true` for one deploy, then set it back to `false`.
   Free web services reject a pre-deploy command, so `scripts/infra/start-api.mjs` runs before
   Nest listens: derive `DATABASE_URL`, `ensure:app-role`, migrate the already-built `dist`, then
   seed only when the flag is true. It does not run `nest build` again and it does not print the
   URL or the password.
4. If `CREATE ROLE medconnect_app` fails, the process exits and the deploy fails. Do not point
   `DATABASE_URL` at the database owner. The owner bypasses row-level security.
5. `WEB_ORIGIN` is `https://medconnectpro.app`. `WEB_ORIGINS` is the application service’s
   `onrender.com` URL so that host keeps working until DNS cutover. `API_BASE_URL` comes from the
   API service URL. `NEXT_PUBLIC_API_BASE_URL` is the path `/mcp-api`.
6. Free services cannot run one-off jobs. Seed stays in the start command, gated by
   `SEED_ON_DEPLOY`. `/health` stays down until that command finishes.

## Custom domains

The Blueprint declares the hostnames. It does not buy the domain or write DNS. Render issues TLS
after the dashboard verifies the records. Leave each service’s `onrender.com` name enabled until
the apex certificate is live. Do not set a cookie `Domain` of `.medconnectpro.app`.

After `medconnectpro.app` is purchased:

- Apex: `A` record to `216.24.57.1`, or an `ALIAS` / `ANAME` / flattened `CNAME` to the
  application service’s `onrender.com` name. Remove `AAAA` records.
- `www`: `CNAME` to that same application service. Render redirects `www` to the apex. `www`
  cannot be the marketing site.
- `marketing`: `CNAME` to the static site’s `onrender.com` name.
- `api`: `CNAME` to the API service’s `onrender.com` name.

Then verify each name in the Render dashboard. Do not use a wildcard. Hobby includes two custom
domains; extra names are a small monthly charge. Confirm the count before expecting $0.

## Smoke

After the first deploy is live:

- `https://<web>/` redirects to `/login`, and `/login` shows the synthetic demo accounts.
- `https://<marketing>/` shows the public homepage. Its sign-in link is
  `https://medconnectpro.app/login` (or `http://localhost:3000/login` locally). The marketing
  response does not set `mcp_access`, `mcp_refresh`, `mcp_mfa`, or `mcp_csrf`.
- `https://<api>/health` returns `{"status":"ok"}`.
- `https://<api>/ready` returns ready after Postgres accepts a connection.
- `https://<api>/api/docs` does not serve Swagger UI.
- Sign in as `practice.admin@example.test`, reload, and open a patient list for Harbor Synthetic
  Practice. Session cookies stay on the application host.
- Change one synthetic record (mark a notification read, or record a demo payment) and confirm it
  succeeds.
- Upload a document in that same session and download it. The file is gone after the free API
  service sleeps, restarts, or redeploys. Seeded document bytes written during start are not
  on the service disk after the next spin-down.
- In the API logs, confirm the client address is the browser address you expect. `TRUST_PROXY=1`
  matches one Render hop. The proxy sends only the last `X-Forwarded-For` address that Render
  reported to the web service. If every user shares the web service address, the hop count is
  wrong; change the env var, and do not raise it above the real hop count.
- Watch the workspace free-instance hours. The pool is 750 hours per month and is shared with
  every free web service in the workspace. Sleeping services should stay inside it.
- If the Next.js service runs out of memory on 512 MB, move it to a plan with more than 512 MB.
  Starter is still 512 MB. It only removes spin-down.

Google OAuth and live Daily video are unavailable until those secrets are set in the Render
dashboard. Do not commit them. With no `OIDC_*` variables, the hosted adapter key is unavailable
Google. The public login hides the provider button and does not call `/auth/oauth/fake/start`.
A start for the unavailable Google key returns 503
`OAUTH_UNAVAILABLE`. Fake OIDC stays local-only. Unset `DAILY_API_KEY` keeps the Fake telehealth
adapter and the shell labels media unavailable. In-app notifications do not send email.

[M18](../roadmap/release-roadmap.md) is shipped interviewer readiness (closed at 0.91.0) on this same host. It does
not add services or domains. A portal patient can sign in, and Join visit opens an existing
session for that patient or an assigned nurse. The public login hides the provider button.
Render preview environments stay off. Per-PR review follows
[ADR-019](../decisions/ADR-019-render-pr-previews.md) and [delivery-lanes.md](delivery-lanes.md):
manual service previews for marketing and web only, web on frontend mocks, never this interviewer
database. The AWS target (M9) keeps INFRA-010: a frontend preview against one shared preview API
and database.

## After the first seed

The committed flag is already `SEED_ON_DEPLOY=false`. If a one-off seed deploy set it to `true`,
set it back to `false` and redeploy. Later starts migrate only. Seed remains find-or-create;
leaving the flag true refreshes the live telehealth appointment window and can overwrite
interviewer edits to seeded rows.

For an interview, sign in as a provider and schedule a telehealth visit whose start and end
include now. Do not set `SEED_ON_DEPLOY=true` for each interview. The seeded “Live demo
telehealth visit” is only inside the join window for about four hours after seed. Reseeding
refreshes that window and can overwrite interviewer edits.

Then clear the Postgres inbound IP allow list so the database has no public listener
(`render pg update medconnect-postgres --clear-ip-allow-list`, or the dashboard equivalent).
Internal connections from the API keep working.

## Backup and upgrade

Free Postgres has no platform backups. Before the 30-day expiry, either upgrade the same
database to a paid plan or export it.

To export, temporarily allow your current IP, then from a machine with PostgreSQL client tools:

```bash
pg_dump --dbname "<external URL with sslmode=require>" --format=custom --file=medconnect-render.dump
```

Do not print the URL. Remove the IP allow list entry when the dump finishes. Restore with
`pg_restore` into the upgraded database or a new one. Prefer upgrading the existing database so
the internal URL stays the same.

Suspending or deleting the Render services does not change the AWS Terraform. Deleting the Free
database deletes the synthetic data.

## Rollback

In the Render dashboard, roll back one service to the previous successful deploy. A marketing
rollback does not affect the application or API. Do not run `migration:revert` as part of an API
rollback. Migrations in this repository are forward-only for the demo. If a migrate fails, fix
the schema forward or restore the dump into a replacement database and point
`DATABASE_ADMIN_URL` at it.

## Local development

Local Compose, `APP_ENV=local`, and direct `http://localhost:3001` calls stay as they are.
`PUBLIC_API_PREFIX` is empty locally, so cookie paths stay `/` and `/auth`. The marketing site
runs with `npm run dev -w medconnect-marketing` on port 3002. Its sign-in links point at
`http://localhost:3000/login`.
