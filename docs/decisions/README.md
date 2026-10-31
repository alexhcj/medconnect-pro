# Architectural decision records

Each ADR records one decision, why it was made, and what it costs. This index summarises them; the
ADR file is canonical. Status is copied from each ADR's own `## Status` section; where that section
runs longer than a sentence (ADR-015, ADR-016), the cell keeps its opening and ends with
"(see ADR)".

System overview: [architecture/README.md](../architecture/README.md). One request end to end:
[architecture/request-lifecycle.md](../architecture/request-lifecycle.md).

## Index

| ADR | Status | Decision | Main tradeoff |
| --- | --- | --- | --- |
| [ADR-001](ADR-001-modular-backend.md) Modular backend | Accepted | One modular NestJS application, not independently deployed microservices. | Modular monolith over microservices: clear domain boundaries without distributed-system cost, but modules share one deploy and one database. |
| [ADR-002](ADR-002-tenant-isolation.md) Tenant isolation | Accepted | Practice/tenant comes from the authenticated identity and is enforced server-side; RLS may add defense in depth. | Never trusting a client tenant id means every repository and service must resolve scope itself, and cross-tenant cases must be tested. |
| [ADR-003](ADR-003-authentication.md) Authentication | Accepted | Target OAuth 2.0 + OIDC (Authorization Code + PKCE) with MFA and session controls; demo may use a mock identity provider. | A standards-based target instead of a custom password/JWT flow; the demo's mock sign-in must never be presented as production identity. The demo implementation is ADR-014. |
| [ADR-004](ADR-004-api-contracts.md) API contract ownership | Accepted | OpenAPI generated from Nest is the machine-readable contract; Markdown in `docs/contracts/` is the human index; Postman imports the generated file. | One generated source avoids hand-written spec drift, but Postman collections drift until re-imported and planned endpoints exist only as Markdown. |
| [ADR-005](ADR-005-synthetic-demo-data.md) Synthetic demo data | Accepted | Deterministic synthetic healthcare data only. | Safe to publish and demo, but no real-world data volume or quirks; the demo makes no HIPAA compliance claim. |
| [ADR-006](ADR-006-current-technology-baseline.md) Current technology baseline | Accepted | Use current stable releases at implementation time. | Modern stack for interviews, at the cost of checking versions each slice and docs that may lag (for example, newer Next.js APIs). |
| [ADR-007](ADR-007-semantic-versioning.md) Semantic versioning | Accepted | SemVer from the root `package.json`, bumped by the implementer; breaking changes map to MINOR while 0.x. | No release automation to operate, but every shippable slice depends on a manual bump and changelog entry. |
| [ADR-008](ADR-008-frontend-testing-stack.md) Frontend testing stack | Accepted | Vitest + React Testing Library for unit/component, Playwright for e2e; no Jest. | One runner per layer avoids duplicate tooling; Jest-only libraries and examples do not apply. |
| [ADR-009](ADR-009-npm-workspace-monorepo.md) npm workspace monorepo | Accepted | npm workspaces (`apps/web`, `apps/api`, later `apps/marketing`); no Turborepo, Nx, or pnpm. | Minimal tooling and one install, but no task-graph caching; `packages/` stays empty until real reuse appears, so marketing copies two primitives. |
| [ADR-010](ADR-010-postgresql-typeorm.md) PostgreSQL and TypeORM | Accepted | PostgreSQL with TypeORM 0.3 and checked-in migrations; RLS on tenant tables; runtime role `medconnect_app` does not bypass RLS. | RLS plus service-level scoping gives two layers of tenant defense, but both must stay aligned and a misconfigured `DATABASE_URL` (owner role) silently bypasses RLS. |
| [ADR-011](ADR-011-figma-canonical-visual-source.md) Figma as canonical visual source | Accepted | One Figma file is the visual source; UI tasks implement approved frames recorded on the same task. | Marketing and app stay consistent, but UI work waits for `design.status: approved` and token changes go Figma first. |
| [ADR-012](ADR-012-deployment-topology.md) Deployment topology | Accepted | AWS target: Amplify for web, ECS/Fargate for the API, RDS; environments `local` / `preview` / `production`. | One shared preview API instead of a backend per PR keeps cost down, but previews share one preview database. The topology is paused until an AWS account exists. |
| [ADR-013](ADR-013-daily-custom-call-object.md) Daily custom call object | Accepted | Daily hosted WebRTC with a client call object; Nest alone holds `DAILY_API_KEY` and mints short-lived meeting tokens. | Nest stays the authorization authority and no SFU is self-hosted, at the cost of a third-party media dependency; a Fake adapter runs when the key is unset. |
| [ADR-014](ADR-014-oidc-bff-and-external-identity.md) OIDC BFF and external identity | Accepted | Nest is the confidential OIDC client (PKCE S256), maps the external identity to an existing user, and issues the existing opaque HttpOnly session; Google plus a Fake adapter. | Opaque server sessions over browser-held JWTs or a second stack (NextAuth, hosted IdP): provider tokens never reach the browser, but every request needs a session lookup and there is no self-signup. |
| [ADR-015](ADR-015-rate-limiting-and-api-protection.md) Rate limiting and API protection | Accepted (SEC-007). Implementation: M15 (see ADR) | Fixed-window limits on opt-in routes with a PostgreSQL bucket store behind a port; custom guard, four security headers, no new dependency. | No Redis to run, at the cost of one database write per protected request and up to twice the limit across a window boundary. |
| [ADR-016](ADR-016-super-admin-session-tenant-scope.md) SUPER_ADMIN session-tenant scope | Accepted (SEC-009). This is a documentation decision. It does not add an authorization engine. (see ADR) | Every role, including `SUPER_ADMIN`, is scoped to the session's practice membership; a client `practiceId` never widens scope. | No cross-practice access in the demo (accepted scope), in exchange for one tenant rule with no bypass; a practice switcher is future work. |
| [ADR-017](ADR-017-interim-render-demo.md) Interim Render public demo | Accepted | While AWS is paused, run the public demo on Render (web, API, Postgres) with `APP_ENV=preview` and a same-origin API proxy. | Render interim over AWS: a working public demo now, but free-tier sleep, database expiry and no production parity; the AWS target stays open. |
| [ADR-018](ADR-018-render-marketing-static-site.md) Render marketing static site | Accepted | Marketing is a static export on its own subdomain; the app owns the apex; session cookies stay host-only. | No second Node service and no cookie sharing with marketing, at the cost of a separate subdomain and build-time public configuration. |
| [ADR-019](ADR-019-render-pr-previews.md) Render pull-request previews | Accepted. Implemented by INFRA-019 (service previews) and INFRA-020 (`checksPass` deploys, PR comment); both have shipped. | Manual per-PR previews for marketing and web only; web previews run on frontend mocks; no preview API or database. | Free visual review without touching the interviewer database, but previews are not API tests; API and migration changes rely on CI and local live checks. |

## Groups

- **Identity and access:** ADR-003 (target), ADR-014 (demo implementation), ADR-016 (tenant scope
  of sessions), ADR-015 (API protection).
- **Tenancy and data:** ADR-002, ADR-010, ADR-005.
- **Deployment:** ADR-012 (AWS target), ADR-017, ADR-018, ADR-019 (interim Render demo).
- **Integrations:** ADR-013 (Daily).
- **Engineering process:** ADR-001, ADR-004, ADR-006, ADR-007, ADR-008, ADR-009, ADR-011.

## Adding an ADR

Use the next number, `ADR-0NN-<slug>.md`, with `## Status`, `## Decision`, `## Rationale` and
`## Consequences` sections, and add a row here in the same change.
