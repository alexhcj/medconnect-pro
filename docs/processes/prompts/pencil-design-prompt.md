Paste this when exploring a screen close to code in Pencil. Do not use this file as an
implementation prompt or as a second source of truth.

Canonical visual source: Figma ([ADR-011](../../decisions/ADR-011-figma-canonical-visual-source.md)).
Task briefs: [design-brief-prompt.md](design-brief-prompt.md).
Library generation: [figma-design-system-prompt.md](figma-design-system-prompt.md).

---

Explore layout and interaction for [TASK-ID] in Pencil.

Rules:

1. Start from the approved Figma tokens and primitives when they exist. Do not invent a second
   palette or type scale.
2. Do not invent product requirements. Follow the task spec and
   [capability-matrix.md](../../marketing/capability-matrix.md).
3. Do not modify application code from this prompt.
4. Do not treat the Pencil file as canonical. Promote anything that ships into the shared Figma
   file and record `design.file_url` / `design.frame` on the implementation task.
5. Marketing explorations stay spacious; do not restyle the dashboard shell unless the task
   explicitly requires it.

Output: a short exploration (structure, states, mobile vs desktop) that can be reconciled with
Figma before `design.status: approved`.
