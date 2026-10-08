# Changelog

All notable changes to the MedConnect Pro application/demo artifact are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) as defined in
[ADR-007](docs/decisions/ADR-007-semantic-versioning.md).

## [0.75.0] - 2026-10-08

### Added

- Claims envelope list on Nest `GET /billing/claims` (FE-032): billing dashboard and invoice
  detail show labeled `not_submitted` / `edi837` envelopes derived from visible invoices. Not
  claim submission, X12, or denial workflow. Catalog `billing.claims` is shipped as qualified.
  Hosted Stripe/ACH and EDI 837 remain planned. Module stays partial.

## [0.74.0] - 2026-10-08

### Added

- Record demo payment on the Nest in-process adapter (FE-031): practice admins and receptionists
  can record `stripe` or `ach` against an unpaid invoice through existing `POST /billing/payments`.
  No card or bank fields. Providers stay read-only. Catalog `billing.payments` is shipped as
  qualified — not hosted Stripe or ACH origination. Claims envelopes remain FE-032.

## [0.73.0] - 2026-10-08

### Added

- Daily call-object media in the telehealth session shell (FE-030): after Nest join, live mode
  mints `POST /telehealth/sessions/:id/media-token` and joins `@daily-co/daily-js` (not Prebuilt).
  Camera, microphone, and screen share control Daily. Presence waiting until a remote participant.
  Unset `DAILY_API_KEY` (Fake adapter `unconfigured.invalid`) is labeled unavailable so CI needs
  no Daily credentials. Mock mode keeps placeholders. Catalog `telehealth.live-media` and
  `telehealth.waiting-room` are shipped as qualified — not production telehealth or HIPAA video.
  Chat and recording remain planned.

## [0.72.0] - 2026-10-07

### Added

- Telehealth Daily media token HTTP (BE-016): `POST /telehealth/sessions/:id/media-token` mints a
  short-lived Daily meeting token after the same visit-participant authorization as join. Nest
  holds `DAILY_API_KEY`; unset key uses a Fake adapter so CI needs no Daily credentials. Session
  rows persist only an opaque room name. ADR-013 records Daily custom call object (not Prebuilt,
  not Socket.IO media). Live camera UI remains FE-030; public copy still must not claim live video.

## [0.71.0] - 2026-10-07

### Added

- Security-events UI (FE-029): `/dashboard/admin` shows a distinct Security events viewer for
  Nest `GET /admin/security-events` (tenant-scoped `auth.*` rows). Mock fixture keeps mock mode
  demonstrable. Catalog `administration.security-events-http` is shipped as qualified — not a
  SIEM, HIPAA audit export, or session-policy editor.

## [0.70.0] - 2026-10-07

### Added

- Security-events HTTP (BE-015): `GET /admin/security-events` lists tenant-scoped `auth.*` rows
  for `admin:practice`. Known-user failed logins emit `auth.login.failed`; unknown emails do not
  confirm existence. Reuses `audit_events` (no new table or permission). The administration viewer
  remains FE-029.

## [0.69.0] - 2026-10-07

### Added

- Mock MFA challenge UI (FE-028): live `/login` shows a labeled mock MFA step when Nest returns
  `mfaRequired`, submits `POST /auth/mfa/verify`, and establishes the cookie session. Harbor seed
  now includes a NURSE membership for `mfa.nurse@example.test`. Catalog
  `identity-access.mfa-challenge` is shipped as qualified mock MFA, not production TOTP or WebAuthn.
  Non-MFA demo users remain one-step login.

## [0.68.0] - 2026-10-06

### Changed

- Live cookie session client (FE-027): Next.js live API calls send `credentials: 'include'` and
  stop storing Nest access/refresh tokens in web storage. Mock mode still uses `localStorage`.
  Logout ends the Nest cookie session; concurrent-session terminate chrome calls `POST /auth/logout-all`.
  Unused Next `/api/auth/*` 501 stubs removed. JSON bearer pairs remain for machine clients.

