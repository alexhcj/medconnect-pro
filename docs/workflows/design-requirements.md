# Design Requirements Workflow

Applies to UI, UX, Figma, visual direction, and interaction-design work. Humans follow the
steps. Cursor reads this file for constraints; do not paste it as a prompt.

Diagram: [design-to-development-flow.md](../processes/flows/design-to-development-flow.md).
Canonical visual source: [ADR-011](../decisions/ADR-011-figma-canonical-visual-source.md).

## Constraints

- Do not modify application code while producing a design brief.
- Do not invent product requirements.
- Figma/Pencil is a separate step after the brief is approved.
- Record design on the implementation task. Do not create a separate design task or Plane item.
- Use **one shared Figma file** for tokens, primitives, marketing frames, and app reference
  screens. Later UI tasks add or reference frames in that file; they do not start a parallel
  library. The file is created in
  [FE-018](../tasks/frontend/FE-018-design-system-and-visual-language.md).
- Pencil may explore near code ([pencil-design-prompt.md](../processes/prompts/pencil-design-prompt.md)).
  It is not a second implementation architecture.
- Marketing copy and frames must follow [capability-matrix.md](../marketing/capability-matrix.md).

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
   for the task ID. For the shared library itself, use
   [figma-design-system-prompt.md](../processes/prompts/figma-design-system-prompt.md).
2. Approve the brief. Do not set `design.status: approved` yet.
3. Create or update frames in the **shared** Figma file (create that file only on FE-018).
4. Review with [design-checklist-flow.md](../processes/flows/design-checklist-flow.md).
5. On the **same** implementation task, set `design.file_url`, `design.frame`, and
   `design.status: approved`. Repeat the Figma URL in Markdown Dependencies. Do not open a
   design-only Plane item.
6. Implement with [plan-mode-prompt.md](../processes/prompts/plan-mode-prompt.md) only after
   `design.status: approved`. FE-018 may produce the Figma library before token code; token and
   primitive code still waits on `design.status: approved`.
