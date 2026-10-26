---
id: FE-050
type: task
area: frontend
feature: auth
status: implemented
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
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=291-2"
  frame: "FE-050 Auth logo link (page; node-id=291-2); logo source: Logo component (node-id=211-39)"
  status: approved
implementation:
  status: complete
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
  node 211-39; markup per FE-040, but below 360 px the approved auth design uses the Compact logo
  variant (mark + smaller wordmark) instead of FE-040's mark-only fallback).
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

- [x] `/login`, `/register`, and `/email-verification` show the logo above the card, linking to the
      configured marketing origin; `/login/oauth/complete` does not.
- [x] The logo link has the accessible name "MedConnect Pro, back to home", a target of at least
      44 px, and a visible focus ring.
- [x] The "← Back to home" text link goes to the same URL.
- [x] With the var unset, no link and no console error appear; the logo shows as plain branding.
- [x] A user who opened `/login` directly reaches marketing without using Back.
- [x] At 320, 375, 768, and 1024 px there is no overlap or horizontal scroll, and the form stays
      usable.
- [x] The authenticated shell is unchanged.
- [x] `NEXT_PUBLIC_MARKETING_URL` is in `.env.example`, the environment contract, `render.yaml`,
      and the Render deploy workflow doc, with the Amplify value noted as an operator step.
- [x] Figma frames match the implemented result. (Measured `/login` with the var set against frames 01 and 06: logo, card and back-link x/y/width and gaps match within 1 px at 1440 and 375 px; card height differs only because the frames abbreviate the card body. The 320 px state was compared earlier against frame 07.)

## Dependencies

- Blocked by: FE-010, FE-040.
- Design: Figma file https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=291-2 (page "FE-050 Auth logo link", status `approved`; logo source node 211-39).
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

## Completion

- Implementation: `apps/web/src/lib/marketing-url.ts` (http(s)-only reader),
  `components/auth/auth-brand-link.tsx` (`AuthBrandLink`, `AuthBackHomeLink`), new
  `app/(auth)/layout.tsx` (header, card, back link, FE-049 bottom reserve), new `app/(oauth)/`
  group holding `login/oauth/complete` (same `noindex`, no header). `login-form.tsx`,
  `mfa-challenge-form.tsx` and `milestone-stub-page.tsx` dropped their outer full-screen wrapper.
  Tests: `marketing-url.test.ts`, `auth-brand-link.test.tsx`, `app/(auth)/layout.test.tsx`,
  `e2e/auth-marketing-link.spec.ts`; `playwright.config.ts` sets the var. `NEXT_PUBLIC_MARKETING_URL` in
  `.env.*` examples, `environment-configuration.md`, `render.yaml`, `deploy-render.md`, `deploy.md`.
  Version 0.98.0 -> 0.99.0.
- Deviations: `/login/oauth/complete` moved to an `(oauth)` route group (URL unchanged) because a
  layout cannot exclude one child route. Below 360 px the auth header uses the Compact logo
  variant (smaller wordmark), approved on the Figma page, instead of FE-040's mark-only fallback.
  PR previews inherit the production marketing URL. The page vertical position is top-aligned per
  the approved frames (previously centred).
- Operator: set `NEXT_PUBLIC_MARKETING_URL` in the Amplify console after merge; redeploy web on Render.
- Unverified: real Render deploy not exercised.
