### Flow

Canonical lifecycle: [feature-development.md](../../workflows/feature-development.md).

1. Select next task from docs/tasks/ (stage 1)
           ↓
2. For UI tasks, confirm design is approved on the same task (stage 2)
           ↓
3. Cursor audits task + dependencies + repository
           ↓
4. Cursor generates implementation plan (stage 3)
           ↓
5. You review/approve the plan
           ↓
6. Cursor implements the approved plan (stage 4)
           ↓
7. Cursor validates acceptance criteria (stage 5)
           ↓
8. You review changes and release the task (stage 6)
           ↓
9. Update task status/docs/Plane, including the
   `docs/roadmap/release-roadmap.md` crosswalk shipped/pending split

---

# Generate Implementation Plan for [TASK-ID]

Generate an implementation plan for **[TASK-ID]**.

## 1. Establish the Task Context

Before planning, inspect the repository and read the authoritative project documentation relevant to this task.

At minimum, check:

1. The canonical task specification for **[TASK-ID]**
2. `docs/tasks/00-master-task-list.md` and/or the current master task/roadmap source. Use `docs/archive/technical-implementation-tasks-v0.md` only as historical split notes, not current requirements.
3. Relevant roadmap/product planning documents
4. Applicable `.cursor/rules`
5. Relevant architecture and technical documentation
6. Relevant ADRs
7. Relevant contracts/specifications, if applicable
8. Existing design documentation or Figma-related specifications, if applicable. Read `docs/workflows/design-requirements.md` for UI constraints and `docs/processes/flows/design-to-development-flow.md` for the design-to-code sequence. Use `docs/processes/prompts/design-brief-prompt.md` only when this task is generating a design brief, not as a second source of truth for implementation planning.
9. Current repository structure and implementation

Treat the repository and the project's designated Source of Truth documents as authoritative. Do not rely on assumptions from older documentation when current implementation contradicts it.

## 2. Identify Task Metadata

Before analyzing implementation, determine and explicitly report the task metadata:

* Task ID
* Task title
* Task type/category
* Current status
* Roadmap phase/milestone
* Priority, if defined
* Dependencies
* Blocking dependencies
* Related tasks
* Relevant tags
* Design dependency/status (`design.required`, `design.status`, `design.file_url`, `design.frame`)
* Implementation nested status, if present
* Validation flags (`responsive`, `accessibility`, `tests_required`), if present
* API/backend/frontend/infrastructure scope, if applicable
* Any other metadata required by the project's task specification

Preserve the project's existing metadata conventions. Do not invent new metadata fields unless the existing task specification requires them. Do not treat missing nested blocks on shipped tasks as an error.

If metadata is missing, contradictory, or stale, identify the discrepancy instead of silently correcting it.

## 3. Determine Task Nature

Classify the task before creating the plan.

Possible task scopes include, but are not limited to:

* Design / UX/UI
* Frontend
* Backend
* API / contracts
* Infrastructure
* Database
* Security
* Testing / QA
* Documentation
* Refactoring
* Cross-layer / full-stack

A task may belong to multiple scopes.

For **design-related tasks**, read [design-requirements.md](../../workflows/design-requirements.md) and [design-to-development-flow.md](../flows/design-to-development-flow.md), then inspect the design system, UI/UX rules, relevant screens/components, and Figma-related documentation before planning implementation. Use [design-brief-prompt.md](design-brief-prompt.md) only when the task is generating a design brief.

For tasks that depend on design, explicitly identify:

* Existing design artifacts
* Missing design decisions
* Design dependencies
* Components/tokens/patterns that should be reused
* What must be designed before implementation can proceed

If `design.required` is true and `design.status` is not `approved`, treat that as a **blocker**.
Do not produce an implementation plan (code stages) until the design is approved on this task,
unless this run is generating a design brief via [design-brief-prompt.md](design-brief-prompt.md).

Do not create or modify designs during planning unless the task explicitly requires a design-generation workflow.

## 4. Verify Current State

Inspect the actual repository and compare it against the task specification.

Verify:

* Existing relevant files and directories
* Existing components/modules/services
* Existing dependencies and configuration
* Existing patterns and architectural conventions
* Existing tests
* Existing design implementation
* Existing API/contracts
* Existing infrastructure
* Previously implemented portions of the task
* Related work that may already satisfy part of the task

Do not assume the task is completely unimplemented.

For **every acceptance criterion**, classify it as exactly one of:

* **Implemented**
* **Partially implemented**
* **Not implemented**
* **Unable to verify**

Support the classification with concrete repository evidence, such as:

* File paths
* Components/modules/functions
* Configuration
* Tests
* Existing documentation
* Relevant implementation references

Do not claim something is implemented merely because a similarly named file or component exists.

## 5. Reconcile Task vs. Roadmap

Verify the task's position in the current roadmap.

Check:

* Previous tasks that should already be completed
* Dependencies that must exist first
* Subsequent tasks that depend on this task
* Whether the task is currently actionable
* Whether implementation has already moved beyond the original task specification
* Whether the task specification is stale compared with the current architecture

