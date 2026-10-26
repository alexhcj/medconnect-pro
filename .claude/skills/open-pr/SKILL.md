---
name: open-pr
description: Generate the pull request body for the current branch from the task file, git diff and CHANGELOG, fill every section of the PR template, mark the manual items, then open or update the PR. Use when the user asks to open, create, or refresh a PR (including fixing a blank template body).
argument-hint: "[TASK-ID] [--update <PR#>]"
disable-model-invocation: true
model: sonnet
allowed-tools: Read Grep Glob Bash(git status *) Bash(git diff *) Bash(git log *) Bash(git branch *) Bash(git push *) Bash(gh pr view *) Bash(gh pr create *) Bash(gh pr edit *) Bash(gh pr checks *)
---

# Open or update a PR with a generated body

Flow and lane rules: `docs/workflows/delivery-lanes.md` ("PR body"). Template:
`.github/pull_request_template.md`. Never leave the raw template in a PR.

1. Resolve the task ID from `$0`, else the branch name or newest commit subject. Read
   `docs/tasks/**/<ID>-*.md` (front matter `plane.identifier`, title, acceptance criteria,
   Completion section). Several IDs on one branch: list all, use the strictest lane.
2. Collect facts, no guessing: `git diff --name-only main...HEAD`, `git log main..HEAD --format=%s`,
   root `package.json` version on `main` vs `HEAD`, top `CHANGELOG.md` entry only.
3. Fill the template, section by section:
   - **Task**: ID(s); Plane identifier from the task file; lane from the changed paths (lane
     table in `delivery-lanes.md`); then 1-3 sentences: what changed and why, in the project's
     words. Title format: `<ID> <short title>` (no `Docs/…` branch-name titles).
   - **Preview**: tick one box from the lane. If "needed", write under the box that the
     `render-preview` label must be added by the user (manual).
   - **Versioning**: tick exactly one box from the version diff; write `old → new` and the
     classification reason. No bump: `Version: <current> → <current>`.
   - **Checklist**: tick an item only when the diff proves it (task file, roadmap, `AGENTS.md`,
     master list, `CHANGELOG.md`, `docs/product/` + capability matrix touched or "none changed" with
     a reason). Never tick `ci` is green: leave it unticked (manual).
   - **Notes**: verification actually run (command and result, as in the task Completion),
     deviations, and every manual step below that still applies.
4. Always add a **Manual before merge** block listing what only the user can do or confirm:
   `render-preview` label (UI/marketing), `ci` green (tick after the check passes), reviewing the
   preview URL, operator steps named in the task Completion (Render dashboard, AWS apply,
   branch protection), and any acceptance criterion left unticked. State "none" if empty.
5. Show the full body and title to the user and wait for approval. Then: new PR → `git push -u
   origin HEAD` and `gh pr create --title … --body-file …`; existing PR (`--update <PR#>`) →
   `gh pr edit <PR#> --body-file …`. Write the body file to the scratchpad, not the repo.
6. End the body with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
   Report the PR URL. Never enable auto-merge, never merge.
