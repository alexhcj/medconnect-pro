### Flow

1. Name the closed milestone from docs/roadmap/release-roadmap.md
           ↓
2. Cursor audits listed tasks, contracts, and repository join
           ↓
3. Cursor classifies each finding (closed / still this milestone / later / out of scope)
           ↓
4. You review the gap list
           ↓
5. Cursor authors only the missing this-milestone task specs (after approval)
           ↓
6. Update roadmap crosswalk, relevant roadmap slice, and master task list

This is not a substitute for [plan-mode-prompt.md](plan-mode-prompt.md). That file plans one task.
This file audits a finished milestone. Its output is a gap list and, at most, new task specs. It
does not produce an implementation plan.

---

Audit milestone close for M2.

Before proposing work:

1. Read the milestone sentence and crosswalk row in `docs/roadmap/release-roadmap.md`. List every
   mapped task ID.
2. Read those task files (status, scope, acceptance criteria, completion notes),
   `docs/tasks/00-master-task-list.md`, and the matching slices in `docs/roadmap/frontend-roadmap.md`
   and `docs/roadmap/backend-roadmap.md`.
3. Read the product requirements, contracts, architecture, and ADRs for that domain.
4. Use `docs/archive/technical-implementation-tasks-v0.md` only as historical split notes. Treat it
   as oldest and not current. Use it to spot work dropped while dividing phases into small tasks.
   If a later milestone already owns that work, say so; do not pull it backward.
5. Inspect the repository for the join the milestone claims. Task checkboxes and `status:
   implemented` are not enough. For a UI-plus-API milestone, confirm the browser calls the Nest
   routes with the real session, that response DTOs map onto the UI types, and that seed or create
   data makes the screen demonstrable.

Classify every finding into exactly one bucket. Support each with repository evidence:

* **Closed** — listed on the milestone, `implemented`, and the claimed vertical slice exists in the
  repo.
* **Still this milestone** — both sides exist (or the milestone sentence requires them) and the
  slice is not connected, not demonstrable, or has no task. Propose a new task ID here only. Do not
  reopen implemented tasks.
* **Already owned later** — present in requirements, archive, or completion notes, and already
  mapped to a later milestone or existing task. Name that task and milestone. Do not open a new
  task.
* **Explicitly out of this milestone** — named in requirements or the archive, then left out of
  the milestone sentence or an implemented task's out-of-scope notes.

Propose new task files only for **Still this milestone**. For each proposed task, specify:

* Suggested ID (next free ID in that area)
* Objective and scope
* Dependencies
* Acceptance criteria
* Index updates (`release-roadmap.md` crosswalk, the relevant roadmap slice,
  `docs/tasks/00-master-task-list.md`)

Preserve later-milestone boundaries. Do not invent DELETE routes, clinical subresources, document
upload, audit persistence, or a full authorization matrix when those already have later tasks.

If the milestone crosswalk, master list, and shipped code disagree, report the conflict before
proposing a new task.

**Planning only. Do not modify files, install dependencies, or implement changes.**

End with:

1. Milestone sentence and listed tasks
2. Closed
3. Still this milestone (proposed tasks)
4. Already owned later
5. Explicitly out of this milestone
6. Blockers/open questions
7. Index updates if new tasks are approved
