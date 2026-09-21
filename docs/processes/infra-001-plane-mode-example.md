# Task: Audit and Plan INFRA-001

## Objective

Generate a detailed implementation plan for `INFRA-001` based on the current MedConnect Pro roadmap, task specification, repository state, and existing infrastructure implementation.

Some requirements may already be partially or fully implemented as part of previous tasks. Identify this before proposing new work.

**This is a planning and repository-audit task only. Do not implement changes.**

## 1. Verify Task Context

Before planning:

1. Read the relevant Cursor rules, especially task execution, architecture, security, and documentation rules.
2. Inspect `docs/tasks/` and locate the canonical `INFRA-001` task specification.
3. Review the master task list and relevant roadmap documents.
4. Verify INFRA-001's current status, priority, dependencies, scope, and acceptance criteria.
5. Check whether its dependencies are completed or whether any blockers exist.
6. Review relevant ADRs and architecture documentation.

If the task specification is missing, contradictory, or unclear, report the issue rather than inventing requirements.

## 2. Audit Existing Implementation

Inspect the repository for existing implementation related to INFRA-001.

Consider relevant configuration, scripts, infrastructure files, CI/CD workflows, environment setup, deployment configuration, and documentation.

For each applicable requirement, classify it as:

* **Implemented** — present and verifiably satisfies the requirement.
* **Partially implemented** — some work exists, but gaps remain.
* **Not implemented** — no relevant implementation found.
* **Unable to verify** — implementation may exist, but its correctness or operational behavior cannot be established from repository evidence.

Do not mark a requirement as complete solely because a related file exists.

Do not modify files, install packages, run destructive commands, or change the Git working tree during this audit.

## 3. Identify the Remaining Scope

Compare the task's acceptance criteria with the actual repository state.

Identify:

* Requirements already satisfied.
* Requirements partially satisfied and their remaining gaps.
* Requirements not yet implemented.
* Dependencies or blockers.
* Any existing implementation that should be preserved or improved rather than replaced.
* Any out-of-scope infrastructure work that should remain a separate task.

Do not duplicate existing functionality or expand the task beyond its documented scope without justification.

## 4. Generate the Implementation Plan

Create a staged implementation plan for the remaining INFRA-001 work.

For each stage, specify:

* Goal and rationale.
* Files/directories expected to be created or modified.
* Concrete implementation steps.
* Dependencies on earlier stages or other tasks.
* Risks and security considerations.
* Validation and testing steps.
* Relevant acceptance criteria.

Prefer small, logically ordered, independently verifiable stages.

Respect the existing MedConnect Pro architecture and avoid unnecessary tools, services, dependencies, or abstractions.

## 5. Preserve Project Conventions

The plan must follow these principles:

* `/docs` is the canonical source of truth for project requirements and task specifications.
* `.cursor/rules/` defines how Cursor should work within the project.
* Existing architecture decisions should be respected unless a documented conflict is identified.
* Infrastructure changes must account for the Next.js frontend and future NestJS backend where relevant.
* Do not assume production HIPAA compliance is a goal of this task.
* Do not introduce real PHI, credentials, secrets, or sensitive configuration into the repository.
* Do not perform unrelated dependency upgrades or refactoring.

## 6. Required Plan Output

Structure the response as follows:

### A. Task Context

Task ID, title, status, priority, dependencies, and roadmap position.

### B. Repository Audit

Relevant existing files, configurations, and infrastructure capabilities discovered.

### C. Acceptance Criteria Assessment

A table mapping each INFRA-001 acceptance criterion to its implementation status and supporting repository evidence.

### D. Remaining Work

A concise list of verified gaps and required changes.

### E. Implementation Plan

Ordered stages with files, actions, dependencies, risks, and validation steps.

### F. Blockers and Open Questions

Anything requiring clarification before implementation.

### G. Final Validation Checklist

How completion of INFRA-001 will be verified.

### H. Scope Confirmation

Explicitly state what is included and excluded from this task.

## Final Instruction

Generate a plan for the **remaining work required to satisfy INFRA-001**, not a generic implementation from scratch.

Use the task specification and repository evidence rather than assumptions. Clearly distinguish verified findings from recommendations and uncertainties.

Do not implement anything until the plan has been reviewed and approved.
