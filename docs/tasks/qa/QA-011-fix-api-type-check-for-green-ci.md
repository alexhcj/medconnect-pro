---
id: QA-011
type: task
area: qa
feature: testing
status: implemented
priority: high
estimate: 1
dependencies: []
related_adrs: []
related_docs:
  [
    ../backend/BE-021-telehealth-eligibility-and-lifecycle.md,
    ../infrastructure/INFRA-020-checks-gated-deploys-and-pr-workflow.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: ce4e3cdb-827f-477d-a150-d395749eef5e
  identifier: MEDCONNECT-136
---

# QA-011 — Fix API type-check error so CI runs green

## Objective

`npm run type-check:api` exits 0 and the `ci` workflow passes on `main`.

## Context

CI first ran on `main` after INFRA-019 and failed at "Type-check api" on one error in
`apps/api/src/telehealth/telehealth-session.service.spec.ts:398` (`TS2322`). The harness mock
`transitionWaitingToInSession` is `vi.fn(async …)` at line 99, so its inferred return type is
`Promise<TelehealthSession>`. The repository method returns `Promise<TelehealthSession | undefined>`
(`telehealth-session.repository.ts:78`). The test correctly mocks "another join won the race" with
`undefined`, which the inferred type rejects. It arrived with BE-021 (2026-10-10) and went
unnoticed because CI was not running on `main`.

INFRA-020 makes Render deploys wait for the `ci` check (`checksPass`). With a red `ci`, `main`
would stop deploying, so this lands first.

## Scope

- Type the `transitionWaitingToInSession` mock to the repository signature so `undefined` is
  allowed. Alternatively, cast at the single call site.
- Run every step of the `ci` job locally and fix anything else a green run uncovers (a later step
  could fail once type-check passes).

## Out of Scope

- Any change to `telehealth-session.service.ts` or the repository.
- Unrelated test refactoring.
- The `API image` and `Production deploy` workflow failures (AWS lane, M9 paused).

## Requirements

- No behaviour change. The test must still assert that a lost race does not double-audit.
- No `@ts-ignore` or `any`. Prefer fixing the mock type.

## Acceptance criteria

- [x] `npm run type-check:api` exits 0
- [x] `telehealth-session.service.spec.ts` passes with the same intent:
      `npm run test:api -- telehealth-session.service`
- [x] `lint:api`, `type-check`, `lint`, `test`, `test:api` and the build steps in `ci.yml` pass
      locally
- [x] On `main` after the push, every `ci` step up to and including "Build api" passes. The final
      "Audit production dependencies" step is expected to stay red until SEC-010.

## Dependencies

- Blocked by: none
- Blocks: SEC-010, INFRA-020
- Related: SEC-010 (the `npm audit --omit=dev` step also fails with 3 critical findings; split out
  because a dependency upgrade is not test-only), BE-021 (introduced the error), INFRA-019 (surfaced it), QA-008 and QA-009 (precedent)

## Validation

Run the commands above, then check the GitHub Actions run. The `test:api` step needs the Postgres
service CI provides; confirm that one on GitHub if it cannot run locally.

## Risks / considerations

- A second failure may be hidden behind this one in later CI steps. If any needs more than a
  test-only fix, stop and split it out.

## Implementation notes

Test only: no version bump and no CHANGELOG entry (QA-008 and QA-009 precedent).

## Completion

- Implementation: `telehealth-session.service.spec.ts:99` typed the `transitionWaitingToInSession` mock as `Promise<TelehealthSession | undefined>` (matches the repository). Test body unchanged.
- Tests: `type-check:api` exit 0; `telehealth-session.service` 18 tests pass; `lint:api`, web `type-check` and `lint`, `build:production`, `build:marketing`, `build:api` pass locally.
- PR:
- Notes: CI run 39929362866 on `f8a17a7`: every step through "Build api" passed. The final audit step stays red until SEC-010 (3 critical findings).
