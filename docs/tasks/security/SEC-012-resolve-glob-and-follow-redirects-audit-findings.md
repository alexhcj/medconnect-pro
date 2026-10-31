---
id: SEC-012
type: task
area: security
feature: dependency-security
status: implemented
priority: high
estimate: 1
dependencies: [SEC-011]
related_adrs: [ADR-007-semantic-versioning.md]
related_docs:
  [
    SEC-011-resolve-production-audit-regressions.md,
    ../infrastructure/INFRA-020-checks-gated-deploys-and-pr-workflow.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: b780d312-9916-417b-b0d8-e4b6b4a254bd
  identifier: MEDCONNECT-156
---

# SEC-012 — Resolve glob and follow-redirects audit findings

## Objective

`npm audit --omit=dev` exits 0 again, so the `ci` job passes on the M21 PR and on `main`.

## Context

On 2026-10-31 the `ci` job on PR #10 (M21) failed at "Audit production dependencies" with 3
findings in packages that PR did not touch:

- `follow-redirects` 1.16.1 (high, GHSA-mrwp-f3q8-3g9p) via web `axios` 1.20.0; fixed in 1.16.2,
  inside the range `axios` already allows.
- `glob` 10.5.0 (moderate, GHSA-3g3m-2fjr-6pw4, fixed in 14.0.2) and its `minimatch` 9.0.9
  (moderate, GHSA-g3hv-75wg-m249, fixed in 11.0.1) via API `typeorm` 0.3.31. npm's suggested fix
  installs `typeorm` 1.1.2, a breaking major upgrade.

`typeorm` 0.3.31 only calls `glob.sync()` (`util/DirectoryExportedClassesLoader.js`), which
`glob` 14 still exports for CommonJS.

## Scope

- Update `follow-redirects` to 1.16.2 in `package-lock.json` only.
- Add a root `overrides` entry scoped to `typeorm`: `"typeorm": { "glob": "14.0.3" }`, and refresh
  the lockfile (`minimatch` resolves to 11.0.3).

## Out of Scope

- Upgrading `typeorm` to 1.x. Remove the override when the project moves to a `typeorm` that
  depends on a patched `glob`.
- Dev-only advisories, weakening the audit step, or adding `--audit-level`.

## Requirements

- Ask before adding or changing a dependency (`CLAUDE.md`); approved by the user on 2026-10-31.
- No behaviour change. Entity and migration loading, and web HTTP calls, stay green.

## Acceptance criteria

- [x] `npm audit --omit=dev` exits 0
- [x] `npm ls` shows `glob` 14.0.3 (overridden), `minimatch` 11.0.3, `follow-redirects` 1.16.2,
      `typeorm` 0.3.31, `axios` 1.20.0
- [x] `npm run lint:api`, `type-check:api`, `type-check:web`, `type-check:marketing` pass
- [x] `npm run test:api` passes against the local compose Postgres
- [x] `npm run test:web` passes
- [ ] The `ci` workflow is green on PR #10

## Dependencies

- Blocked by: SEC-011
- Blocks: the M21 PR (#10; its `ci` fails on this audit step)
- Related: INFRA-020

## Validation

Run the commands above locally, then check the GitHub Actions run.

## Risks / considerations

- The override takes `typeorm` across two `glob` majors. The only call is `glob.sync(pattern)`
  with no options; the API test suite covers the data source and migrations. Revisit the override
  on each `typeorm` upgrade.

## Implementation notes

Runtime dependency change with no contract change: PATCH bump (0.103.3 -> 0.103.4) and CHANGELOG entry.

## Completion

- Implementation: root `package.json` `overrides.typeorm.glob` 14.0.3; `package-lock.json` bumps
  `follow-redirects` 1.16.1 -> 1.16.2, `glob` 10.5.0 -> 14.0.3, `minimatch` 9.0.9 -> 11.0.3,
  `path-scurry` 1.11.1 -> 3.0.0 and `lru-cache` 10.4.3 -> 11.5.3, and drops the `glob` 10 helper
  packages (`jackspeak`, `foreground-child`, `@isaacs/cliui` and its `*-cjs` aliases). Version
  0.103.3 -> 0.103.4 (PATCH).
- Tests: `npm audit --omit=dev` 0 vulnerabilities. `require('glob').sync` through
  `tslib.__importStar` (the way `typeorm` imports it) returns results.
  `lint:api`, `type-check:api`, `type-check:web`, `type-check:marketing` pass; `test:api` 73 files,
  616 tests (local compose Postgres, migration apply and revert included); `test:web` 111 files,
  743 tests. `npm run docs:marketing-sync` passed.
- CI: pending the PR #10 run after push.
