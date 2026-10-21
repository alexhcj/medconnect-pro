---
name: create-html-preview
description: Generate a single-file HTML mock of the recommended/selected decisions from a design brief, so the developer can see the result before spending Figma/Pencil generations. Use after /design-brief when the developer cannot picture the recommended design.
argument-hint: "<TASK-ID> [screen or section]"
disable-model-invocation: true
model: sonnet
allowed-tools: Read Grep Glob Write(docs/design-previews/**)
---

# HTML preview for $0

Purpose: cheap, disposable visual of the brief's decisions. It prevents unnecessary design-tool
generations. It is not a design, not an implementation, and never approves anything.

1. Find the `/design-brief` output for $0 in this conversation. If there is none, stop and tell
   the user to run `/design-brief $0` first. Do not re-derive the brief.
2. Build the decision table: for each "design decision that requires approval", use the user's
   selection; otherwise the brief's **recommended** option. Print it first as
   `decision | chosen value | source (selected / recommended)`.
3. Reuse the real look cheaply: read `apps/web/src/app/globals.css` for tokens and Grep the names of
   the components the brief says to reuse for class names and structure. Do not read whole folders.
4. Write ONE file `docs/design-previews/$0-<slug>.html` (create the folder if missing):
   - self-contained: inline CSS with the tokens as CSS variables, no frameworks, no external
     requests, under ~400 lines;
   - visible banner "Design preview, not implementation";
   - synthetic data only, never PHI;
   - the primary state, plus a state switcher (loading / empty / error / success) and a width toggle
     (1440 / 768 / 375) when the brief specifies them; a tiny inline script is fine;
   - focusable controls with a visible focus ring so accessibility decisions are visible.
5. Open it with the built-in browser (`preview_start` with the `file://` url) or give the path.
   Take a screenshot only if the user asks.
6. Report briefly: path, decision table, what the preview deliberately omits. Ask the user to
   approve or change each decision. Regenerate only the changed parts.

Guardrails: write only under `docs/design-previews/`. Do not edit `apps/`, task files or
`design.status`. The Figma file stays canonical (ADR-011); the HTML is delete-safe and feeds the
Figma step after approval.
