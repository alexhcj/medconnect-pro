---
id: INFRA-011
type: task
area: infrastructure
feature: deployment
status: implemented
priority: high
estimate: 3
dependencies: [INFRA-008, INFRA-009]
related_adrs: [ADR-007, ADR-012]
related_docs:
  [
    infrastructure-architecture.md,
    ../workflows/release.md,
    ../workflows/versioning.md,
    ../roadmap/release-roadmap.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: 3ea5f691-a0aa-4c66-af23-9b51f7820aae
  identifier: MEDCONNECT-67
---

# INFRA-011 — Production delivery workflow and rollback

## Objective

Deploy production Amplify and production ECS from `main`. Define success, failure, and
rollback so a production release can be reversed without inventing a platform.

## Context

Why this task exists: the required delivery path is feature branch → pull request → CI →
preview → review → merge → `main` → production. [release.md](../../workflows/release.md)
still says “deploy to development/staging.”

INFRA-010 is the preferred review gate before production, but this task is not blocked on
it if preview wiring lands in the same change set.

## Scope

- GitHub Actions deploy jobs on `main` after CI: migrate the production database, deploy
  ECS. Amplify already deploys `main` — avoid double-publishing the frontend; document which
  system owns the production web deploy.
- Production approval: a cheap human gate (GitHub environment protection) is enough. Do not
  invent a change-advisory board.
- Failure behavior:
  - CI fails: no production deploy
  - ECS deploy fails: previous task definition remains
  - Amplify fails: previous successful production web remains
- Rollback: redeploy the previous ECS task definition; Amplify redeploy the previous
  successful job or revert the commit; database prefers a forward fix;
  `migration:revert` only with explicit human approval.
- Success: `/health` and `/ready`, Amplify URL serves the production build. Full smoke is
  INFRA-013.

## Out of scope

- Blue/green or canary analysis platforms
- Automatic `1.0.0` tagging (INFRA-013)
- semantic-release or a CI version bot ([ADR-007](../../decisions/ADR-007-semantic-versioning.md))
- Per-environment “development” and “staging” deploys (replaced by preview + production)

## Requirements

- `main` is the only production branch.
- Feature branches cannot deploy production.
- Rollback steps are written and rehearsed at least once in preview or as a documented dry
  run.
- Synthetic demo data only. Never introduce real PHI.

## Technical constraints

- Versioning stays human-owned (ADR-007).
- Do not store long-lived AWS access keys when OIDC works (INFRA-006).
- Do not introduce unnecessary observability.
- Do not claim HIPAA compliance.

## Acceptance criteria

- [x] `main` is the only branch that deploys production Amplify and production ECS
- [x] Feature branches cannot deploy production
- [x] Rollback steps are written and have been rehearsed once (preview or dry run)
- [x] [release.md](../../workflows/release.md) no longer says “deploy to development/staging”
- [x] CI failure, preview failure, and production failure behaviors are documented

## Dependencies

- Blocked by: INFRA-008, INFRA-009
- Preferred: INFRA-010 so preview is the review gate
- Related: INFRA-005, INFRA-013

## Validation

- Merge a no-op or infrastructure change and watch the production deploy path.
- Perform the documented rollback drill on preview if a production drill is too risky.
- Confirm a failing CI run on `main` does not roll a bad image into production.

## Documentation impact

- [release.md](../../workflows/release.md)
- infrastructure-architecture CI/CD section
- Versioning workflow unchanged (no release bot)
- release-roadmap shipped/pending split when this task ships

## Risks / considerations

- Two publishers for the frontend (Amplify Git integration and a GitHub Action) will race.
  Pick one owner and document it.
- Database rollback is the dangerous path. Prefer forward-fix migrations.
- Do not treat a successful Amplify publish as proof the API migrated.

## Implementation notes

Suggested implementation order: after INFRA-008 and INFRA-009; before INFRA-013.

Later shipping of this slice is a MINOR bump on 0.x. Writing the spec is not.

## Completion

- Implementation: `.github/workflows/production-deploy.yml` after CI on `main`; preview ECS then
  GitHub environment `production` for production ECS; `scripts/ci/ecs-deploy.mjs`; hosted
  `run-migrations.ts`; Terraform OIDC `environment:production`, ECS IAM, circuit breaker, and
  `ignore_changes` on service `task_definition`. Amplify Git remains the only web publisher.
- Tests: `npm run test:production-delivery` (workflow contract + dry-run rewrite); API
  `run-migrations.spec.ts`; `terraform validate`.
- PR:
- Notes: Version 0.58.0 → 0.59.0 (MINOR, production delivery). Rollback drill rehearsed as the
  in-repo `dry-run` path (no RegisterTaskDefinition/UpdateService). Live AWS apply, GitHub
  environment `production`, and `PRODUCTION_API_URL` remain operator steps. Do not claim HIPAA
  compliance.
