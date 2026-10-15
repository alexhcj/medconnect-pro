# ADR-018 — Render marketing static site

## Status

Accepted

## Decision

The interim Render demo ([ADR-017](ADR-017-interim-render-demo.md)) publishes three web-facing
resources from one Blueprint. This does not replace the AWS topology in
[ADR-012](ADR-012-deployment-topology.md) and does not close M9.

- **Application:** `apps/web` stays a Render web service. It owns the apex
  `medconnectpro.app`. Render attaches `www.medconnectpro.app` to that same service and redirects
  `www` to the apex. `/` redirects to `/login`. Session cookies stay host-only. The browser still
  calls `/mcp-api` on this origin.
- **Marketing:** `apps/marketing` is a static export of the existing public pages. It is a Render
  static site at `marketing.medconnectpro.app`. It does not receive application secrets, the
  database, or session cookies. Sign-in links are absolute URLs on the application origin.
- **API:** `apps/api` stays a Render web service at `api.medconnectpro.app`. Browsers do not call
  it. `WEB_ORIGIN` is `https://medconnectpro.app`. `WEB_ORIGINS` may include the application
  service’s `onrender.com` URL until that subdomain is disabled after DNS cutover. The marketing
  origin is not a CORS origin.
- **Legal pages:** `/privacy-policy` and `/terms-of-service` stay on the application origin. They
  are not part of the marketing static site. Rewriting their HIPAA claims is a separate product
  change.
- **Environment name:** `APP_ENV=preview` on Render. `production` stays reserved for the future
  AWS production demo.
- **Plans:** Free compute until the Free Postgres expiry forces an upgrade. Do not add Redis, a
  persistent disk, a proxy, a wildcard domain, or a second domain. Do not enable Render preview
  environments against the shared demo database.

## Rationale

Marketing pages are static. A second Node service would duplicate the application and consume
free instance hours. Render will not serve `www` from a different service than the apex, so the
landing page uses its own subdomain. Host-only cookies keep the session off that subdomain.
Putting `Domain=.medconnectpro.app` on session cookies would share them with the marketing host.

## Consequences

- `apps/web` no longer serves the `(marketing)` route group.
- Public `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_APP_ORIGIN` are build-time configuration for the
  static site. They are not secrets.
- The `onrender.com` name for the application stays enabled until the apex certificate is
  verified. Disabling it earlier would remove the only working application hostname.
- Railway, if ever used, would need its own blueprint. This decision does not add one.