If the task is:

* blocked,
* missing,
* duplicated,
* obsolete,
* inconsistent with the roadmap,
* inconsistent with architecture,
* or dependent on an unfinished prerequisite,

report this **before proposing implementation work**.

Do not silently reinterpret the task to make it fit the current state.

## 6. Define Remaining Scope

Based on the verified repository state and acceptance-criteria analysis, determine the **remaining scope only**.

Separate:

### Already implemented

Work that should not be repeated.

### Partially implemented

Work that requires completion, correction, or integration.

### Not implemented

Work that must be added.

### Out of scope

Potential improvements that are unrelated to completing this task.

Do not include unrelated refactoring, cleanup, modernization, dependency upgrades, or architectural changes unless they are required to satisfy the task.

## 7. Generate the Implementation Plan

Create an ordered, staged implementation plan for the remaining work.

For each stage specify:

### Goal

What this stage accomplishes.

### Files / directories

Exact existing files to modify and new files/directories to create.

### Implementation steps

Concrete steps required to complete the stage.

### Dependencies

Technical or task dependencies that must be satisfied.

### Design considerations

Include this section when the task has UI/UX/design implications.

Identify:

* Existing design patterns to reuse
* Components to reuse/create
* Design tokens/variables
* Responsive behavior
* Accessibility requirements
* States and edge cases
* Figma/design dependencies

### Architecture considerations

Explain any architectural decisions or constraints relevant to the stage.

### Risks

Identify technical, architectural, security, compatibility, or scope risks.

### Validation

Specify how the completed stage should be verified.

Prefer existing project validation tools and conventions.

### Release-roadmap index

If this task is listed on a milestone in `docs/roadmap/release-roadmap.md`, include a completion
step that updates that crosswalk row (and the current-position paragraph when it still names the
task as remaining). Move the completed task ID into the shipped group; leave later IDs pending.

Example: `FE-017–FE-018 (shipped), FE-019–FE-023 (pending)` becomes
`FE-017–FE-019 (shipped), FE-020–FE-023 (pending)` after FE-019 ships. When every mapped ID on
the milestone is shipped, the row should read like `FE-017–FE-023 (shipped)` and current position
should no longer call that work remaining.

## 8. Preserve Project Conventions

The plan must follow the current project's established:

* Architecture
* Naming conventions
* Folder structure
* Design system
* State-management patterns
* API patterns
* Validation patterns
* Authentication/authorization patterns
* Testing strategy
* Documentation conventions
* Cursor rules
* Task metadata conventions

Do not introduce a new pattern when an established project pattern already solves the problem.

Do not duplicate existing functionality.

Do not perform unrelated refactoring.

Do not expand the task scope without explicitly identifying why the expansion is required.

## 9. Testing and Validation Strategy

For every implementation stage, identify appropriate validation.

Consider, where applicable:

* Unit tests
* Component tests
* Integration tests
* E2E tests
* API/contract validation
* Type checking
* Linting
* Build validation
* Accessibility validation
* Responsive/UI validation
* Security validation
* Manual verification

Use the project's existing testing stack and conventions. Do not introduce a new testing framework merely because it could be used.

## 10. Open Questions and Blockers

Before finalizing the plan, identify:

* Missing requirements
* Contradictory documentation
* Unresolved design decisions (`design.required: true` without `design.status: approved` is a blocker)
* Missing dependencies
* Missing credentials/external services
* Architecture decisions that require confirmation
* Acceptance criteria that cannot currently be verified

Clearly distinguish:

* **Blocker** — implementation cannot reasonably proceed
* **Open question** — clarification is desirable but implementation may still proceed
* **Assumption** — a reasonable assumption used for planning

Do not hide blockers by making arbitrary assumptions.

## 11. Planning Constraints

This is a **planning-only task**.

Do **not**:

* Modify files
* Create files
* Delete files
* Install dependencies
* Update dependencies
* Run migrations
* Implement code
* Generate production code
* Change configuration

Repository inspection, searching, reading files, and other non-mutating analysis are allowed.

The plan must describe the changes that should be made later, not make those changes now.

## Final Output

End the plan with exactly these sections:

### 1. Verified Current State

Summarize the actual implementation state and provide repository evidence.

### 2. Remaining Scope

List only the work that remains for **[TASK-ID]**.

### 3. Ordered Implementation Plan

Provide the stages in execution order, including dependencies between stages. Include a step that
updates `docs/roadmap/release-roadmap.md` shipped/pending status for this task when it is on a
milestone crosswalk.

### 4. Blockers / Open Questions

Clearly separate blockers, open questions, and assumptions.

### 5. Acceptance Criteria Validation Checklist

For every acceptance criterion, show:

* Status: Implemented / Partially implemented / Not implemented / Unable to verify
* Evidence
* Remaining work, if any
* Validation method

Do not provide an overall quality score, ranking, or "ready/not ready" judgment unless such a status is explicitly defined by the project's task specification.
