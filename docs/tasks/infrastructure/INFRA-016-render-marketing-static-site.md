---
id: INFRA-016
type: task
area: infrastructure
feature: deployment
status: implemented
priority: high
estimate: 5
dependencies: [INFRA-015]
related_adrs: [ADR-005, ADR-012, ADR-017, ADR-018]
related_docs:
  [
    infrastructure-architecture.md,
    frontend-architecture.md,
    ../workflows/deploy-render.md,
    ../contracts/environment-configuration.md,
    ../marketing/sitemap.md,
    ../roadmap/release-roadmap.md,
  ]
implementation:
  status: complete
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: null
  identifier: null
---

# INFRA-016 — Render marketing static site

## Objective

Publish the existing marketing pages as a Render static site, and keep the authenticated Next.js
application on the apex hostname, without a second Node service, a proxy, or a change to the API
cookie model.

## Context

INFRA-015 deploys `apps/web` and `apps/api` as one Blueprint. Marketing was the `(marketing)`
route group inside `apps/web`, so `/` was the landing page. ADR-018 splits that page onto
`marketing.medconnectpro.app`. Render redirects `www` to the apex, so `www` cannot be the landing
page.

## Scope

- `apps/marketing` static export of the existing public pages, with build-time
  `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_APP_ORIGIN`.
- Application `/` redirects to `/login`. `/mcp-api` and host-only cookies stay on `apps/web`.
- Blueprint service `medconnect-marketing`, custom-domain declarations, `branch: main`, and
  `WEB_ORIGIN=https://medconnectpro.app`.
- ADR-018, the Render runbook, and the environment contract. M9 stays open.

## Out of scope

- Buying or delegating `medconnectpro.app`
- Rewriting `/privacy-policy` and `/terms-of-service`
- Disabling `onrender.com` before the apex certificate is verified
- Redis, a persistent disk, a wildcard, a proxy, Render preview environments, Railway, and AWS
- Closing M9, INFRA-014, or INFRA-013
- Hiding the Fake OAuth control and the reported telehealth deploy failure

## Acceptance criteria

- Marketing build writes static HTML under `apps/marketing/out` and does not start a Node server.
- Sign-in links on the marketing site are absolute application URLs. The marketing origin is not
  a CORS origin and does not set session cookies.
- `apps/web` no longer serves marketing routes. `/` redirects to `/login`.
- `render.yaml` describes the static site, the apex, `www`, `marketing.`, and `api.` without
  committed secrets.
- `APP_ENV` on Render stays `preview`.

## Completion

- Implemented with ADR-018. Legal pages stay on the application. Their HIPAA claims were not
  rewritten. Registrar DNS remains an operator step after the domain is purchased; the runbook
  records the records. `onrender.com` stays enabled until that cutover.
