# Changelog

All notable changes to the MedConnect Pro application/demo artifact are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) as defined in
[ADR-007](docs/decisions/ADR-007-semantic-versioning.md).

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
