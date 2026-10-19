---
name: plan-task
description: Produce a verified, staged implementation plan for one MedConnect task ID (FE-/BE-/SEC-/QA-/DATA-/INFRA-) without modifying files. Use when the user asks to plan, audit, or scope a task.
argument-hint: "<TASK-ID>  e.g. FE-040"
disable-model-invocation: true
model: opus
effort: high
allowed-tools: Read Grep Glob Bash(git status *) Bash(git diff *) Bash(git log *)
---

# Plan task $0

1. Read `docs/processes/prompts/plan-mode-prompt.md` and follow it exactly.
   The task ID written inside that file (for example `QA-007`) is a placeholder:
   substitute **$0** everywhere.
2. Locate the spec with Glob `docs/tasks/**/$0-*.md`. If none or several match, stop and say so.
3. Planning only. Do not create, edit, or delete files; do not install anything.
4. Read only the documents the task spec references plus the minimum code needed for evidence.
   Prefer Grep and targeted reads over reading whole directories. For broad repository sweeps,
   delegate to the Explore subagent and keep only its conclusions.
5. Output exactly the five "Final Output" sections the prompt defines. Keep evidence to
   `path:line` references, not pasted code.
6. End with one line: `Next: approve the plan, then run /implement-task $0`.

Extra user notes (may be empty): $ARGUMENTS
