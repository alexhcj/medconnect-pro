Related: [design-to-development-flow.md](design-to-development-flow.md),
[design-requirements.md](../../workflows/design-requirements.md) (workflow),
[design-brief-prompt.md](../prompts/design-brief-prompt.md) (human paste).

Run this checklist before setting `design.status: approved` on the implementation task.
The design system is the shared Figma file ([ADR-011](../../decisions/ADR-011-figma-canonical-visual-source.md)).

### Flow

| Category       | Review question                                                    |
| -------------- | ------------------------------------------------------------------ |
| Consistency    | Does it follow the MedConnect Pro design system?                   |
| Usability      | Is the primary workflow obvious?                                   |
| Accessibility  | Are contrast, focus, labels, and keyboard interactions considered? |
| Responsiveness | Does the layout adapt to mobile and tablet?                        |
| Realism        | Does it use plausible healthcare data and appropriate terminology? |
| Feasibility    | Can it be implemented within the existing architecture?            |
