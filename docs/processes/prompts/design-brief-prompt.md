Paste this in Plan Mode when generating a design brief for [TASK-ID]. Do not use this file as an
implementation prompt.

Workflow: [design-requirements.md](../../workflows/design-requirements.md).
Related: [design-to-development-flow.md](../flows/design-to-development-flow.md),
[design-checklist-flow.md](../flows/design-checklist-flow.md).

---

Read the current project documentation and [TASK-ID] specification.

Before generating a design:

1. Identify the current roadmap phase and task dependencies.
2. Review the relevant architecture, existing components, and design system.
3. Identify which requirements are already implemented.
4. Identify missing UI states, responsive behavior, and accessibility requirements.
5. Prepare a concise design brief for the specified task.

Do not modify application code.

The design brief must include:
- User goals and workflow
- Required page sections and components
- Required states (loading, empty, error, success)
- Responsive behavior
- Accessibility requirements
- Existing components and design tokens to reuse
- Design decisions that require my approval

This brief is stage 2 input on the same implementation task. Do not set
`design.status: approved` until an approved Figma/Pencil artifact exists (`file_url` and
`frame` filled). Do not implement application code from this prompt.

The design will be created separately in the shared Figma file
([ADR-011](../../decisions/ADR-011-figma-canonical-visual-source.md)). Pencil may explore
([pencil-design-prompt.md](pencil-design-prompt.md)) but is not canonical.
Do not invent new product requirements. Follow [docs/product/](../../product/README.md) and
[capability-matrix.md](../../marketing/capability-matrix.md) for what may be shown as shipped.
