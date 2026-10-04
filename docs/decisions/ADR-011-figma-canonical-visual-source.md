# ADR-011 — Figma as canonical visual source

## Status

Accepted

## Decision

One Figma file is the canonical visual source for MedConnect Pro: design tokens, shared
primitives, marketing frames, and reference frames of existing application screens.

- Implementation follows the approved Figma frames recorded on the **same** Git task
  (`design.file_url`, `design.frame`, `design.status: approved`). Repeat the Figma URL in Markdown
  Dependencies.
- Code tokens (Tailwind theme and/or CSS variables) and `apps/web/src/components/ui` primitives
  map to that file. Do not introduce a second design-system package or unused UI kit.
- Marketing and the authenticated application share tokens and primitives. They do not share
  layout density: marketing is spacious; the dashboard stays information-dense.
- Pencil (or similar) may be used to explore near code. It must not become a second
  implementation architecture or a competing source of truth.
- Do not open a design-only Plane item. Design metadata lives on the implementation task
  ([design-requirements.md](../workflows/design-requirements.md)).

The shared file is
https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd
([FE-018](../tasks/frontend/FE-018-design-system-and-visual-language.md)). Later UI tasks add or
reference frames in that file; they do not start a parallel Figma library.

## Rationale

FE-017 isolated marketing chrome while visuals stayed ad hoc Tailwind utilities. A single Figma
library lets marketing and product UI stay consistent, gives Cursor an approved artifact to
implement against, and avoids a second CSS or component system. Exploring in Pencil is useful;
shipping from two visual systems is not.

## Consequences

- UI tasks with `design.required: true` wait for `design.status: approved` before code
  implementation (except FE-018, whose scope includes producing the library).
- Token changes belong in the Figma file first, then in code mapping described in
  [frontend-architecture.md](../architecture/frontend-architecture.md).
- Public marketing copy still follows [docs/product/](../product/README.md) and
  [capability-matrix.md](../marketing/capability-matrix.md); Figma must not invent unshipped
  product capabilities.
