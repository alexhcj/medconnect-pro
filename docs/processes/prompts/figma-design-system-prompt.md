Paste this in Plan Mode or when generating the shared Figma design system (FE-018). Do not use
this file as an application implementation prompt.

Workflow: [design-requirements.md](../../workflows/design-requirements.md).
Canonical decision: [ADR-011](../../decisions/ADR-011-figma-canonical-visual-source.md).
Marketing constraints: [requirements.md](../../marketing/requirements.md),
[docs/product/](../../product/README.md),
[capability-matrix.md](../../marketing/capability-matrix.md).
Related: [design-brief-prompt.md](design-brief-prompt.md) (per-task briefs),
[pencil-design-prompt.md](pencil-design-prompt.md) (exploration only).

---

Create one Figma design system for MedConnect Pro. This file is the canonical visual source for
the authenticated application and the public marketing website.

Before generating:

1. Read FE-018 and the marketing docs above.
2. Inspect existing `apps/web` UI primitives (`Button`, `Card`, `Input`), marketing chrome
   (`MarketingShell`), and Tailwind usage (blue/gray utilities, small `primary` scale).
3. Do not invent product capabilities. Public frames must match the capability registry and
   matrix.
4. Do not restyle the dashboard layout. Capture existing app screens as **reference** frames.
5. Do not produce application code from this prompt.

The Figma file must include:

- Tokens: color, typography, spacing, radius, shadow, focus rings. Contrast must support WCAG
  2.1 AA-oriented implementation.
- Primitives aligned with existing code: button variants, card, input, navigation, typography
  scale.
- Marketing layout: header, footer, accessible mobile nav, page container, section blocks
  (hero, feature grid, product preview, workflow, CTA).
- Homepage concept (FE-019).
- Reusable feature-page template: hero, capabilities, product walkthrough, workflow, related
  modules, CTA (FE-020 / FE-021).
- Reference frames of existing app screens: dashboard, patient profile, calendar, telehealth
  lobby, billing, administration, login. These are the source for marketing product visuals, not
  a dashboard redesign.

Visual direction: professional healthcare SaaS, restrained, trustworthy, clear hierarchy.
Marketing is spacious; application chrome stays information-dense. Share tokens and primitives,
not one identical layout system.

After the library exists, record `design.file_url` on FE-018, run
[design-checklist-flow.md](../flows/design-checklist-flow.md), and set `design.status: approved`
only when the library is the agreed source. Later page tasks record frames in **this** file.
