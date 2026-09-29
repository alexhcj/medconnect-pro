Related: [design-requirements.md](../../workflows/design-requirements.md) (workflow),
[design-brief-prompt.md](../prompts/design-brief-prompt.md) (human paste),
[plan-mode-prompt.md](../prompts/plan-mode-prompt.md),
[generate-new-task-prompt.md](../prompts/generate-new-task-prompt.md),
[design-checklist-flow.md](design-checklist-flow.md).

### Diagram
                    MEDCONNECT PRO
                          │
             ┌────────────┴────────────┐
             │                         │
        Product Docs              Design System
          /docs                    Figma
             │                         │
       Feature Specs              Approved UI
             │                         │
             └────────────┬────────────┘
                          │
                    Design Task
                          │
                    Plane / MD Task
                          │
                Cursor Plan Mode
                          │
                 Cursor Agent
                          │
                  Implementation
                          │
                Browser Validation
                          │
                   QA / Review
                          │
                    Task Done

### Design Flow:

1. Create a Figma file for the feature.
2. Approve the relevant screen and components.
3. Include the Figma design reference in the implementation task.
4. Ask Cursor to inspect the design and existing code before planning.
5. Implement the design while preserving your architecture and existing components.
