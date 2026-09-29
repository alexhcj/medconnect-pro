# Design Requirements Workflow

Applies to UI, UX, Figma, visual direction, and interaction-design work. Humans follow the
steps. Cursor reads this file for constraints; do not paste it as a prompt.

Diagram: [design-to-development-flow.md](../processes/flows/design-to-development-flow.md).

## Constraints

- Do not modify application code while producing a design brief.
- Do not invent product requirements.
- Figma/Pencil is a separate step after the brief is approved.
- Record design on the implementation task. Do not create a separate design task or Plane item.

## Required brief contents

A design brief must include:

- User goals and workflow
- Required page sections and components
- Required states (loading, empty, error, success)
- Responsive behavior
- Accessibility requirements
- Existing components and design tokens to reuse
- Design decisions that require human approval

## Steps

1. Paste [design-brief-prompt.md](../processes/prompts/design-brief-prompt.md) into Cursor Plan Mode
   for the task ID.
2. Approve the brief. Do not set `design.status: approved` yet.
3. Create or update the Figma/Pencil design.
4. Review with [design-checklist-flow.md](../processes/flows/design-checklist-flow.md).
5. On the **same** implementation task, set `design.file_url`, `design.frame`, and
   `design.status: approved`. Repeat the Figma URL in Markdown Dependencies. Do not open a
   design-only Plane item.
6. Implement with [plan-mode-prompt.md](../processes/prompts/plan-mode-prompt.md) only after
   `design.status: approved`.