## [0.67.0] - 2026-10-06

### Added

- HttpOnly cookie session HTTP (BE-014): Nest issues `mcp_access` / `mcp_refresh` (and `mcp_mfa`
  on challenge) on mock IdP login, refresh, and MFA verify, and clears them on logout / logout-all.
  `AuthGuard` accepts the session cookie or `Authorization: Bearer`. CORS allows credentialed
  requests from the existing web origin allowlist. Hosted `SameSite=None` cookie-auth mutations
  require `X-CSRF-Token`. JSON token pairs remain for machine clients. Not production OAuth or a
  Next identity BFF. Live Next storage cutover remains FE-027.

## [0.66.2] - 2026-10-06

### Fixed

- Platform overview hero and metadata describe live dashboard overview cards instead of mock
  analytics cards, matching the shipped Nest overview API.
- README, the GitHub `1.0.0` release-notes template, and the project spec now match shipped M10
  (in-app notification inbox, role assignment, GitHub Actions quality gates).

## [0.66.1] - 2026-10-06

### Fixed

- Mock administration audit events now use a unique id per role change so changing the same
  membership twice no longer collides React list keys in the audit viewer.

## [0.66.0] - 2026-10-06

### Added

- Role assignment UI (FE-026): practice admins change a membership role from the existing
  `/dashboard/admin` user list against Nest `PATCH /admin/users/:id/roles`. Mock mode mutates
  the in-memory directory with the same last-admin and SUPER_ADMIN grant limits. Nest remains
  authoritative; omitting SUPER_ADMIN from the select is UX only. Security-events HTTP remains
  M11. Synthetic demo data only; never real PHI.

## [0.65.0] - 2026-10-05

### Added

- Role assignment HTTP (BE-013): `PATCH /admin/users/:id/roles` updates the session-practice
  membership and returns the practice-user RDO. Requires `admin:users`. PRACTICE_ADMIN cannot
  grant SUPER_ADMIN. The last PRACTICE_ADMIN of the practice cannot be removed. Unknown and
  cross-tenant ids return the same not-found response. Successful changes audit
  `membership.role_changed` without passwords, MFA secrets, or session hashes. Assignment UI
  remains FE-026. Synthetic demo data only; never real PHI.

## [0.64.0] - 2026-10-05

### Added

- In-app notification center (FE-025): dashboard Bell opens a self-scoped inbox from Nest
  `GET /notifications`, mark-read, and channel preferences. Desktop uses a header popover;
  below `lg` uses a full-screen dialog. Not push, SMS, or email carriers. Synthetic demo data
  only; never real PHI.

## [0.63.0] - 2026-10-05

### Added

- Appointment notification producers (BE-012): creating, cancelling, or deleting an appointment
  enqueues `appointment_changed` in-app (and preference-enabled email/SMS) rows for the assigned
  provider and, when linked, the patient’s portal user. `NotificationService.enqueue` audits
  `notification.enqueued` without title or body. No client `POST /notifications`, Redis, SNS, or
  SQS. Notification-center UI remains FE-025. Synthetic demo data only; never real PHI.

## [0.62.0] - 2026-10-05

### Added

- Live dashboard overview cards (FE-024): with mocks off, `/dashboard` loads Nest
  `GET /dashboard/overview` using the BE-009 bearer session. Leftover Next.js cookie BFF
  `/api/dashboard/overview` is removed. Mock fixtures and role filter stay for
  `NEXT_PUBLIC_USE_MOCKS=true`. Live payload omits `patient_satisfaction`. Synthetic demo data
  only; never real PHI.

## [0.61.0] - 2026-10-05

### Added

- Dashboard overview API (BE-011): authenticated `GET /dashboard/overview` returns role-filtered
  synthetic aggregates from the session tenant (patient count, UTC-today appointments, current
  UTC-month invoice totals; PATIENT upcoming visits and open balance). Omits
  `patient_satisfaction` and marketing census figures. Live dashboard UI wiring remains FE-024.
  Synthetic demo data only; never real PHI.

