---
id: FE-028
type: task
area: frontend
feature: identity-access
status: pending
priority: high
estimate: 2
dependencies: [FE-027, BE-009]
related_adrs: [ADR-003-authentication.md, ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../contracts/identity-and-access.md,
    ../../product/identity-access.md,
    ../../marketing/capability-matrix.md,
    ../../workflows/design-requirements.md,
    FE-010-mock-authentication-ui.md,
    FE-027-live-cookie-session-client.md,
    ../backend/BE-009-identity-and-access-http.md,
  ]
design:
  required: true
  tool: figma
  file_url: ""
  frame: ""
  status: not_started
implementation:
  status: not_started
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: null
  identifier: null
---

# FE-028 — Mock MFA challenge UI

## Objective

Complete `identity-access.mfa-challenge` in the live UI: after mock IdP login, a labeled mock
MFA step calls Nest `POST /auth/mfa/verify` and establishes a cookie session.

## Context

Nest already returns `{ mfaRequired, mfaToken, expiresIn }` and verifies a fixture code
([BE-009](../backend/BE-009-identity-and-access-http.md)). Live
[session-real.ts](../../../apps/web/src/lib/api/session-real.ts) treats that as failure.
[BE-010](../backend/BE-010-practice-user-directory-api.md) left `mfa.nurse@example.test` without
a membership. Capability status is `partial` / `public: no`.

Depends on [FE-027](FE-027-live-cookie-session-client.md) so the challenge is not built on
`localStorage` tokens.

Implements / extends `identity-access.mfa-challenge`.

**Do not implement application code until `design.status` is `approved` on this task.**

## Scope

- Design on this task (shared Figma file), then implementation
- Accessible challenge step after login when `mfaRequired`
- Submit `POST /auth/mfa/verify`; success continues into the dashboard cookie session
- Seed a NURSE membership for `mfa.nurse@example.test` in
  [seed-mock-identity.ts](../../../apps/api/src/identity/seed-mock-identity.ts). Do not reopen
  BE-010.
- Add the account to [demo-users.json](../../mocks/demo-users.json) if live session mapping
  needs it
- Label copy as mock MFA (not production TOTP)
- Expiry and wrong-code error states
- When shipped: `identity-access.mfa-challenge` → `shipped`, `public: qualified`; capability
  matrix auth row stays honest (mock MFA, not production MFA)

## Out of Scope

- Production TOTP / WebAuthn
- MFA policy administration
- Register / password-reset / email-verify theater
- OAuth 2.0 / OIDC + PKCE
- Cookie HTTP (BE-014) and live cookie client (FE-027) beyond consuming them
- Rate limiting on verify

## Requirements

### UI / design

- Extend the existing `/login` flow; do not invent a second identity information architecture
- Shared Figma file: https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd
- States: challenge, submitting, success, wrong code, expired challenge
- Accessible name on the code field; `role="alert"` on errors
- Repeat the approved Figma URL in Dependencies when design is approved

### Technical

- Hold `mfaToken` in memory or use the optional MFA cookie from BE-014 — **never** `localStorage`
- Frontend checks remain UX only; Nest is authoritative
- Fixture code lives in the mock IdP (`135790`). Treat it as demo theater, not a production secret
- Non-MFA demo users (`practice.admin@example.test`, and so on) stay one-step login

## Acceptance Criteria

- [ ] `design.status` is `approved` with `file_url` and `frame` before implementation
- [ ] Live login as the seeded MFA user shows the challenge step
- [ ] Correct fixture code establishes a cookie session and reaches the dashboard
- [ ] Wrong or expired code is an accessible error (no silent success)
- [ ] Non-MFA demo users are unchanged
- [ ] Catalog `identity-access.mfa-challenge` is `shipped` with `public: qualified` (mock, not
      production MFA); capability matrix does not claim production MFA

## Dependencies

- FE-027, BE-009
- Design brief via [design-brief-prompt.md](../../processes/prompts/design-brief-prompt.md) on
  **this** task

Shared Figma file: https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd

## Validation

- Vitest for challenge mapping, verify call, and error states
- One `e2e:live` MFA success (restore seed if the run mutates it)
- Keyboard access to the code field and submit control

## Risks / Considerations

- Do not present mock MFA as production MFA or completed HIPAA control.
- Seeding the MFA nurse must not break BE-010’s two-membership directory assumptions in tests;
  add a membership, do not remove Avery/Blake.

## Implementation notes

Suggested order: after FE-027. Design must be approved on this task before implementation.

Writing this spec is not a version bump. Design-metadata approval is not a version bump.
Shipping this slice is **MINOR**.

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
