---
id: FE-050
type: task
area: frontend
feature: auth
status: pending
priority: medium
estimate: 2
dependencies: [FE-010, FE-040]
related_adrs: [ADR-017-interim-render-demo.md]
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../contracts/environment-configuration.md,
    ../../workflows/deploy-render.md,
    ../../workflows/design-requirements.md,
    FE-033-oauth-login-ux.md,
    FE-037-demo-account-panel.md,
    FE-040-responsive-header-logo-and-role-tag-parity.md,
    FE-049-api-status-indicator.md,
  ]
design:
  required: true
  tool: figma
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=211-39"
  frame: "Existing Logo component (node-id=211-39); auth-page frames to be created"
  status: not_started
implementation:
  status: not_started
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: e79d3f44-f8fc-4d23-a82c-83cbb831450f
  identifier: MEDCONNECT-140
---

# FE-050 — Auth pages marketing logo link

## Objective

A visitor on sign-in, register, or email-verification can return to the marketing site with one
visible, accessible click, however they arrived.

## Context

The demo path is marketing → sign-in. Browser Back only works when the visitor came from marketing
in the same tab. Direct links, new tabs, and shared demo URLs leave the auth pages with no way out
(`login-form.tsx` starts at `<h1>Sign in</h1>`, and `apps/web/public/brand/` has no logo asset).
Marketing is a separate app and a separate origin on Render, so the link target must be
configuration, not a hardcoded URL.

## Scope

- A shared `apps/web/src/app/(auth)/layout.tsx` renders a brand header (logo mark + "MedConnect Pro"
  wordmark) above the page content for `login`, `register`, and `email-verification`. The existing
  `login/layout.tsx` keeps its `noindex` metadata. `login/oauth/complete` does not show the header.
- One reusable `AuthBrandLink` component built from the existing logo (Figma Design System,
  node 211-39; markup per FE-040, including the mark-only fallback below 360 px).
- The link is a plain `<a>` to `NEXT_PUBLIC_MARKETING_URL` (not `next/link`; separate app).
- A "← Back to home" text link near the card pointing at the same URL.
- New env var `NEXT_PUBLIC_MARKETING_URL` in `apps/web/.env.example`,
  `docs/contracts/environment-configuration.md`, and `docs/workflows/deploy-render.md`.
- `render.yaml` web service env entry for the var (approved by the user); Amplify console value
  recorded as an operator step in the docs.
- Figma frames for sign-in, register, and email-verification updated on this task.

## Out of Scope

- Logo redesign or new brand assets.
- The authenticated shell, where the logo keeps going to the dashboard.
- Marketing header or sign-in CTA changes.
- Auth behaviour, API, or contract changes.
- A development-only default URL (an unset var yields a non-link logo).

## Requirements

- `<a href={NEXT_PUBLIC_MARKETING_URL} aria-label="MedConnect Pro, back to home">`; same tab, no
  `target="_blank"`.
- Target at least 44 px tall, visible keyboard focus ring, existing design tokens only.
- If the var is unset or not an `http(s)` URL, the logo renders as non-link branding and neither
  the text link nor any broken `href` appears.
- The brand header must not push the form or the FE-049 status indicator off a usable first screen
  at 320 px.
- No tokens, PHI, or user data in the URL.

## Acceptance Criteria

- [ ] `/login`, `/register`, and `/email-verification` show the logo above the card, linking to the
      configured marketing origin; `/login/oauth/complete` does not.
- [ ] The logo link has the accessible name "MedConnect Pro, back to home", a target of at least
      44 px, and a visible focus ring.
- [ ] The "← Back to home" text link goes to the same URL.
- [ ] With the var unset, no link and no console error appear; the logo shows as plain branding.
- [ ] A user who opened `/login` directly reaches marketing without using Back.
- [ ] At 320, 375, 768, and 1024 px there is no overlap or horizontal scroll, and the form stays
      usable.
- [ ] The authenticated shell is unchanged.
- [ ] `NEXT_PUBLIC_MARKETING_URL` is in `.env.example`, the environment contract, `render.yaml`,
      and the Render deploy workflow doc, with the Amplify value noted as an operator step.
- [ ] Figma frames match the implemented result.

## Dependencies

- Blocked by: FE-010, FE-040.
- Design: Figma file https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=211-39 (existing logo component; status `not_started` for the auth frames).
- Related: FE-033, FE-037, FE-049.
- Operator: set `NEXT_PUBLIC_MARKETING_URL` on Render and Amplify after merge.

## Validation

Component test for `AuthBrandLink` (link, accessible name, non-link fallback when unset); layout
test that the three auth pages render it and the OAuth landing does not. `npm run lint:web`,
`type-check:web`, `test:web`, `e2e:mocks` (sign-in still works). Manual viewport check at the four
widths above and keyboard tab order.

## Risks / considerations

- `NEXT_PUBLIC_*` is inlined at build time; a missing var on a deploy surfaces only as the non-link
  fallback, so the docs must make the requirement visible.
- Render PR previews have their own marketing preview origin (INFRA-019); decide at implementation
  whether previews set the var or fall back to the non-link logo.
- Likely a MINOR bump (new public UI surface and a new env var); confirm at implementation.
- `render.yaml` and workflow docs are touched on this task; keep the Render change to the one env
  entry.
