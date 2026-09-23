---
id: FE-004
type: task
area: frontend
feature: patient-management
status: implemented
priority: high
estimate: 2
dependencies: [FE-003]
related_adrs: []
related_docs: [frontend-architecture.md,../contracts/data-contracts.md]
plane:
  work_item_id: 03ef2931-641a-4abe-b62c-497ce6b1dd34
  identifier: MEDCONNECT-23
---

# FE-004 — Patient create/edit

## Objective

Implement patient create/edit forms.

## Scope

React Hook Form + Zod; accessible validation and error handling.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [x] Create form works
- [x] Edit form works
- [x] Validation works
- [x] Server errors are represented
- [x] Accessible field errors exist

## Implementation notes

Client validation is not the authorization layer.

## Completion

- Implementation: Shared demographics form for create and edit, gated by `write:demographics`. Mock create assigns the demo practice id and ignores client practice scope.
- Tests: Vitest for the schema, mock create, error envelope, form errors, and permission links. Playwright tablet flow for empty validation, create, edit, and a provider session without the links.
- PR:
- Notes: Client checks are not authorization. Tenant and resource enforcement remain BE-003. Clinical fields, document upload, and intake forms stay out of scope. A synthetic provider demo user supports the permission check.
