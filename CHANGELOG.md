# Changelog

All notable changes to the MedConnect Pro application/demo artifact are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) as defined in
[ADR-007](docs/decisions/ADR-007-semantic-versioning.md).

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
