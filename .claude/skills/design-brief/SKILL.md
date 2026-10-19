---
name: design-brief
description: Generate a design brief for a UI task (states, responsive behaviour, accessibility, components to reuse) ready for Figma, Pencil, or Framer. Use when a task has design.required true and no approved design yet.
argument-hint: "<TASK-ID>"
disable-model-invocation: true
model: sonnet
allowed-tools: Read Grep Glob
---

# Design brief for $0

1. Read `docs/processes/prompts/design-brief-prompt.md`, `docs/workflows/design-requirements.md`
   and `docs/processes/flows/design-to-development-flow.md`. Substitute $0 for `[TASK-ID]`.
2. Read the task spec and list existing components in `apps/web/src` / `apps/marketing` that
   should be reused (Grep for component names, don't read whole folders).
3. Output the brief only. Do not change code or task files.
4. If the Figma MCP server is connected and the user asks, offer to turn the brief into frames
   (use the Figma plugin skills, reusing the design system via `search_design_system`).
