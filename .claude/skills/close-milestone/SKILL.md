---
name: close-milestone
description: Audit a finished milestone (e.g. M18) against roadmap, tasks, contracts and code, and produce the gap list. Use when the user asks to close or audit a milestone.
argument-hint: "<milestone, e.g. M18>"
disable-model-invocation: true
model: opus
effort: high
allowed-tools: Read Grep Glob Bash(git log *) Bash(git diff *)
---

# Close milestone $0

1. Read `docs/processes/prompts/milestone-close-prompt.md` and follow it; the milestone named
   in that file is a placeholder, use **$0**.
2. Delegate per-task evidence gathering to the Explore subagent (one batch of task IDs per
   call) so file dumps stay out of this conversation; keep only verdicts and `path:line`.
3. Output the classified gap list. Author new task specs only after the user approves the
   list, using the `/new-task` conventions.
