# Release Workflow

1. Validate tasks and acceptance criteria.
2. Confirm `CHANGELOG.md` matches shipped changes and `package.json` version. `1.0.0` requires
   explicit human approval; later releases follow [versioning.md](versioning.md).
3. Run lint.
4. Type-check.
5. Unit/integration/API tests.
6. E2E critical workflows.
7. Build frontend/backend.
8. Dependency/security scan.
9. Review migration and rollback implications.
10. Verify environment configuration (`local` / `preview` / `production` — not development or
    staging).
11. Verify synthetic demo data.
12. Review the advertised Amplify preview URL (after quality CI). Preview uses the shared
    preview API and preview/demo database, not production.
13. Merge to `main` only after quality CI is green. Amplify Git publishes the production web
    from `main`. Quality CI on `main` must succeed before
    [`.github/workflows/production-deploy.yml`](../../.github/workflows/production-deploy.yml)
    migrates and rolls ECS (preview API first, then production API behind the GitHub
    `production` environment).
14. Smoke `/health` and `/ready` on the production API URL after the production ECS job.
    Full production smoke is
    [INFRA-013](../tasks/infrastructure/INFRA-013-v1.0.0-production-release-readiness.md).

Do not deploy production from a feature branch. Do not add a second Amplify publisher in GitHub
Actions.

## Failure and rollback

| Event | Behavior |
| --- | --- |
| CI fails on a pull request | No advertised preview URL |
| CI fails on `main` | No production ECS deploy |
| Preview ECS deploy fails | Production ECS job does not start; previous preview revision remains |
| Production ECS deploy fails | Previous production task definition remains (circuit breaker) |
| Amplify `main` fails | Previous successful production web remains |
| Database | Forward-fix migrations; revert only with explicit `workflow_dispatch` confirmation |

Rollback steps and the dry-run drill:
[deploy.md](deploy.md#rollback-drill).
