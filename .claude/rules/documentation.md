<!-- Ported from .cursor/rules/01-documentation.mdc. Keep both in sync while Cursor is still used. -->

# Documentation Rules

`/docs` is the canonical repository documentation. Paste prompts (wrapped by `.claude/skills/`) live in
`docs/processes/prompts/`; process flows live in `docs/processes/flows/`; engineering process
workflows live in `docs/workflows/`.

Before non-trivial implementation:

1. Identify the task ID.
2. Read the task file.
3. Read all referenced architecture documents.
4. Read all referenced contracts.
5. Read all referenced ADRs.
6. Inspect the existing implementation.

Do not duplicate implementation details in documentation merely for completeness.

Update or propose documentation changes when:

- architecture changes;
- an API contract changes;
- a data contract changes;
- a security boundary changes;
- a new architectural decision is introduced;
- task acceptance criteria change;
- a user-facing capability ships or its public claim changes ([docs/product/](../../docs/product/README.md)).

When architecture, API/data contracts, or security boundaries ship in the same change, also bump
the application version and add a `CHANGELOG.md` entry per `.claude/rules/versioning.md` and
ADR-007.

## Progress trackers

When a task ships (or a milestone changes state), update all of these in the same change:

1. The task file (`status`, `implementation.status`, Completion; tick only verified criteria).
2. `docs/roadmap/release-roadmap.md`: the milestone section (heading status, shipped/pending
   split), the crosswalk row, and the **Current position** paragraph (active milestone, latest
   release version).
3. The `AGENTS.md` "Current:" line (one line: closed milestone, active milestone with shipped
   tasks, latest release, paused work).
4. `docs/tasks/00-master-task-list.md`.
5. `CHANGELOG.md` and the root version (see versioning rules).
6. `docs/marketing/capability-matrix.md` "Last synced release" line (equal to the root version), plus
   the matrix rows, `docs/product/` rows and `apps/marketing/src/components/marketing/*-copy.ts` when
   a public claim changed. When a milestone changes state, also update the `/about` roadmap board
   (`MARKETING_ABOUT_STATE` in `marketing-about-copy.ts`: Shipped / In progress / Up next items and
   the Paused line; capability-level names, never task IDs). Run `npm run docs:marketing-sync`.

Milestone states are proposed, in progress, shipped, closed. Only the user declares a milestone
closed. `docs-sync-checker` verifies these at the end of `/implement-task`.

Create an ADR when a decision has meaningful long-term architectural consequences.

Never put secrets, tokens, credentials, API keys or real patient information in `/docs`.

Generated OpenAPI (`apps/api/openapi/openapi.json`) is not hand-maintained documentation. Do not
duplicate those schemas in `/docs`. See [docs/workflows/api-contract-workflow.md](../../docs/workflows/api-contract-workflow.md).

Task files use YAML front matter for machine-readable metadata and Markdown for the human-readable
execution contract. New tasks may include optional nested `design`, `implementation`, and
`validation` blocks; see [docs/tasks/README.md](../../docs/tasks/README.md). Do not backfill
shipped tasks.

Product capability files live in [docs/product/](../../docs/product/README.md). They are a
statused catalog (`shipped` / `partial` / `planned` / `out_of_scope`), not tasks. Do not
Plane-sync them. Do not invent a second ID family that looks like `FE-007`.

Plane is a project-management projection of tasks. It is not the canonical source for product
requirements, architecture, ADRs or technical constraints.
