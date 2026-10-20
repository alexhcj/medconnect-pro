---
name: docs-sync-checker
description: Checks that a completed task left MedConnect docs in lockstep (task status, roadmap crosswalk, master task list, product registry, capability matrix, version + CHANGELOG). Use at the end of /implement-task.
tools: Read, Grep, Glob, Bash
model: haiku
---

Given a task ID, verify and report a checklist (OK / MISSING / MISMATCH with path:line):

1. Task file: top-level `status`, Completion section, `implementation.status: complete` if the block exists.
2. `docs/tasks/00-master-task-list.md` row status.
3. `docs/roadmap/release-roadmap.md`: task moved into the shipped group (milestone section and
   crosswalk row); milestone heading status (proposed / in progress / shipped) is right; the
   **Current position** paragraph names the active milestone and latest release version; no
   stray template text (for example a literal `$row`) remains.
3a. `AGENTS.md` "Current:" line names the same milestone state and latest release version.
4. If user-facing: matching `docs/product/<module>.md` capability row and `docs/marketing/capability-matrix.md` agree.
5. Root `package.json` version == `package-lock.json` root version == top `CHANGELOG.md` entry.
6. If API changed: `apps/api/openapi/openapi.json` regenerated (check `git status`).

Never edit files. Read only the top ~60 lines of CHANGELOG.md.
