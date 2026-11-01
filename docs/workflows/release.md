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
12. Review the lane's Render preview, if the lane has one ([delivery-lanes.md](delivery-lanes.md),
    [ADR-019](../decisions/ADR-019-render-pr-previews.md)). Web previews use frontend mocks and
    never touch the interviewer database. AWS target (M9): the Amplify preview URL against the
    shared preview API and preview/demo database, not production.
13. Merge to `main` only after quality CI is green. Render deploys `main` (interim demo). AWS
    target (M9): Amplify Git publishes the production web from `main`. Quality CI on `main` must
    succeed before
    [`.github/workflows/production-deploy.yml`](../../.github/workflows/production-deploy.yml)
    migrates and rolls ECS (preview API first, then production API behind the GitHub
    `production` environment).
14. Smoke `/health` and `/ready` on the production API URL after the production ECS job.
    Full production smoke is
    [INFRA-013](../tasks/infrastructure/INFRA-013-v1.0.0-production-release-readiness.md).

`/release-check [version]` (`.claude/skills/release-check/`) runs the local and read-only parts
of steps 1–12 plus the Render smoke and ends with a GO / NO-GO report. It does not fix, bump, tag
or deploy.

## When to run the release check

There is no `dev` branch: `main` is the release line, Render deploys it after `ci`, and PR previews
are the only pre-merge environment. So the check runs against the commit that `main` will release,
twice:

1. **Pre-bump, after the last feature merge.** All milestone and fix PRs are merged, `ci` on `main`
   is green, and the release task (for 1.0.0, INFRA-021) has not started. Run
   `/release-check <target>` from an up-to-date `main` (or the release branch cut from it). NO-GO
   means fix tasks first, merged through their own PRs, then run it again. The release task starts
   only after a GO or a GO with manual items you accept. Running it before the release task means
   any fix lands before the version, notes and trackers are written.
2. **Post-bump, before the tag.** The release task bumps the version, writes the CHANGELOG, notes
   and trackers on a release branch. Run `/release-check <target>` again: the target now equals
   the current version, so it checks that every tracker says the target and re-runs only what the
   bump can change (code checks are skipped when the code is unchanged). Merge the release PR, wait
   for `ci` on `main`, and tag that `main` commit.

The check compares against the previous release tag. Before 1.0.0 there is no usable tag (the last
one is `v0.8.1`), so it reports a NOTE and compares against `origin/main` instead. From `v1.0.0`
on, every release is tagged on `main` and the next check diffs against it.

Do not deploy production from a feature branch. Do not add a second Amplify publisher in GitHub
Actions.

## GitHub release notes

`1.0.0` is the Render demo release
([INFRA-021](../tasks/infrastructure/INFRA-021-v1.0.0-demo-release.md), ADR-007 amended
2026-10-28). Its notes are [v1.0.0-release-notes.md](../releases/v1.0.0-release-notes.md); pass
that file to `gh release create --notes-file` or paste it into the GitHub Releases UI.

[github-release-notes-template.md](../releases/github-release-notes-template.md) serves the later
AWS production release (1.x).
[INFRA-013](../tasks/infrastructure/INFRA-013-v1.0.0-production-release-readiness.md) fills every
`[INFRA-013: …]` token after production smoke. Do not auto-publish a GitHub release from CI.

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
