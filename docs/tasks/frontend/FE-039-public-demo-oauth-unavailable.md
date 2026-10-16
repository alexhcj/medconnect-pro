---
id: FE-039
type: task
area: frontend
feature: identity-access
status: complete
priority: high
estimate: 2
dependencies: [FE-033]
related_adrs: [ADR-003-authentication.md, ADR-014-oidc-bff-and-external-identity.md, ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../contracts/environment-configuration.md,
    ../../product/identity-access.md,
    ../../marketing/capability-matrix.md,
    ../../workflows/design-requirements.md,
    ../../workflows/deploy-render.md,
    FE-033-oauth-login-ux.md,
    ../backend/BE-017-oidc-client-and-session-issuance.md,
  ]
design:
  required: true
  tool: figma
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=182-2184"
  frame: "App / Login — FE-033 frames (182:2184); M18 OAuth-unavailable delta approved with the milestone plan"
  status: approved
implementation:
  status: complete
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: 5532aba6-916e-4345-8cec-5d6fee5232de
  identifier: MEDCONNECT-114
---

# FE-039 — Public demo OAuth unavailable

## Objective

Stop the public demo from offering a provider button that the hosted API cannot complete, and
say that demo accounts are how to sign in.

## Context

The web app defaults to provider `fake` when `NEXT_PUBLIC_OAUTH_PROVIDER` is unset, and live
mode enables the button. On Render, `APP_ENV=preview` with no `OIDC_*` variables selects
`UnavailableOidcAdapter` whose key is `google`. `GET /auth/oauth/fake/start` then returns
400 `VALIDATION_ERROR` / `Unknown OAuth provider`. Fake OIDC is refused unless `APP_ENV=local`.
A configured Google adapter would return 503 `OAUTH_UNAVAILABLE` until secrets exist. This task
does not add those secrets.

Design delta is approved on the FE-033 login frame. No new Figma file.

## Scope

- Render the provider button only when `NEXT_PUBLIC_OAUTH_ENABLED=true`.
- Leave that variable unset in `render.yaml`, Render web examples, and committed env examples.
- When the button is hidden, show: provider sign-in is not configured for this demo; use a demo
  account.
- Local Fake start still works when the flag is on and the API is local.
- Test that the default public build does not request `/auth/oauth/fake/start`.

## Out of Scope

- Google client id, secret, or redirect URI
- Enabling Fake OIDC when `APP_ENV` is preview or production
- Rewriting the Nest OIDC factory
- Claiming OAuth works on the public demo
- The demo account panel (FE-037), except that the helper text may sit above it

## Requirements

- Do not put `OIDC_CLIENT_SECRET` in Git, the Blueprint, or docs.
- The API remains the authority. Hiding the button is not authorization.
- Copy must not call the demo a production IdP.

## Acceptance criteria

- [x] Default web build (`NEXT_PUBLIC_OAUTH_ENABLED` unset) shows the helper text and no provider button
- [x] That build does not navigate to `/auth/oauth/fake/start` or `/auth/oauth/google/start`
- [x] `NEXT_PUBLIC_OAUTH_ENABLED=true` still shows the existing provider button
- [x] Render Blueprint and env examples do not set the flag or any OIDC secret
- [x] Helper text is available to assistive technology, not only `aria-hidden`
- [x] Capability copy still does not say the public demo completes Google or Fake sign-in

## Dependencies

- Blocked by: FE-033
- Design: [FE-033 login frame](https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=182-2184), status approved
- Related: BE-017, ADR-014, identity-access.oauth-oidc-pkce

## Validation

Component test for flag off and flag on. Browser check of `/login` with the flag unset. Update
the release-roadmap crosswalk for FE-039.

## Risks / considerations

- Local developers who want the Fake button must set the flag. Document that in the web env
  example without turning it on for Render.
- Do not “fix” the 400 by sending `google` while Google is unconfigured. That still fails, as 503.

## Implementation notes

Version bump when this ships is MINOR while `0.x`: the public sign-in contract changes (the
button is no longer offered). Update product identity copy in the same change.

## Completion

- Implementation: Provider button renders only when `NEXT_PUBLIC_OAUTH_ENABLED` is exactly `true`. Otherwise `/login` shows that provider sign-in is not configured and does not request `/auth/oauth/fake/start` or `/auth/oauth/google/start`.
- Tests: Login form component tests cover flag off, flag on in mock mode, and a live Fake start when mocks are off. Live Playwright sets the flag.
- PR:
- Notes: Version 0.90.0 → 0.91.0 (MINOR, public sign-in contract no longer offers the button). Restored the MFA nurse code line the 0.90.0 commit dropped from the demo account panel. Google credentials stay later.
