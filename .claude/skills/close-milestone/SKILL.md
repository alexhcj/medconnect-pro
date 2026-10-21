---
name: close-milestone
description: Audit a finished milestone (e.g. M18) against roadmap, tasks, contracts and code, and produce the gap list. Use when the user asks to close or audit a milestone.
argument-hint: "<milestone, e.g. M18>"
disable-model-invocation: true
model: opus
effort: high
allowed-tools: Read Grep Glob Edit Write Bash(git log *) Bash(git diff *) Bash(npm run lint:marketing) Bash(npm run test:marketing) Bash(npm run type-check:marketing)
---

# Close milestone $0

1. Read `docs/processes/prompts/milestone-close-prompt.md` and follow it; the milestone named
   in that file is a placeholder, use **$0**.
2. Delegate per-task evidence gathering to the Explore subagent (one batch of task IDs per
   call) so file dumps stay out of this conversation; keep only verdicts and `path:line`.
3. Output the classified gap list. Author new task specs only after the user approves the
   list, using the `/new-task` conventions.
4. When a milestone is actually closed (after the user agrees), update the progress trackers in
   `.claude/rules/documentation.md`: roadmap milestone heading, crosswalk row, Current position
   paragraph, and the `AGENTS.md` "Current:" line.
5. After the milestone is closed, run "Screenshot refresh" from the prompt: list stale
   screenshots with evidence, get approval, recapture them with the built-in browser, then update
   every reference (README, marketing visuals + tests, capability matrix, product rows) and
   verify with the marketing lint/test/type-check commands.
6. New task specs are synced to Plane by `/commit-tasks` when the user asks to commit.
