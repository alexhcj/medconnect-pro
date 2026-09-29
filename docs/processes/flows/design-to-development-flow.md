Related: [design-requirements.md](../../workflows/design-requirements.md) (workflow),
[feature-development.md](../../workflows/feature-development.md) (lifecycle),
[design-brief-prompt.md](../prompts/design-brief-prompt.md) (human paste),
[figma-design-system-prompt.md](../prompts/figma-design-system-prompt.md),
[pencil-design-prompt.md](../prompts/pencil-design-prompt.md),
[plan-mode-prompt.md](../prompts/plan-mode-prompt.md),
[generate-new-task-prompt.md](../prompts/generate-new-task-prompt.md),
[design-checklist-flow.md](design-checklist-flow.md).

Design references live on the **same** implementation task (`design` YAML plus Markdown
Dependencies). Do not create a separate design task or Plane item.

Visual source is **one shared Figma file** ([ADR-011](../../decisions/ADR-011-figma-canonical-visual-source.md)).
Create it in [FE-018](../../tasks/frontend/FE-018-design-system-and-visual-language.md). Later
tasks record page frames in that file (`design.file_url` is the same URL; `design.frame` is the
page or component). Pencil is exploration only
([pencil-design-prompt.md](../prompts/pencil-design-prompt.md)).

### Diagram
                    MEDCONNECT PRO
                          │
             ┌────────────┴────────────┐
             │                         │
        Product Docs              Design System
          /docs                    Figma
             │                         │
     1. Requirements            2. Design
       Task spec              Approved UI
             │                         │
             └────────────┬────────────┘
                          │
                   MD / Plane Task
                  (design metadata)
                          │
              3. Cursor Plan Mode
                          │
                 4. Cursor Agent
                          │
                  Implementation
                          │
             5. Browser Validation
                          │
                   QA / Review
                          │
                 6. Task Done

### Design Flow:

1. Open the shared Figma file (create it only for FE-018; otherwise add a frame).
2. Approve the relevant screen and components using
   [design-checklist-flow.md](design-checklist-flow.md).
3. Put `design.file_url`, `design.frame`, and `design.status: approved` on the implementation
   task. Repeat the Figma URL in Markdown Dependencies so Plane descriptions still show it.
4. Ask Cursor to inspect the design and existing code before planning.
5. Implement the design while preserving architecture and existing components. Do not start
   implementation while `design.required: true` and `design.status` is not `approved`. Token
   mapping on FE-018 also waits on that approval.
