---
id: SEC-010
type: task
area: security
feature: dependency-security
status: pending
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
  status: not_started
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

- [ ] `npm audit --omit=dev` exits 0
- [ ] `npm run build:production`, `npm run build:marketing` and `npm run build:api` pass
- [ ] `npm test`, `npm run lint`, `npm run type-check` (web) and `npm run test:api` pass
- [ ] `npm run e2e:mocks` passes
- [ ] The `ci` workflow is green on `main` after the push
- [ ] Completion records which advisories applied to this app and the version changes

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

- Implementation:
- Tests:
- PR:
- Notes:
