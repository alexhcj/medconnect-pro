---
id: INFRA-005
type: task
area: infrastructure
feature: deployment
status: implemented
priority: high
estimate: 2
dependencies: [INFRA-002, QA-001, BE-001]
related_adrs: [ADR-008, ADR-009]
related_docs:
  [
    infrastructure-architecture.md,
    ../workflows/frontend-testing.md,
    ../roadmap/release-roadmap.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: f786a69a-5e8c-42ca-93d9-e8d95a2b2a47
  identifier: MEDCONNECT-61
---

# INFRA-005 — GitHub Actions CI quality gates

## Objective

Run pull-request and `main` CI that installs dependencies, lints, type-checks, tests, and builds
the frontend and backend. Fail closed. Do not deploy.

## Context

Why this task exists: the architecture already names GitHub Actions; `.github/` does not exist.
Quality gates must exist before preview or production deploy jobs attach in INFRA-010 and
INFRA-011.

Already present: workspace scripts (`lint` / `lint:api`, `type-check` / `type-check:api`,
`test` / `test:api`, `build` / `build:api` / `build:production`). API tests require PostgreSQL
(`docker compose up -d` locally).

## Scope

- Add `.github/workflows/ci.yml` on `pull_request` and `push` to `main`.
- Use Node 24 from `.nvmrc`.
- Run existing root and workspace scripts: `lint` / `lint:api`, `type-check` / `type-check:api`,
  `test` / `test:api`, frontend build (`build:web` or `build:production`), `build:api`.
- Provide a Postgres service container for `test:api` (same requirement as local Compose).
- Frontend Vitest. Playwright **mock** e2e only if it is stable in GitHub Actions without extra
  services.
- Do **not** run `e2e:live` on every PR. That is release smoke in
  [INFRA-013](INFRA-013-v1.0.0-production-release-readiness.md).
- At most one dependency/security check that matches current tooling (for example
  `npm audit --omit=dev`). No second coverage vendor.

## Out of scope

- Deploy jobs, Docker publish, Terraform plan/apply
- Dependabot solely to add another CI surface
- Preview or production hosting
- Rewriting the test stack (Vitest + Playwright stay; do not add Jest)

## Requirements

- A failing lint, type-check, test, or build blocks merge.
- Workflow files contain no secrets, tokens, or real PHI.
- Use synthetic fixtures only.
- Do not add redundant stages that repeat the same command.

## Technical constraints

- Follow [ADR-008](../../decisions/ADR-008-frontend-testing-stack.md) and
  [ADR-009](../../decisions/ADR-009-npm-workspace-monorepo.md).
- Install from the repository root so npm workspaces resolve.
- Do not introduce unnecessary dependencies.
- Do not claim HIPAA compliance.

## Acceptance criteria

- [x] `.github/workflows/ci.yml` runs on pull requests and on push to `main`
- [x] Failing lint, type-check, test, or build fails the workflow
- [x] API tests have PostgreSQL available in CI
- [x] Workflow files contain no secrets
- [x] [infrastructure-architecture.md](../../architecture/infrastructure-architecture.md) CI
      section describes the jobs that actually run (replace the unused 11-step target list)

## Dependencies

- Blocked by: INFRA-002, QA-001, BE-001 (completed)
- Independent of AWS and of INFRA-004
- Related: INFRA-010 and INFRA-011 later attach deploy jobs to this pipeline

## Validation

- Open a pull request or run `workflow_dispatch` and confirm red/green behavior.
- Confirm `test:api` is not skipped for lack of Postgres.
- Confirm the workflow YAML has no embedded credentials.

## Documentation impact

- infrastructure-architecture CI section
- Root README validation commands
- release-roadmap shipped/pending split for this ID when the task ships

## Risks / considerations

- Root `lint` currently targets the web workspace only; CI must invoke `lint:api` and
  `type-check:api` explicitly.
- INFRA-001 historically noted a typescript-eslint / TypeScript mismatch on web lint. Use the
  commands that work today; fix a broken lint entrypoint if it would make CI permanently red.
- Playwright mock e2e in GHA can be flaky (browsers, OS). Prefer skipping it over a red-for-noise
  gate.

## Implementation notes

Suggested implementation order: parallel with INFRA-004. First CI-only workflow; no deploy keys.

Later shipping of this slice is a MINOR bump on 0.x (new public CI surface). Writing the spec is
not a version bump.

## Completion

- Implementation: `.github/workflows/ci.yml` on `pull_request`, `push` to `main`, and
  `workflow_dispatch`. Node 24, `npm ci`, Postgres 18 service, `migration:run`, then lint /
  type-check / test / `build:production` / `build:api` / `npm audit --omit=dev`. No deploys or
  Playwright. Compose Postgres bumped to `postgres:18-alpine`. Web lint entrypoint uses ESLint 9
  + Next flat config so CI is not permanently red.
- Tests: local `lint`, `lint:api`, `type-check`, `type-check:api`, web Vitest (259), API Vitest
  (342) against Postgres 18, `build:production`, `build:api`, `npm audit --omit=dev`.
- PR:
- Notes: Mark the GitHub `ci` check required on `main` for merge fail-closed. Production deploy
  gates remain INFRA-011. Do not claim HIPAA compliance.
