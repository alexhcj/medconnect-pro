---
name: commit-tasks
description: Commit new or changed task specs (e.g. after a new milestone is created and accepted) by syncing them to Plane first, so the written-back Plane ids land in the commit. Use when the user asks to commit and docs/tasks has new or changed task files.
argument-hint: "[commit message hint]"
model: sonnet
allowed-tools: Read Grep Glob Bash(git status *) Bash(git diff *) Bash(git log *) Bash(git add *) Bash(git commit *) Bash(npm run plane:sync:dry -- *) Bash(npm run plane:sync -- *) Bash(npm run test:plane)
---

# Commit tasks (Plane sync, then commit)

Sync writes `plane.work_item_id` and `plane.identifier` back into each task file, so it must run
before the commit. Flow: `scripts/plane/README.md`.

1. `git status`. Collect task IDs from new or modified files under `docs/tasks/<area>/` whose
   front matter has no `plane.work_item_id`. If there are none, skip to step 5 (ordinary commit).
2. `npm run plane:sync:dry -- <IDs>` (explicit IDs, never `--changed`, so unrelated dirty task
   files are not pushed). Summarize creates, updates and errors only. On any error, show it and stop.
3. The user's request to commit is the go-ahead: run `npm run plane:sync -- <IDs>`. Never read
   `scripts/plane/.env`. If the env is missing or Plane is unreachable, stop and report; do not commit.
4. Confirm each task file now has `work_item_id` and `identifier`; report the identifiers.
5. Stage files by name (task files, `00-master-task-list.md`, roadmap, and any skill or doc
   changes that belong to this change). No `git add -A`.
6. Commit in repo style (`docs(roadmap): …`, short body, `$ARGUMENTS` as a hint). No
   `Co-Authored-By` trailer. Docs-only: no version bump or CHANGELOG entry.
7. Never push or tag. Report the commit hash and the Plane identifiers.
