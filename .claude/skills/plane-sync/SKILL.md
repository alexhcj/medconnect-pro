---
name: plane-sync
description: Sync docs/tasks to the Plane workspace safely (dry run first, then real sync on confirmation). Optional task IDs or --changed.
argument-hint: "[TASK-ID ...| --changed]"
disable-model-invocation: true
model: haiku
allowed-tools: Bash(npm run plane:sync:dry) Bash(npm run plane:sync:dry -- *) Bash(npm run test:plane)
---

# Plane sync

Arguments: $ARGUMENTS (task IDs such as `FE-040 BE-025`, or `--changed`; none means every task).

1. Run `npm run plane:sync:dry -- $ARGUMENTS` (plain `npm run plane:sync:dry` when empty).
   Summarize only: items to create, items to update, errors. Do not paste the full output.
2. If there are errors, show them and stop.
3. Ask: "Run the real sync?" Only on an explicit yes, run `npm run plane:sync -- $ARGUMENTS`
   and report the counts. Never read `scripts/plane/.env`.
4. A real run writes `plane.work_item_id` and `plane.identifier` into task files, so run it
   before committing. For new tasks being committed, `/commit-tasks` does this automatically.
