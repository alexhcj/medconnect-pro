# Changelog

All notable changes to the MedConnect Pro application/demo artifact are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) as defined in
[ADR-007](docs/decisions/ADR-007-semantic-versioning.md).

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
