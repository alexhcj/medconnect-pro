---
id: SEC-011
type: task
area: security
feature: dependency-security
status: implemented
priority: high
estimate: 1
dependencies: [SEC-010]
related_adrs: [ADR-007-semantic-versioning.md]
related_docs:
  [
    SEC-010-resolve-critical-production-audit-findings.md,
    ../infrastructure/INFRA-020-checks-gated-deploys-and-pr-workflow.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: 61bf3232-7256-44e4-bb7d-3c498c74c714
  identifier: MEDCONNECT-139
---

# SEC-011 — Resolve production audit regressions

## Objective

`npm audit --omit=dev` exits 0 again, so the `ci` job passes and `checksPass` deploys (INFRA-020)
are not held back by advisories published after SEC-010.

## Context

SEC-010 cleared the findings that existed on 2026-10-23. On 2026-10-25 the same `ci` step failed
on PR #4 (FE-049) with 6 findings (5 high, 1 moderate) in packages that PR did not touch:
`body-parser` 2.0.0–2.3.0, `fast-uri` 3.0.0–3.1.8, `zod` < 4.6.6 and `multer` 2.0.0–2.4.0.
`@nestjs/platform-express` (12.1.2 and the latest 12.2.0) pins `multer` to exactly 2.4.0, and npm's
suggested fix is a downgrade to `@nestjs/platform-express@11.1.1`.

## Scope

- Update `zod`, `body-parser` and `fast-uri` to patched releases in `package-lock.json` only.
- Add a root `overrides` entry `"multer": "2.5.0"` and refresh the lockfile.
- Keep `@nestjs/*` at 12.1.2. `npm audit fix` also moved `@nestjs/core` and `platform-express` to
  12.2.0 while `@nestjs/common` stayed at 12.1.2, which broke the API at import time
  (`SSE_OPTIONS_METADATA`); that bump is not part of this task.

## Out of Scope

- Dev-only advisories (the full tree still reports 2 high and 2 critical).
- Weakening the audit step or adding `--audit-level`.
- Upgrading `@nestjs/*` or other major dependencies. Remove the `multer` override when NestJS ships
  a platform-express that depends on a patched `multer`.

## Requirements

- Ask before adding or changing a dependency (`CLAUDE.md`), and name each version change.
- No behaviour change. Document upload, validation and request parsing stay green.

## Acceptance criteria

- [x] `npm audit --omit=dev` exits 0
- [x] `npm ci` installs from the lockfile and `npm ls` shows `multer` 2.5.0, `zod` 4.6.7,
      `body-parser` 2.4.0, `fast-uri` 3.1.9, `@nestjs/*` 12.1.2
- [x] `npm run lint:api`, `type-check:api`, `type-check:web`, `type-check:marketing` pass
- [x] `npm run test:api` passes against the local compose Postgres, including
      `test/documents.http.spec.ts` (document upload via `multer`)
- [x] `npm run test:web` and `npm run test:marketing` pass
- [ ] The `ci` workflow is green on the PR and on `main` after the merge

## Dependencies

- Blocked by: SEC-010
- Blocks: the FE-049 PR (its `ci` fails on this audit step)
- Related: INFRA-020

## Validation

Run the commands above locally, then check the GitHub Actions run.

## Risks / considerations

- The `multer` override sits outside NestJS's pin. It is a minor bump of the library behind
  document upload; the upload spec covers it, and the override must be revisited on each NestJS
  upgrade.
- New advisories can fail `ci` again at any time. That is the audit gate working as intended.

## Implementation notes

Runtime dependency change with no contract change: PATCH bump (0.97.3 -> 0.97.4) and CHANGELOG entry.

## Completion

- Implementation: root `package.json` `overrides.multer` 2.5.0; `package-lock.json` bumps `multer`
  2.4.0 -> 2.5.0, `zod` 4.6.5 -> 4.6.7, `body-parser` 2.3.0 -> 2.4.0, `fast-uri` 3.1.8 -> 3.1.9.
  `apps/web/package.json` mirrors the version. Version 0.97.3 -> 0.97.4 (PATCH).
- Tests: `npm audit --omit=dev` 0 vulnerabilities. In a clean `npm ci` worktree: `lint:api`,
  `type-check:api`, `type-check:web`, `type-check:marketing`, `test:web` (556), `test:marketing`
  (51) and `test:api` (73 files, 616 tests, with the local compose Postgres) all pass, including
  `documents.http.spec.ts` (6 of 6).
- Not verified: the `ci` run on the PR and on `main` (criterion left unticked).
