# Plane Task Synchronization

## Purpose

Synchronize repository task specifications into Plane Work Items.

Direction:

```text
docs/tasks/*.md → Plane
```

Git is authoritative for:

- title;
- description;
- requirements;
- acceptance criteria;
- technical constraints;
- dependencies;
- ADR/document references.

Plane is authoritative for operational project-management state such as:

- cycle;
- assignee;
- work-item state;
- project-management metadata.

## Environment

Copy `config.example.env` to `scripts/plane/.env`. The sync scripts load that file automatically and do not overwrite variables already set in the process environment.

`PLANE_PROJECT_ID` may be the project UUID, its identifier, or its name. A non-UUID value is resolved through the workspace project list.

Never commit the real API key.

## Command

```bash
npm run plane:sync
npm run plane:sync:dry
npm run plane:sync -- FE-003
npm run plane:sync:dry -- FE-003 FE-004
npm run plane:sync -- --changed
npm run plane:sync:dry -- --changed
```

No arguments sync every task file. Task ids match front matter `id` and sync only those files. `--changed` syncs task files that differ from `HEAD` (including untracked files under `docs/tasks`) and any task whose `plane.work_item_id` is still empty. Pass ids or `--changed`, not both. An unknown id or flag exits before any Plane write.

Dry-run lists the selected task files and whether each would be created or updated. It does not call Plane and does not edit task files. A real run with nothing selected does not call Plane.

## What sync does

1. Discover Markdown tasks under `docs/tasks` and skip files without an `id`.
2. Keep the tasks selected by id or `--changed`. With no selector, keep every task.
3. Create a work item in the project Backlog state when `plane.work_item_id` is empty. The state list is requested only when a create is needed.
4. On later runs, update name, description, and priority only. State, assignee, and cycle are left untouched.
5. If Plane already has the task (`external_id` = task id, `external_source` = `medconnect-tasks`) but the file has no id, link that work item instead of creating a second one.
6. Write `plane.work_item_id` and `plane.identifier` back into the task file.

Backlog is the state whose group is `backlog`. Set `PLANE_STATE_ID_BACKLOG` to force a state id. `PLANE_STATE_ID_PLANNED` is used only when the backlog id is unset.

Task priority `critical` is sent as Plane priority `urgent`.

Move cards on the board by hand. This command does not set In Progress, Review, QA, or Done.

## API versioning

Use Plane's current Work Items API. Do not build against deprecated issue endpoints.

## Safety

Dry-run does not write to Plane or to task files. Sync does not delete work items.
