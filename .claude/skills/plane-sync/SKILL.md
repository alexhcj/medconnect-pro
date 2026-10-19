---
name: plane-sync
description: Sync docs/tasks to the Plane workspace safely (dry run first, then real sync on confirmation).
disable-model-invocation: true
model: haiku
allowed-tools: Bash(npm run plane:sync:dry) Bash(npm run test:plane)
---

# Plane sync

1. Run `npm run plane:sync:dry`. Summarize only: items to create, items to update, errors.
   Do not paste the full output.
2. If there are errors, show them and stop.
3. Ask: "Run the real sync?" Only on an explicit yes, run `npm run plane:sync` and report
   the counts. Never read `scripts/plane/.env`.