## [0.60.0] - 2026-10-04

### Added

- Bounded Harbor synthetic seed (DATA-002): `npm run seed:mock-identity` upserts ≥20 patients,
  ≥8 appointments (including two on the seed UTC day), ≥4 current-month invoices, and in-app
  inbox rows for the practice admin (3) and provider (2). Re-seed is idempotent by email, notes,
  line-item description, and inbox title. Avery/Blake loginable accounts stay. Live dashboard
  and notification-center capabilities remain planned until BE-011 / FE-025. Synthetic demo
  data only; never real PHI.

## [0.59.0] - 2026-10-04

### Added

- Production delivery and rollback (INFRA-011): after quality CI on `main`, GitHub Actions
  migrates via an in-VPC ECS `RunTask` and rolls preview then production Fargate services
  (`.github/workflows/production-deploy.yml`). Production ECS waits on the GitHub `production`
  environment. Amplify Git remains the only web publisher. Rollback is the previous task
  definition (migration revert only with explicit dispatch). Live Terraform apply and the
  GitHub environment remain operator steps. Synthetic demo data only; never real PHI.

## [0.58.0] - 2026-10-04

### Added

- Amplify PR preview delivery (INFRA-010): `amplify.yml` writes public frontend env into
  `apps/web/.env.production` and fails closed if required URLs are missing; quality CI posts
  the advertised preview URL only after `ci` succeeds (`.github/workflows/preview-status.yml`).
  Operator runbook enables Amplify-native PR previews against the shared preview API/RDS
  (all-branch env = `preview_api_url`, `main` override = `production_api_url`). Feature branches
  cannot publish production Amplify. Live console enablement remains an operator step. ECS
  rolling deploy remains INFRA-011. Synthetic demo data only; never real PHI.

## [0.57.0] - 2026-10-04

### Added

- AWS Amplify Hosting for Next.js (INFRA-009): root `amplify.yml` (npm workspace install from
  `/`, SSR artifacts `apps/web/.next`, Node 24, `npm run build:production`), quality-CI
  buildspec tests, and an operator runbook to Git-connect `main`, inject production API URLs,
  and set exact `production_web_origins`. Amplify Git owns production web publish. Live
  console connect remains an operator step. PR previews and ECS rolling deploy remain
  INFRA-010–INFRA-011. Synthetic demo data only; never real PHI.

## [0.56.0] - 2026-10-03

### Added

- NestJS API container and ECS/Fargate hosting (INFRA-008): `apps/api/Dockerfile`, preview and
  production Fargate services behind CloudFront HTTPS, Secrets Manager task injection,
  `WEB_ORIGIN`/`WEB_ORIGINS` CORS parser, and S3 document storage for hosted environments.
  Quality CI builds the image; `main` pushes to ECR. Live `terraform apply` remains an operator
  step. Amplify and ECS rolling deploy remain INFRA-009–INFRA-011. Synthetic demo data only;
  never real PHI.

## [0.55.0] - 2026-10-03

### Added

- Preview/demo and production/demo RDS PostgreSQL 18 in private subnets (INFRA-007): Terraform
  VPC, SSM bastion for migrate/seed, generated non-Compose `DATABASE_*` URLs in
  `medconnect/preview/api` and `medconnect/production/api`, encrypted remote state, and an
  operator runbook ([docs/workflows/deploy.md](docs/workflows/deploy.md)). Synthetic seed only;
  never real PHI. ECS API hosting remains INFRA-008.

### Changed

- Hosted Nest boot also rejects identical runtime/owner URLs and a runtime username other than
  `medconnect_app`.

## [0.54.0] - 2026-10-03

### Added

- Secrets classification and AWS secret retrieval (INFRA-006): distinct Secrets Manager names
  `medconnect/preview/api` and `medconnect/production/api`, GitHub OIDC IAM roles in
  [infra/terraform/](infra/terraform/), a committed-secret CI guard
  (`npm run ci:secrets`), and a short rotation runbook
  ([docs/workflows/deploy.md](docs/workflows/deploy.md)). Amplify / `NEXT_PUBLIC_*` remains
  public configuration only. The API image is still INFRA-008; the contract forbids secret
  `ENV` / `ARG`.

