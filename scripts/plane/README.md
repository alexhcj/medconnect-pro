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

Copy `config.example.env` to your local environment.

Never commit the real API key.

## Command

```bash
npm run plane:sync
```

## First implementation

The script should:

1. recursively discover Markdown tasks;
2. parse YAML front matter;
3. validate stable IDs;
4. skip non-task Markdown;
5. create a Plane Work Item when `plane.work_item_id` is missing;
6. update the mapped work item when it exists;
7. persist the returned Plane ID/identifier into the task file;
8. produce a summary.

## API versioning

Use Plane's current Work Items API. Do not build against deprecated issue endpoints.

## Safety

The first version should support dry-run mode and should not delete Plane work items.
