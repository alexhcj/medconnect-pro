---
name: new-task
description: Turn a free-text idea into a MedConnect task specification (ID, YAML metadata, acceptance criteria, roadmap placement) following the repo's task conventions. Use when the user wants to create, define, or spec a new task.
argument-hint: "<short description of the work>"
disable-model-invocation: true
model: sonnet
allowed-tools: Read Grep Glob
---

# New task from description

Description: $ARGUMENTS

1. Read `docs/processes/prompts/generate-new-task-prompt.md` and follow it, using the
   description above in place of `[TASK DESCRIPTION]`.
2. Read `docs/tasks/README.md` for metadata conventions and pick the next free ID in the right
   area by listing `docs/tasks/<area>/` (do not reuse or invent ID formats).
3. Run the duplicate check against `docs/tasks/00-master-task-list.md`, `docs/product/`, and
   `info.md` (the user's working todo list) before proposing anything new.
4. Produce the "Final Output" sections from the prompt. Do not write files yet.
5. Finish by asking: "Write this to `docs/tasks/<area>/<ID>-<slug>.md` and add it to the master
   task list?" Only on an explicit yes, create the file and update
   `docs/tasks/00-master-task-list.md` (and the roadmap crosswalk only if the user agrees).
5. New task files are synced to Plane by `/commit-tasks` when the user asks to commit. Do not
   sync at authoring time.