### Changed

- Environment catalog
  ([docs/contracts/environment-configuration.md](docs/contracts/environment-configuration.md))
  now documents hosted retrieval (ECS injection, no Nest AWS SDK, Parameter Store unused).

## [0.53.0] - 2026-10-03

### Added

- GitHub Actions CI quality gates (INFRA-005): [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
  runs lint, type-check, Vitest, production web build, API build, and `npm audit --omit=dev` on
  pull requests and `main`, with PostgreSQL 18 for API tests. No deploy jobs.

### Changed

- Local Compose Postgres from 16 to 18 (`postgres:18-alpine`), matching CI.
- Web lint toolchain so the quality gate can run: TypeScript 6.0.3, ESLint 9, Next.js 16.3.8
  (also addresses `next/og` ImageResponse), and native `eslint-config-next` flat config.

## [0.52.0] - 2026-10-03

### Added

- Environment separation contract (INFRA-004): [ADR-012](docs/decisions/ADR-012-deployment-topology.md)
  locks Amplify + ECS Fargate with `local` / `preview` / `production`, a runtime variable catalog,
  hosted `.env.preview.example` / `.env.production.example` placeholders, and Nest fail-closed
  boot when `APP_ENV` is hosted and `DATABASE_*` URLs are missing or still point at Compose.

### Changed

- Architecture environment names from development / staging / production to local / preview /
  production. CORS origin-list parsing and AWS provisioning remain later M9 tasks.

## [0.51.1] - 2026-10-02

### Changed

- Marketing chrome polish: footer nav marks the current route with `text-brand` and
  `aria-current="page"` (Sign in stays brand), Demo sign-in crop is capped at 540px, hero CTAs
  stack full-width on mobile and sit in a row from `sm` (matching Home), and Product UI slider
  controls sit on the section heading row.

## [0.51.0] - 2026-10-01

### Added

- Marketing product visuals (FE-023): a six-slide Product UI slider on Home (two slides on
  desktop/tablet, one on mobile, with a peek of the next screen), captured synthetic module
  screens on the six feature walkthroughs, a captured mock login on Demo, and shared Open Graph /
  Twitter metadata from the Dashboard crop. Copy keeps the synthetic-demo disclaimer and does not
  claim HIPAA certification or hosted production.

## [0.50.0] - 2026-09-30

### Added

- Security, About, and Demo marketing pages (FE-022) replacing the remaining FE-017 placeholders.
  Copy follows the capability matrix: implemented controls (mock identity, RBAC, tenant isolation,
  audit, RLS, document ACL), portfolio/architecture context, and demo entry through existing
  `/login`. Login-chrome visuals stay a labeled placeholder until FE-023. Optional login form
  token mapping only; mock IdP behavior is unchanged.

## [0.49.0] - 2026-09-30

### Added

- Platform feature pages (FE-021) at `/platform/patient-management`, `/platform/appointments`,
  `/platform/telehealth`, `/platform/billing`, `/platform/analytics`, and
  `/platform/administration`. Shared `FeaturePageLayout` with Figma-approved, capability-matrix
  copy, labeled walkthrough placeholders until FE-023, and related-module links. CTAs use `/demo`
  and `/platform`; sign-in remains `/login`.

## [0.48.0] - 2026-09-30

### Added

- Platform overview at `/platform` (FE-020): designed feature map with honest module status and
  sitemap links to `/platform/*` (pages may 404 until FE-021). Shared `FeaturePageLayout`
  primitives for upcoming feature pages. Copy follows the capability matrix.

## [0.47.0] - 2026-09-29

### Added

- Marketing homepage at `/` (FE-019): hero, practice modules, connected workflow, labeled product
  UI placeholder, UX and security principles, intended roles, and demo CTAs to `/platform` and
  `/demo`. Copy follows the capability matrix. Product screenshots remain placeholders until FE-023.

## [0.46.0] - 2026-09-29

### Added

- Shared design tokens mapped from the approved Figma library (FE-018): CSS variables and
  Tailwind `@theme` aliases for color, type, radius, shadow, and the 4px spacing grid. Inter is
  `--font-sans`. `Button`, `Card`, and `Input` (and marketing chrome) consume the tokens. The
  dashboard layout was not restyled.

## [0.45.0] - 2026-09-28

### Added

- Public marketing website foundation (FE-017): `(marketing)` route group with shared header,
  footer, and accessible mobile navigation, isolated from the dashboard shell and auth gate.
  Placeholder pages at `/`, `/platform`, `/security`, `/about`, and `/demo`. `/demo` links to the
  existing mock login at `/login`. Per-page document title and description. Copy describes the
  portfolio demo only (not HIPAA certification, production OAuth, live video, or hosted payments).

## [0.44.0] - 2026-09-27

### Added

- Administration UI calls Nest admin APIs when mocks are off (FE-016): user list (`GET /admin/users`)
  and audit viewer (`GET /admin/audit-events`) with the bearer from `POST /auth/login`.
  `npm run seed:mock-identity` already inserts a loginable `practice.admin@example.test` and
  provider `jordan.ellis@synthetic.example`. `npm run e2e:live` covers seeded emails plus
  `auth.login.succeeded`; `npm run e2e` stays on mocks. Roles remain presentation only; role
  assignment and security-events stay unwired.

## [0.43.0] - 2026-09-27

### Added

- Practice user directory HTTP (BE-010): tenant-scoped `GET /admin/users` joins `practice_memberships`
  and `users` for the session practice. Requires `admin:users`. `id` is the user id; `synthetic` is
  always true. Client `practiceId` is rejected on mismatch. Identity tables remain without RLS;
  application scoping is mandatory. Frontend live wiring stays FE-016.

## [0.42.0] - 2026-09-27

### Added

- Notification domain (BE-008): tenant-scoped in-app inbox and channel preferences, demo email/SMS
  adapters, and an in-process delivery bus with three-attempt exponential backoff. SNS/SQS remains
  the target; there is no AWS SDK. Authenticated users read and update only their own rows. Frontend
  wiring stays out of scope.

## [0.41.1] - 2026-09-27

### Added

- Reusable authorization and tenant-isolation HTTP matrix (QA-004): role × resource × tenant cases
  for provider, nurse, receptionist, patient, and practice admin against shipped Nest surfaces,
  plus cross-tenant not-found and client `practiceId` rejection.

## [0.41.0] - 2026-09-27

### Added

- Document access control (SEC-004): tenant-scoped `patient_documents` metadata in PostgreSQL,
  multipart upload with PDF/PNG/JPEG magic-byte and 5 MiB validation, and authorized download at
  `GET /patients/:id/documents/:documentId/content`. Bytes stay in a local filesystem adapter with
  tenant-prefixed keys until S3 SSE-KMS exists. List, upload, and download write audit events
  without filenames or payloads. Live patient profile lists and downloads seeded documents; upload
  UI stays out of scope.

## [0.40.0] - 2026-09-27

### Added

- Tenant isolation at the PostgreSQL boundary (SEC-002): row-level security on tenant-owned tables,
  non-owner runtime role `medconnect_app`, and server-set `app.current_practice_id`. Nest
  `DATABASE_URL` must not use table owner `medconnect` or RLS is bypassed. Migrations and seed use
  `DATABASE_ADMIN_URL`. Cache keys and object-storage paths remain deferred until Redis/S3 exist.

## [0.39.0] - 2026-09-27

### Added

- Administration UI (FE-009): practice user/role list and synthetic audit viewer at `/dashboard/admin`. The Settings placeholder is replaced. Live mode rejects admin queries until a later Nest connect task. Nav visibility stays UX only; role assignment and permission management stay out of scope.

## [0.38.0] - 2026-09-27

### Added

- Billing dashboard calls the Nest billing API when mocks are off (FE-015): list and detail with the bearer from `POST /auth/login`. `npm run seed:mock-identity` already inserts Avery Quinn invoices and a loginable `practice.admin@example.test`. `npm run e2e:live` covers seeded list plus UUID detail; `npm run e2e` stays on mocks. Payment and claims remain labeled boundaries; Record payment stays disabled.

## [0.37.0] - 2026-09-26

### Added

- Billing API (BE-007): `GET`/`POST /billing/invoices`, `GET /billing/invoices/:id`, `POST /billing/payments`, and `GET /billing/claims`. Invoices and payments are tenant-scoped. Payments use an in-process Stripe/ACH adapter and never store card data. Claims are labeled EDI 837 envelopes, not generated X12. Nurse practice-revenue access is denied. Frontend live billing still 404s until a later connect task.

## [0.36.0] - 2026-09-26

### Added

- Billing dashboard (FE-008): invoice list at `/dashboard/billing` and detail at `/dashboard/billing/[invoiceId]` from synthetic fixtures. Payment (Stripe/ACH) and claims (EDI 837) are labeled UI boundaries and do not process payments. Live mode rejects billing queries until BE-007. Nav visibility stays UX only; nurse visit-context billing is out of scope.

## [0.35.0] - 2026-09-26

### Added

- Telehealth lobby and session shell call the Nest telehealth session API when mocks are off (FE-014): create, get, join, and end with the bearer from `POST /auth/login`. Live Join visit uses the server session UUID. `npm run seed:mock-identity` inserts a relative-to-now telehealth appointment for `jordan.ellis@synthetic.example`. `npm run e2e:live` covers lobby, join, media placeholders, and end; `npm run e2e` stays on mocks. Daily/WebRTC is not connected.

## [0.34.1] - 2026-09-26

### Fixed

- `npm run plane:sync` inserts a `plane:` block when a task file has none, then writes `work_item_id` and `identifier` after the Plane card is created.

## [0.34.0] - 2026-09-26

### Added

- Telehealth session API (BE-006): `POST /telehealth/sessions`, `GET /telehealth/sessions/:id`, `POST /telehealth/sessions/:id/join`, and `POST /telehealth/sessions/:id/end`. Sessions are appointment-linked, tenant-scoped application visits with waiting/in-session/ended state, 15-minute join grace, and mutation audit events without PHI. Daily/WebRTC is not part of this surface.

## [0.33.0] - 2026-09-26

### Added

- Appointment-linked telehealth session shell (FE-007): lobby at `/dashboard/telehealth`, waiting room and join/leave on `/dashboard/telehealth/[sessionId]`, and camera/microphone/screen-share placeholders. Mock sessions are derived from telehealth appointments. Live mode lists joinable visits from the appointment API; join/get/leave stay unavailable until BE-006. Daily is not connected. Copy labels the surface as a synthetic demo, not a production telehealth deployment.

## [0.32.0] - 2026-09-25

### Added

- Clinical lists on the patient profile call the Nest clinical API when mocks are off (FE-013): history, conditions, vitals, and medications with the bearer from `POST /auth/login`. Documents stay off that API. `npm run seed:mock-identity` inserts synthetic clinical rows and a loginable provider `jordan.ellis@synthetic.example`. `npm run e2e:live` checks the seeded provider profile lists; `npm run e2e` stays on mocks.

## [0.31.0] - 2026-09-25

### Added

- Restricted `GET /admin/audit-events` (SEC-003): practice-admin list of tenant-scoped audit rows (actor, action, resource ids, correlation; no emails, notes, or clinical text). Mock login, logout, MFA, refresh-token reuse, authenticated denials, and patient GET/create/update now write `audit_events` alongside existing appointment and clinical mutation events.

## [0.30.0] - 2026-09-25

### Added

- Clinical record API (BE-005): `GET`/`POST /patients/:id/history`, `/conditions`, `/vitals`, and `/medications`. Tenant-scoped TypeORM persistence, provider vs nurse permission checks, portal self-read, and mutation audit events without clinical payloads. FHIR alignment is conceptual only.

### Changed

- Human API index and data contracts document the bounded clinical mapping. Documents remain unimplemented. Shared `AuditModule` records appointment and clinical writes.

## [0.29.0] - 2026-09-25

### Changed

- Plane task sync sends GitHub-flavored Markdown as structured `description_html` (headings, lists, task items, quotes, code, tables) instead of escaped source text.

## [0.28.0] - 2026-09-24

### Added

- Appointment list, calendar, and create call the Nest appointment API when mocks are off (FE-012), using the bearer from `POST /auth/login`. Availability, PATCH, and DELETE stay off that API. `npm run seed:mock-identity` already inserts a synthetic visit for the live calendar. `npm run e2e:live` checks calendar plus create against the API; `npm run e2e` stays on mocks.

## [0.27.1] - 2026-09-24

### Added

- Appointment workflow tests (QA-003): after a mock create, the new visit appears on the calendar, and a nurse who opens create directly is denied. Existing conflict, calendar view, and Nest authorization checks stay in place. Browser appointment tests still use synthetic mocks.

## [0.27.0] - 2026-09-24

### Added

- Appointment API (BE-004): `GET`/`POST /appointments`, `GET`/`PATCH`/`DELETE /appointments/:id`, and
  `GET /providers/:id/availability`, with server-side provider conflict detection, tenant and role
  checks, and mutation audit events. Frontend appointment screens stay on mocks.

## [0.26.0] - 2026-09-24

### Added

- Appointment calendar on `/dashboard/appointments` (FE-006): day, week, and month views with
  appointment selection, tablet-oriented toolbar, and loading/error states. List and create stay
  available; the Nest appointment API stays out of scope.

## [0.25.0] - 2026-09-24

### Added

- Appointment creation on `/dashboard/appointments` (FE-005): mock list and schedule form (patient, provider, time, type, state), accessible validation, and provider overlap feedback. Calendar views and the Nest appointment API stay out of scope.

## [0.24.0] - 2026-09-23

### Added

- Patient list, profile, create, and edit call the Nest patient API when mocks are off (FE-011), using the bearer from `POST /auth/login`. History, vitals, medications, and documents stay off that API. `npm run seed:mock-identity` also inserts a synthetic provider and demo patients. `npm run e2e:live` checks list plus create against the API; `npm run e2e` stays on mocks.

## [0.23.1] - 2026-09-23

### Added

- Patient workflow tests (QA-002): a provider who opens create or edit URLs directly is denied in the mock UI, and a receptionist can read the patient they just created. Existing list, create, edit, and cross-tenant checks stay in place. Browser patient tests still use synthetic mocks.

## [0.23.0] - 2026-09-23

### Added

- Patient demographics API (`GET`/`POST /patients`, `GET`/`PATCH /patients/:id`) with Zod validation, tenant scope, role and assignment checks, and generated OpenAPI (BE-003).

## [0.22.0] - 2026-09-23

### Added

- Patient create and edit forms at `/dashboard/patients/new` and `/dashboard/patients/[patientId]/edit` (FE-004), with Zod validation, accessible field errors, and server error details. Entry points require the `write:demographics` grant in the demo session.

## [0.21.0] - 2026-09-23

### Added

- `npm run plane:sync` accepts task ids or `--changed`, so a run can update one completed task or only dirty and unlinked task files.

## [0.20.0] - 2026-09-23

### Added

- Patient profile at `/dashboard/patients/[patientId]` (FE-003), with demographics for staff who can read patients and history, vitals, medications, and documents gated by clinical permissions.

## [0.19.0] - 2026-09-22

### Added

- Searchable, filterable patient list on `/dashboard/patients` (FE-002), backed by the synthetic mock patient fixtures with status filter, last-name sort, load more, and loading, empty, and error states.

## [0.18.0] - 2026-09-22

### Added

- `npm run plane:sync` creates repository tasks as Plane work items in Backlog and updates title, description, and priority on later runs without moving cards.

## [0.17.0] - 2026-09-22

### Added

- NestJS mock identity HTTP (`POST /auth/login`, refresh, logout, logout-all, and MFA verify) with
  opaque bearer sessions resolved from practice memberships.

### Changed

- OpenAPI Bearer auth describes those opaque mock access tokens. Logout requires a bearer token.
  Health and readiness stay unauthenticated.

## [0.16.0] - 2026-09-22

### Added

- Mock identity login/logout and a dashboard session gate (FE-010), with synthetic demo credentials.
- Milestone task crosswalk on the release roadmap; FE-010 and BE-009 task specs.

### Changed

- Leftover v0 MFA/register/password-reset theater is parked as out-of-milestone stubs.
- Session chrome is limited to the authenticated dashboard tree.

## [0.15.0] - 2026-09-21

### Added

- PostgreSQL tenant model (TypeORM migrations, Practice and tenant-owned tables, server-side tenant
  scope) and a database-backed `GET /ready` probe.

## [0.14.0] - 2026-09-21

### Added

- Generated OpenAPI artifact (`apps/api/openapi/openapi.json`) from NestJS Swagger 12, served at
  `/api/docs-json`, with optional Swagger UI at `/api/docs` (`SWAGGER_UI_ENABLED`).

## [0.13.0] - 2026-09-21

### Added

- NestJS 12 API workspace (`apps/api`) with global Zod validation, a consistent error envelope,
  `X-Correlation-ID`, structured request logging, and unauthenticated `/health` and `/ready`
  endpoints on port 3001.

## [0.12.2] - 2026-09-21

### Added

- Identity and access contract (roles, permission catalog, tenant resolution, resource
  authorization, session rules) and a matching frontend permission catalog for mock sessions.

### Changed

- Mock PRACTICE_ADMIN session permissions now use the canonical `action:resource` catalog instead of
  generic `read`/`admin` strings.

## [0.12.1] - 2026-09-20

### Changed

- Local development conventions: mock-first `apps/web/.env.example`, gitignored local env files,
  Node 24 `engines` / `.nvmrc`, and a cross-platform `npm run reset`.

## [0.12.0] - 2026-09-20

### Added

- npm workspaces monorepo layout with the Next.js app in `apps/web`, reserved `apps/api` and
  `packages/` directories, and ADR-009.

### Changed

- Root `package.json` is workspace-only; frontend dependencies and Next.js tooling live in
  `apps/web`. Root scripts delegate to the web workspace.
- Canonical documentation and Cursor rules stay at the repository root; frontend rule globs target
  `apps/web`.

## [0.11.0] - 2026-09-20

### Added

- Vitest + React Testing Library for unit and component tests, with Playwright Chromium E2E for dashboard navigation.
- Frontend testing conventions (ADR-008) and a dashboard-shell E2E flow.

### Changed

- Replaced Jest with Vitest as the frontend unit/component runner. Playwright is now an installed, configured E2E dependency.
- Mock concurrent-session list defaults to the current session so dashboard E2E is not blocked by the security dialog.

## [0.10.0] - 2026-09-17

### Added

- Authenticated dashboard shell with responsive, accessible navigation and route-level loading/error UI.
- Role-aware menu presentation (UX only) and isolated synthetic dashboard overview metrics.

## [0.9.2] - 2026-09-16

### Changed

- Replaced remaining Heroicons usage with Lucide equivalents and removed `@heroicons/react`.

## [0.9.1] - 2026-09-16

### Fixed

- Load `scripts/plane/.env` in the Plane sync client so `npm run plane:sync:dry` sees configured workspace variables.

## [0.9.0] - 2026-09-16

### Added

- Baseline for recorded application versions. Prior work is not reconstructed as fake history.
