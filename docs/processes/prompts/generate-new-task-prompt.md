# Generate a New Task from the Description Below

Create a complete project task specification from the following description:

> [TASK DESCRIPTION]

## 1. Understand the Existing Project

Before defining the task, inspect the current repository and relevant project documentation.

Read, as applicable:

1. The canonical project context/specification
2. The current roadmap/master task list
3. `docs/tasks/00-master-task-list.md`. Use `docs/archive/technical-implementation-tasks-v0.md` only as historical split notes, not current requirements.
4. Relevant architecture documentation
5. Relevant ADRs
6. Applicable `.cursor/rules`
7. Existing task specifications
8. Existing design documentation and design-system rules
9. Current repository structure and implementation

Treat the current repository and designated Source of Truth documents as authoritative.

Do not assume the task description is already correctly scoped or technically accurate.

## 2. Interpret the Description

Translate the description into a concrete project task.

Determine:

* What problem or need the task addresses
* The intended outcome
* The affected product area
* The task type/scope
* Which application layers are involved
* Whether design work is required
* Whether implementation work is required
* Whether API/backend/database/infrastructure work is required
* Whether testing/documentation/security work is required
* Dependencies on existing or future tasks

Preserve the user's intent, but resolve obvious ambiguity using existing project conventions and documentation.

Do not invent product requirements that are not supported by the description or project documentation.

## 3. Check for Existing or Duplicate Work

Search the existing task list, roadmap, documentation, and repository for related work.

Determine whether the description:

* Matches an existing task
* Extends an existing task
* Should be split from an existing task
* Depends on an existing task
* Is already implemented
* Conflicts with an existing task
* Represents genuinely new work

If a sufficiently matching task already exists, report it instead of creating a duplicate.

If the requested work belongs to an existing task but is better treated as a separate task, explain the relationship.

## 4. Determine Task Scope

Define a realistic and independently actionable scope.

If the description contains multiple substantially independent pieces of work, determine whether they should be:

* One cohesive task, or
* A parent task with child/subtasks.

Prefer a single task when the pieces are tightly coupled and should be delivered together.

Split the work when independent implementation, design, validation, or dependencies would make separate tasks clearer.

Do not artificially split a small cohesive task.

## 5. Determine Task Metadata

Generate metadata according to the project's existing task conventions.

Determine:

* Task ID
* Task title
* Task type/category
* Status
* Priority, if the project defines one
* Roadmap phase/milestone
* Tags
* Dependencies
* Related tasks
* Design dependency/status
* Affected layer(s)
* Relevant epic/feature, if applicable

For the Task ID:

* Inspect existing task IDs and numbering conventions.
* Identify the appropriate next/available ID according to the project's convention.
* Do not reuse an existing ID.
* Do not invent a new ID format.

For tags:

* Use only tags already established by the project unless the task clearly requires a genuinely new category.
* If a new tag appears necessary, flag it as an open question rather than silently introducing it.

## 6. Design-Specific Handling

If the task involves design, UX, UI, Figma, visual direction, or interaction design, follow
[design-requirements.md](../../workflows/design-requirements.md) for task metadata and brief
contents. Humans generate a brief by pasting [design-brief-prompt.md](design-brief-prompt.md).

Determine whether it is:

* Design-only
* Design + implementation
* Implementation dependent on an existing design
* A design-system/component task

Check existing design-system conventions and related screens/components.

Include:

* Relevant screens/components
* User flows
* States and edge cases
* Responsive requirements
* Accessibility requirements
* Design-system dependencies
* Figma/design dependencies
* Design deliverables

Do not assume that a design task requires implementation unless the description says so or the project workflow explicitly couples them.

## 7. Define the Task Specification

Create a concise but implementation-ready task specification.

It should contain:

### Objective

What this task is intended to accomplish.

### Context

Why the task exists and how it fits into the product.

### Scope

What is included.

### Out of Scope

What is intentionally excluded.

### Requirements

Concrete functional, technical, UX/UI, security, or architectural requirements as applicable.

### Acceptance Criteria

Write objective, testable criteria.

Each criterion should describe an observable result rather than implementation details unless the implementation detail is itself a requirement.

### Dependencies

Tasks, designs, systems, or decisions required before this task can be completed.

### Validation

How completion should be verified.

### Risks / Considerations

Important architectural, technical, UX, security, or scope considerations.

## 8. Roadmap Placement

Determine where the task belongs in the existing roadmap.

Explain:

* Why it belongs in that phase
* What must precede it
* What tasks may follow it
* Whether it changes the current roadmap sequencing

Do not move existing roadmap tasks unless the new task creates a clear dependency that requires reconsideration.

If the description conflicts with the current roadmap, report the conflict rather than silently changing the roadmap.

## 9. Task Relationships

Identify relevant relationships such as:

* Blocks
* Blocked by
* Depends on
* Related to
* Extends
* Replaces
* Duplicate of

Only create relationships supported by repository/documentation evidence or by the task description.

## 10. Task Metadata for Plane

Prepare the task metadata in the project's existing YAML format/convention so that it can later be imported into Plane.

Do not call Plane or attempt to create the task remotely.

The generated metadata should remain consistent with the canonical task specification.

## 11. Source of Truth

The generated task should be suitable for becoming part of the project's canonical task documentation.

Do not create contradictory requirements between:

* Task description
* Acceptance criteria
* Metadata
* Roadmap placement
* Dependencies

If the available information is insufficient to create a reliable task, identify the missing information instead of inventing it.

## 12. Planning Only

This is a **task-definition/planning operation only**.

Do not:

* Modify source code
* Create implementation files
* Install dependencies
* Modify configuration
* Modify existing tasks
* Modify the roadmap
* Create a Plane task
* Create or modify Figma files
* Implement the task

Repository inspection and non-mutating analysis are allowed.

## Final Output

Return the result in this order:

### 1. Task Interpretation

Briefly explain how the description was interpreted.

### 2. Existing Work / Duplicate Check

List relevant existing tasks, implementations, or documentation and explain whether this is new work, an extension, or a duplicate.

### 3. Proposed Task Metadata

Provide the complete metadata, including the proposed Task ID.

### 4. Task Specification

Provide the complete task specification with:

* Objective
* Context
* Scope
* Out of Scope
* Requirements
* Acceptance Criteria
* Dependencies
* Validation
* Risks / Considerations

### 5. Roadmap Placement

Explain where the task belongs and its relationship to surrounding tasks.

### 6. Task Relationships

List dependencies and related tasks.

### 7. Plane Metadata YAML

Provide the final YAML metadata using the project's established format.

### 8. Open Questions

List only questions that genuinely require clarification or a project-level decision.

If there are no blockers or open questions, explicitly state that.
