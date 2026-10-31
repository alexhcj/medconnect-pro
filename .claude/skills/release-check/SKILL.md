---
name: release-check
description: Full read-only pre-release check of MedConnect (CI gates, builds, audit, mock e2e, docs/version lockstep, Render smoke, browser walkthrough) ending in a GO/NO-GO report. Use when the user asks to check the app before a release or tag.
argument-hint: "[target version, e.g. 1.0.0] [--base <ref>] [--skip ci,db,build,e2e,browser,hosted]"
disable-model-invocation: true
model: opus
effort: high
allowed-tools: Read Grep Glob Bash(git status *) Bash(git diff *) Bash(git log *) Bash(git branch *) Bash(git rev-list *) Bash(git rev-parse *) Bash(git describe *) Bash(git tag --list *) Bash(git fetch *) Bash(gh run list *) Bash(gh pr list *) Bash(node -e *) Bash(npm run ci:secrets) Bash(npm run test*) Bash(npm run lint*) Bash(npm run type-check*) Bash(npm run build*) Bash(npm run docs:marketing-sync) Bash(npm run e2e:mocks*) Bash(npm run migration:run) Bash(npm audit *) Bash(curl *) Bash(terraform version) Bash(terraform fmt *)
---

# Release check

Source list: `docs/workflows/release.md` (steps 1–12; "When to run the release check" says where
this fits). CI mirror: `.github/workflows/ci.yml`. Hosted smoke: `docs/workflows/deploy-render.md`
"Smoke". Arguments: `$ARGUMENTS`.

## Rules

- Read-only. No file edits, no `npm install`, no version bump, no commit, tag or push, no docker,
  no Render or GitHub changes. `git fetch` is the only ref update allowed.
- A FAIL does not stop the run: record it and continue. Do not fix anything.
- Long or noisy commands go to the `test-runner` subagent (it returns only failures). Run the
  mock e2e suite in the background while the other stages run.
- Each check gets one result: PASS, FAIL, SKIPPED (with the command to run it), MANUAL (only the
  user can do it) or NOTE (informational, never changes the verdict).

## Mode and base

- **Mode.** No target version, or a target above the current root version: **pre-bump** (all
  stages). Target equal to the current root version: **post-bump**. In post-bump mode the default
  skip set is `ci,db,build,e2e,browser` when the code is unchanged since the last pre-bump GO; say
  so in the report.
- **Base ref** for "what is in this release" (migrations, CHANGELOG range): `--base <ref>` if
  given; otherwise the newest `v*` tag (`git tag --list "v*" --sort=-v:refname`) if its version is
  the CHANGELOG entry just below the current one; otherwise there is no usable base: report NOTE
  "no release tag for the previous version" and use `origin/main` when HEAD is not `origin/main`.
  A missing or stale tag is never a FAIL (tags start at `v1.0.0`).

## Stages

1. **Repo state**: `git fetch origin`; current branch; clean tree (`git status --short`); unpushed
   commits (`git status -sb`, FAIL if HEAD is ahead of its upstream: CI never saw them);
   ahead/behind `origin/main` (`git rev-list --left-right --count origin/main...HEAD`). If HEAD is
   not `origin/main`, check whether the release content already matches main
   (`git diff --stat origin/main HEAD`) and NOTE what is not on `main` yet. `ci` on the commit being
   released: `gh run list --workflow ci --branch <branch> --limit 1 --json headSha,conclusion`;
   PASS only when `headSha` equals HEAD and the conclusion is `success`. If `gh` fails, MANUAL
   "confirm `ci` is green on <sha>".
2. **Version and docs lockstep**: these must name the same version: root `package.json`, the
   `package-lock.json` root, the top `CHANGELOG.md` entry (read the top entry only), the
   `docs/marketing/capability-matrix.md` "Last synced release" line, the
   `docs/roadmap/release-roadmap.md` **Current position** paragraph, the `AGENTS.md` "Current:"
   line and the `README.md` "Development status" section (version and milestone states). Pre-bump: the target must be one valid increment from the current version
   (`.claude/rules/versioning.md`); `1.0.0` is MANUAL "needs your explicit approval" (ADR-007,
   INFRA-021). Post-bump: every tracker must already say the target. List pending tasks in
   `docs/tasks/00-master-task-list.md` that block the target (for 1.0.0: INFRA-021 dependencies,
   and M20/M21 not yet closed by the user). Run `npm run docs:marketing-sync`. Delegate the tracker
   cross-check to the `docs-sync-checker` subagent with a release-wide brief (all trackers against
   the current version, not one task). Doc gaps that do not change a version or a status are NOTE.
