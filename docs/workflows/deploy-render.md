# Render public demo

Interim host for the synthetic demo ([ADR-017](../decisions/ADR-017-interim-render-demo.md),
[INFRA-015](../tasks/infrastructure/INFRA-015-render-public-demo.md)). AWS steps stay in
[deploy.md](deploy.md). This runbook does not create paid resources. The committed Blueprint
uses Render’s Free web services and one Free Postgres database.

Catalog: [environment-configuration.md](../contracts/environment-configuration.md).
Placeholders: `apps/api/.env.render.example` and `apps/web/.env.render.example`.

All data is synthetic. Never load real PHI. Never commit filled env files, `APP_ROLE_PASSWORD`,
or `RATE_LIMIT_KEY_SECRET`.

## What the Blueprint creates

[render.yaml](../../render.yaml), region Oregon:

| Service | Plan | Role |
| --- | --- | --- |
| `medconnect-web` | Free web | Next.js. Browser calls `/mcp-api` on this origin. |
| `medconnect-api` | Free web | NestJS. Health check `/health`. |
| `medconnect-postgres` | Free Postgres 18 | One database named `medconnect`. Internal URL only after external access is cleared. |

Free web services sleep after about 15 minutes without inbound traffic and use an ephemeral disk.
Free Postgres expires 30 days after creation, has no backups, and is limited to one database per
workspace. Upgrade it to a paid plan before that date to keep the data. A paid Postgres plan
around $6 per month plus storage is the documented upgrade. Two always-on Starter web services
are about $7 each if a cold start is unacceptable. Re-check [Render pricing](https://render.com/pricing)
before changing a plan.

`APP_ENV=preview` on Render is this demo. It must not share a database with a future AWS preview
or production environment.

## First apply

1. In the Render dashboard, create a Blueprint from this repository. Do not paste secrets into Git.
2. Confirm the three resources are in Oregon. The API reaches Postgres on the internal URL
   (`fromDatabase` `connectionString`).
3. The first sync sets `SEED_ON_DEPLOY=true`. Pre-deploy runs `ensure:app-role`, then
   `npm run migration:run`, then `npm run seed:mock-identity`.
4. If `CREATE ROLE medconnect_app` fails, stop. Do not point `DATABASE_URL` at the database owner.
   The owner bypasses row-level security.
5. If `WEB_ORIGIN` or `API_BASE_URL` is empty on the first sync, sync the Blueprint once more so
   the service URLs are filled. `NEXT_PUBLIC_API_BASE_URL` is the path `/mcp-api` and does not
   depend on those URLs.
6. Free services cannot run one-off jobs. Seed stays in pre-deploy, gated by `SEED_ON_DEPLOY`.

`scripts/infra/start-api.mjs` derives `DATABASE_URL` as `medconnect_app` when that variable is
unset. It does not print the URL or the password.

## Smoke

After the first deploy is live:

- `https://<web>/login` loads and shows the synthetic demo accounts.
- `https://<api>/health` returns `{"status":"ok"}`.
- `https://<api>/ready` returns ready after Postgres accepts a connection.
- `https://<api>/api/docs` does not serve Swagger UI.
- Sign in as `practice.admin@example.test`, reload, and open a patient list for Harbor Synthetic
  Practice.
- Change one synthetic record (mark a notification read, or record a demo payment) and confirm it
  succeeds.
- Upload a document in that same session and download it. The file is gone after the free API
  service sleeps, restarts, or redeploys. Seeded document bytes written during pre-deploy are not
  on the service disk.
- In the API logs, confirm the client address is the browser address you expect. `TRUST_PROXY=1`
  matches one Render hop. The proxy sends only the last `X-Forwarded-For` address that Render
  reported to the web service. If every user shares the web service address, the hop count is
  wrong; change the env var, and do not raise it above the real hop count.
- Watch the workspace free-instance hours. The pool is 750 hours per month. Sleeping services
  should stay inside it. If health checks keep both services awake, they will exceed the pool.
- If the Next.js service runs out of memory on 512 MB, move that service to the Starter plan.
  That is the only paid compute this demo should add for a memory failure.

Google OAuth and live Daily video are unavailable until those secrets are set in the Render
dashboard. Unset OAuth returns 503. Unset `DAILY_API_KEY` keeps the Fake telehealth adapter.
In-app notifications do not send email.

## After the first seed

Set `SEED_ON_DEPLOY=false` on `medconnect-api` and redeploy. Later pre-deploys migrate only.
Seed remains find-or-create; leaving the flag true refreshes the live telehealth appointment
window and can overwrite interviewer edits to seeded rows.

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

In the Render dashboard, roll back the web or API service to the previous successful deploy.
Do not run `migration:revert` as part of that rollback. Migrations in this repository are
forward-only for the demo. If a migrate fails, fix the schema forward or restore the dump into
a replacement database and point `DATABASE_ADMIN_URL` at it.

## Local development

Local Compose, `APP_ENV=local`, and direct `http://localhost:3001` calls stay as they are.
`PUBLIC_API_PREFIX` is empty locally, so cookie paths stay `/` and `/auth`.
