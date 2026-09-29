---
id: FE-018
type: task
area: frontend
feature: marketing
status: implemented
priority: high
estimate: 5
dependencies: [FE-017]
related_adrs:
  [ADR-009-npm-workspace-monorepo.md, ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    frontend-architecture.md,
    ../01-product-requirements.md,
    ../../roadmap/post-mvp-baseline.md,
    ../../roadmap/release-roadmap.md,
    ../../workflows/design-requirements.md,
    ../../marketing/requirements.md,
    ../../marketing/sitemap.md,
    ../../marketing/capability-matrix.md,
  ]
design:
  required: true
  tool: figma
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd"
  frame: "Cover (8:2)"
  status: approved
implementation:
  status: complete
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: a8eda17c-1c3f-4790-bf7a-7e2a35099672
  identifier: MEDCONNECT-53
---

# FE-018 — Design system and visual language

## Objective

Establish one Figma design system and mapped code tokens so the authenticated application and the
public marketing site share color, type, spacing, radius, shadow, and primitives without a second
CSS system.

## Context

[FE-017](FE-017-marketing-website-foundation.md) isolated marketing chrome from the dashboard.
Visual language is still ad hoc Tailwind utilities. No Figma file exists. The design checklist
already asks whether work follows the MedConnect Pro design system. This task produces that system
and is the first remaining M8 slice after the shipped foundation.

Producing the Figma library is in scope. Token and primitive code work waits until
`design.status: approved` on this task. Repeat the Figma URL in Markdown Dependencies below once
the file exists.

## Scope

- One shared Figma file: tokens; primitives (button, card, input, nav, typography); marketing
  layout and section components; homepage concept; reusable feature-page template; reference frames
  of key **existing** app screens (dashboard, patient profile, calendar, telehealth lobby, billing,
  admin, login) as the visual source for marketing.
- Marketing documentation under `docs/marketing/` (requirements, sitemap, capability matrix).
- Token mapping described in [frontend-architecture.md](../../architecture/frontend-architecture.md).
  Do not fork a second design-system architecture page.
- Design workflow docs name the shared Figma file as the visual source
  ([design-requirements.md](../../workflows/design-requirements.md),
  [design-to-development-flow.md](../../processes/flows/design-to-development-flow.md)).
- After Figma approval: map tokens into the Tailwind theme and/or CSS variables; reuse
  `components/ui`; do not replace Headless UI or add a component library.

## Out of scope

- Finished marketing page copy
- `/platform/*` feature pages
- Dashboard layout restyle (marketing stays spacious; dashboard stays dense)
- Pencil as a second implementation architecture
- Deploy, preview, CI/CD, Docker, Terraform
- HIPAA certification claims
- New authentication or a second identity stack

## Requirements

- WCAG 2.1 AA-oriented tokens (contrast and visible focus).
- Marketing and the app share tokens and primitives, not layout density.
- Public capability wording follows
  [capability-matrix.md](../../marketing/capability-matrix.md) and
  [post-mvp-baseline.md](../../roadmap/post-mvp-baseline.md).
- Sign-in remains existing `/login` ([FE-010](FE-010-mock-authentication-ui.md)).
- Synthetic demo data only. Do not introduce real PHI.
- Figma is the canonical visual source ([ADR-011](../../decisions/ADR-011-figma-canonical-visual-source.md)).

## Technical constraints

- Follow the project architecture.
- Do not introduce a second design-system package or unused UI kit.
- Do not restyle authenticated dashboard layouts in this task.
- Do not claim HIPAA certification, production OAuth, live video, or hosted payments.

## Acceptance criteria

- [x] Figma file URL is recorded on this task (`design.file_url`, `design.status: approved`) and
      repeated in Markdown Dependencies
- [x] Tokens for color, type, space, radius, and shadow exist in Figma and are mapped in code
- [x] Marketing requirements, sitemap, and capability matrix exist and match post-mvp-baseline
      (no HIPAA, production OAuth, live video, or hosted-payments claims)
- [x] Frontend architecture describes marketing component folders and token mapping
- [x] Design workflow docs name the shared Figma file as the visual source
- [x] No second design-system package or unused UI kit is introduced

## Dependencies

- Blocked by: [FE-017](FE-017-marketing-website-foundation.md) (shipped)
- Blocks: FE-019, FE-020, FE-021, FE-022, FE-023
- Figma URL (approved):
  https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd

## Validation

Run the [design checklist](../../processes/flows/design-checklist-flow.md) on the Figma library.
Check token contrast. If tokens change code, run lint and type-check. Responsive, accessibility,
and tests apply to token and primitive surfaces.

## Risks / considerations

- Chicken-and-egg: Figma creation is this task’s design work; code tokens follow approval.
- Do not accidentally restyle the dashboard shell.
- Do not duplicate token documentation outside frontend-architecture.

## Implementation notes

Use [figma-design-system-prompt.md](../../processes/prompts/figma-design-system-prompt.md) when
generating the library. Pencil may explore; it must not become a second implementation source.
Keep `components/ui` (`Button`, `Card`, `Input`) as the shared primitives.

## Completion

- Implementation: Figma library on team alex_hcj; `apps/web/src/styles/tokens.css` maps color,
  type, space, radius, and shadow into `:root` + Tailwind `@theme`; `Button`, `Card`, and `Input`
  consume those utilities; Inter is `--font-sans`. Marketing chrome uses the same tokens.
  Dashboard layout classes were not restyled.
- Tests: `tokens.test.ts`, `button.test.tsx`, `card.test.tsx`, `input.test.tsx`; full Vitest
  suite (222 passed); type-check. `npm run lint` is blocked by a pre-existing typescript-eslint /
  TS 7 incompatibility, not this change.
- PR:
- Notes: Shared Figma file https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd (Cover 8:2).
  `design.status: approved`. Token mapping is 0.46.0.