3. **CI gates** (`--skip ci` skips; same commands as `ci.yml`, via `test-runner`): `ci:secrets`,
   `test:ci-secrets`, `test:marketing-sync`, `test:amplify-buildspec`, `test:preview-delivery`,
   `test:render-previews`, `test:production-delivery`, `test:ensure-app-role`, `test:plane`, then
   `lint`, `lint:api`, `type-check`, `type-check:api`, `test` (web and marketing). Terraform: if
   `terraform version` works, `terraform fmt -check -recursive infra/terraform`; otherwise
   SKIPPED (CI also runs `validate`).
4. **API DB tests** (`--skip db` skips): probe Postgres with
   `node -e "require('net').connect(5432,'127.0.0.1').on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))"`.
   Reachable: `npm run migration:run`, then `npm run test:api` via `test-runner`. Not reachable:
   SKIPPED with `docker compose up -d postgres`, `npm run migration:run`, `npm run test:api`.
   Never start docker yourself.
5. **Builds and audit** (`--skip build` skips; via `test-runner`): `npm run build:production`,
   `npm run build:marketing` with `NEXT_PUBLIC_SITE_URL=https://marketing.medconnectpro.app` and
   `NEXT_PUBLIC_APP_ORIGIN=https://medconnectpro.app`, `npm run build:api`,
   `npm audit --omit=dev`. High or critical advisories are FAIL; list the rest.
6. **Mock e2e** (`--skip e2e` skips): `npm run e2e:mocks` via `test-runner`, in the background.
7. **Browser walkthrough** (`--skip browser` skips; local dev servers only): `preview_start` the
   `web-mocks` and `marketing` configurations from `.claude/launch.json`.
   - Web: for each demo role on the `/login` account picker (practice admin, provider, nurse,
     receptionist, patient; super admin if listed), use one-tap fill, sign in, open the pages
     that role can reach (dashboard, patients, schedule/calendar, telehealth, billing,
     notifications, settings), then sign out. Note blank pages, error states and
     `read_console_messages` errors with the URL.
   - One pass at the mobile preset on the dashboard and `/login`.
   - Marketing: home renders, the sign-in link points at the web app `/login`, the response sets
     no `mcp_access`, `mcp_refresh`, `mcp_mfa` or `mcp_csrf` cookie.
   - Save one screenshot per role to the scratchpad. Afterwards reset the viewport to desktop and
     stop both servers.
8. **Hosted Render smoke** (`--skip hosted` skips). Unauthenticated reads only; the live demo is
   what `main` last deployed, so say which commit it serves (Render deploy history if available,
   otherwise NOTE). `curl -sS -i --max-time 90` (the free API takes 45–60 s to wake; ping
   `/health` first). Hosts from `render.yaml`:
   - `https://api.medconnectpro.app/health` returns `{"status":"ok"}`; `/ready` reports ready;
     `/api/docs` does not serve Swagger UI.
   - `https://medconnectpro.app/` redirects to `/login`. `/login` renders its demo accounts on the
     client, so read it with the built-in browser (`get_page_text`), not curl, and do not sign in.
   - `https://marketing.medconnectpro.app/` returns 200, sets no cookie, and links to
     `https://medconnectpro.app/login`. In the built-in browser at 320 px wide, `/`, `/about`,
     `/architecture`, `/security` and `/demo` have no horizontal scroll
     (`document.documentElement.scrollWidth` equals the viewport width). Reset the viewport after.
   - MANUAL (the skill does not enter credentials on the live demo): sign in as
     `practice.admin@example.test`, reload and open a patient list; change one synthetic record;
     upload and download a document; client IP in the API logs; Render free-instance hours.
9. **Release-only items**, all MANUAL: review migrations changed since the base ref
   (`git diff --name-only <base>..HEAD -- apps/api/src/persistence/migrations`) for rollback
   implications (none changed: PASS instead); review the lane's Render preview; release notes from
   the INFRA-012 template; tag and GitHub release (only on your explicit go, on the `main` commit
   whose `ci` is green).

## Report

1. One line: mode, target, base ref, HEAD sha and whether it is on `origin/main`.
2. One table: `Stage | Check | Result | Evidence`. Evidence is one line: `path:line`, the
   failing test or rule, or the command to run for SKIPPED.
3. Verdict:
   - **NO-GO**: any FAIL, a version/tracker mismatch, or unpushed commits.
   - **GO with manual items**: no FAIL, some SKIPPED or MANUAL.
   - **GO**: everything PASS (NOTE lines allowed).
4. Manual checklist for the user (MANUAL and SKIPPED items).
5. Next step: the fixes to make (suggest `/new-task` for defects), `/implement-task INFRA-021` (or
   the release task for the target) after a pre-bump GO, or the tag after a post-bump GO.

No recap of commands outside the table.
