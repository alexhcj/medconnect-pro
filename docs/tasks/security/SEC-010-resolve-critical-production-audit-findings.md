---
id: SEC-010
type: task
area: security
feature: dependency-security
status: implemented
priority: high
estimate: 2
dependencies: [QA-011]
related_adrs: [ADR-007-semantic-versioning.md]
related_docs:
  [
    ../qa/QA-011-fix-api-type-check-for-green-ci.md,
    ../infrastructure/INFRA-020-checks-gated-deploys-and-pr-workflow.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: b86e32a7-b23d-455d-820e-29652fb3be9c
  identifier: MEDCONNECT-137
---

# SEC-010 — Resolve critical production audit findings

## Objective

`npm audit --omit=dev` exits 0, so the last step of the `ci` job passes without weakening the gate.

## Context

Split from QA-011. After the API type error is fixed, `ci.yml` still ends with
`npm audit --omit=dev` (no `continue-on-error`). On 2026-10-23 it reports 3 critical findings:

- `next` 16.3.8 (`apps/web/package.json`, `apps/marketing/package.json`): GHSA-2464-fhr4-w9xw
  (image optimization with SVG), GHSA-p3m5-59mp-jv5r (Server Actions DoS),
  GHSA-673q-mjm6-r5xr (`use cache` typed arrays). The advisory fix is `next@16.4.2`, outside the
  pinned version.
- `seroval` <= 1.6.2 and `solid-js` (transitive): fixable with `npm audit fix`.

A red `ci` stops every `checksPass` deploy (INFRA-020), so this blocks the deploy gate.

## Scope

- Establish which of the three findings affect this app (for example, whether the web app uses
  Server Actions, `use cache`, or SVG image optimization) and record that in Completion.
- Upgrade `next` (and `eslint-config-next`, which is pinned to the same version) in `apps/web` and
  `apps/marketing` to a patched release. Resolve the `seroval` / `solid-js` path.
- Read the relevant guide in `node_modules/next/dist/docs/` before changing anything that depends
  on Next APIs (`apps/web/AGENTS.md`).
- Keep the root `package-lock.json` in step.

## Out of Scope

- Non-production (dev dependency) advisories.
- Weakening the audit step, adding `--audit-level`, or `continue-on-error`.
- Feature work on the web or marketing apps.
- Other major dependency upgrades.

## Requirements

- Ask before adding or changing a dependency (`CLAUDE.md`), and name each version change.
- No behaviour change. Web and marketing builds, tests and `e2e:mocks` stay green.
- If a patched release needs code changes beyond a version bump, stop and split again.

## Acceptance criteria

- [x] `npm audit --omit=dev` exits 0
- [x] `npm run build:production`, `npm run build:marketing` and `npm run build:api` pass
- [x] `npm test`, `npm run lint`, `npm run type-check` (web) and `npm run test:api` pass
- [x] `npm run e2e:mocks` passes
- [ ] The `ci` workflow is green on `main` after the push
- [x] Completion records which advisories applied to this app and the version changes

## Dependencies

- Blocked by: QA-011 (type-check must pass first so the audit step is reachable)
- Blocks: INFRA-020
- Related: INFRA-019 (Render preview builds use the same `next`)

## Validation

Run the commands above locally, then check the GitHub Actions run. Smoke the Render marketing
preview (INFRA-019) on the PR.

## Risks / considerations

- The patched `next` is a minor bump outside the pinned range. Next.js in this repo is newer than
  common knowledge, so read its bundled docs first and watch for deprecations.
- Both web and marketing share `next`; upgrade them together to avoid a split lockfile.
- If no patched release is acceptable, the fallback is a documented, time-boxed exception, which
  needs your decision and an ADR/doc note, not a silent CI change.

## Implementation notes

Runtime dependency change with no contract change: PATCH bump and CHANGELOG entry on 0.x.

## Completion

- Implementation: `next` and `eslint-config-next` 16.3.8 -> 16.4.2 (exact pins) in `apps/web` and
  `apps/marketing`. `@tanstack/react-query-devtools` moved from `dependencies` to
  `devDependencies` in `apps/web` (user-approved), which takes `seroval` / `solid-js` out of the
  production tree. Root `package-lock.json` regenerated. Version 0.97.0 -> 0.97.1 (PATCH).
- Tests: `npm audit --omit=dev` exits 0; `npm run lint`, `type-check`, `npm test` (web 553,
  marketing 48), `test:api` (616; first run had transient Postgres-unreachable failures, rerun
  73/73 files green), `build:production`, `build:marketing`, `build:api` and `e2e:mocks` (35/35)
  all pass locally.
- PR: none; the plan is a direct push to `main`. Not yet committed or pushed; pending the user's go-ahead. The `ci`-green-on-`main`
  criterion stays unticked until the run is checked.
- Notes: Advisory applicability. GHSA-p3m5-59mp-jv5r (Server Actions): no `'use server'` in
  `apps/`, not reachable. GHSA-673q-mjm6-r5xr (`use cache`): no `'use cache'` or `cacheComponents`,
  not reachable. GHSA-2464-fhr4-w9xw (SVG image optimization): marketing is a static export with
  `images.unoptimized`; the web app does not use `next/image` but its server build exposes the
  default `/_next/image` endpoint, so treat it as potentially reachable. The upgrade fixes all
  three. `seroval` / `solid-js` came only via the React Query devtools. Dev-tree advisories remain
  and are out of scope. Render web and marketing builds, Amplify and CI use plain `npm ci`
  (installs dev dependencies), so the layout's devtools import still resolves.
