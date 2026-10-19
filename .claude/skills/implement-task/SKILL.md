---
name: implement-task
description: Implement an already-planned and approved MedConnect task in small verified stages, then validate acceptance criteria, bump the version, and update task/roadmap/product docs. Use only after /plan-task output was approved.
argument-hint: "<TASK-ID> [stage number to run, default: next]"
disable-model-invocation: true
model: sonnet
---

# Implement $0

## Before coding
- Confirm an approved plan for $0 exists in this conversation. If not, stop and suggest
  `/plan-task $0` (you can't safely reconstruct the plan from memory).
- Read the task spec (`docs/tasks/**/$0-*.md`). For UI work: if `design.required` is true and
  `design.status` is not `approved`, stop - that is a blocker.

## While coding
- Execute one plan stage at a time (stage `$1` if given, otherwise the next unfinished one).
- Follow `.claude/rules/` (architecture, security, backend/frontend/testing load automatically
  for matching files). Never bypass server-side authorization, never trust client tenant IDs,
  never add real PHI, no new dependency without asking.
- After each stage run the narrowest check (workspace lint/type-check + affected spec files).
  Use the `test-runner` subagent for anything longer than a single spec file.
- Stop and report if the task conflicts with an ADR, a contract, or the spec.

## After the last stage
1. Verify every acceptance criterion with evidence (`path:line` or test name).
2. Run the `security-reviewer` subagent on the diff when auth, tenant scope, sessions,
   uploads, audit, or rate limiting changed.
3. Bump the version per `.claude/rules/versioning.md` and prepend the CHANGELOG entry
   (read only the top entry of `CHANGELOG.md`).
4. Update the task file completion info, `docs/roadmap/release-roadmap.md` shipped/pending
   split, and `docs/product/` + `docs/marketing/capability-matrix.md` if a user-facing
   capability changed. Use the `docs-sync-checker` subagent to confirm nothing was missed.
5. Report: changed files, version old -> new with rationale, deviations, suggested commit
   message (Conventional Commits, matching `git log` style). Do not commit.
