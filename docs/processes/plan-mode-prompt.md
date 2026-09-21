### Flow

1. Select next task from docs/tasks/
           ↓
2. Cursor audits task + dependencies + repository
           ↓
3. Cursor generates implementation plan
           ↓
4. You review/approve the plan
           ↓
5. Cursor implements the approved plan
           ↓
6. Cursor validates acceptance criteria
           ↓
7. You review changes and release the task
           ↓
8. Update task status/docs/Plane

---

Generate an implementation plan for `[TASK-ID]`.

Before planning:

1. Read the canonical task specification, relevant roadmap/master task list, applicable Cursor rules, architecture docs, and ADRs.
2. Verify the task's status, dependencies, acceptance criteria, and position in the roadmap.
3. Inspect the current repository and identify existing implementations relevant to the task.
4. Compare the actual implementation against the task's acceptance criteria.

Classify each acceptance criterion as implemented, partially implemented, not implemented, or unable to verify. Support findings with repository evidence.

Then generate a staged implementation plan for the remaining work only.

For each stage, specify:

* Goal
* Files/directories to create or modify
* Implementation steps
* Dependencies
* Risks or architectural considerations
* Validation steps

Preserve existing working functionality. Avoid duplicate implementations, unrelated refactoring, and scope expansion.

If the task is blocked, missing, or inconsistent with the roadmap, report that before proposing assumptions.

**Planning only. Do not modify files, install dependencies, or implement changes.**

End with:

1. Verified current state
2. Remaining scope
3. Ordered implementation plan
4. Blockers/open questions
5. Acceptance criteria validation checklist
