---
id: SEC-006
type: task
area: security
feature: identity-access
status: pending
priority: high
estimate: 2
dependencies: [SEC-001, BE-014]
related_adrs: [ADR-003-authentication.md]
related_docs:
  [
    ../../contracts/identity-and-access.md,
    ../../contracts/api-endpoints.md,
    ../../contracts/environment-configuration.md,
    ../../architecture/security-architecture.md,
    ../../architecture/data-architecture.md,
    ../../security/authentication-and-session.md,
    ../../compliance/production-requirements.md,
    ../../product/identity-access.md,
    ../../package-baseline.md,
  ]
implementation:
  status: not_started
validation:
  responsive: false
  accessibility: false
  tests_required: false
plane:
  work_item_id: e4f4e06e-8360-4dbb-bad8-4cf23b7657d8
  identifier: MEDCONNECT-90
---

# SEC-006 — OIDC BFF contract and ADR-014

## Objective

Record the M14 external-identity decision and contract before code: Nest acts as the confidential
OAuth 2.0 / OIDC client (Authorization Code + PKCE), maps a verified external identity onto an
existing `users` row, and issues the **existing** opaque HttpOnly session. No second identity stack.

## Context

[ADR-003](../../decisions/ADR-003-authentication.md) targets OAuth 2.0 / OIDC + PKCE. The identity
contract forbids NextAuth as a second stack. Nest already owns sessions, cookies, CSRF, refresh
rotation, RBAC, tenant resolution, and `auth.*` audit
([BE-009](../backend/BE-009-identity-and-access-http.md),
[BE-014](../backend/BE-014-httponly-cookie-session-http.md)). Capability
`identity-access.oauth-oidc-pkce` is `planned`.

First M14 task. Blocks [DATA-003](../backend/DATA-003-external-identity-persistence.md),
[BE-017](../backend/BE-017-oidc-client-and-session-issuance.md), and
[FE-033](../frontend/FE-033-oauth-login-ux.md).

## Scope

- New `docs/decisions/ADR-014-oidc-bff-and-external-identity.md`:
  - Nest BFF as OIDC client; browser never receives provider tokens.
  - Google as first real provider; Fake OIDC adapter when Google env is unset
    (`APP_ENV=local` / tests only), same pattern as the Daily Fake adapter.
  - Provider port keyed by provider string; later providers are adapters, not rewrites.
  - Identity model: `external_identities (provider, subject)` linked to `users`; no provider
    columns on `users`; short-lived `oauth_flow_states` in PostgreSQL (no Redis, no new signing
    secret).
  - Mapping rules: `(provider, sub)` match → user; else verified email match → first link;
    else reject (no JIT provisioning). Mismatched `sub` / email never merges.
  - Roles and tenant always come from `practice_memberships`. IdP claims never become roles.
  - Mock password login and labeled mock MFA remain. OAuth sessions do not chain mock MFA.
  - Alternatives rejected: NextAuth/Auth.js, Passport-only, Auth0/Cognito, JIT signup.
- ADR-003: add a Related pointer to ADR-014 (decision unchanged).
- Identity contract: **Implemented demo OIDC (M14)** subsection — flow, mapping, protections
  (PKCE S256, one-time `state`, `nonce`, exact redirect URI, `iss`/`aud`/`exp`, `email_verified`,
  relative `returnTo` allowlist), session reuse, audit actions `auth.oauth.succeeded`,
  `auth.oauth.failed`, `auth.oauth.linked`, `auth.oauth.identity_mismatch`.
- `api-endpoints.md`: planned `GET /auth/oauth/:provider/start`,
  `GET /auth/oauth/:provider/callback`, `GET /auth/session`.
- Environment contract: api-only `OIDC_PROVIDER`, `OIDC_ISSUER`, `OIDC_CLIENT_ID`,
  `OIDC_REDIRECT_URI` (environment-specific), `OIDC_CLIENT_SECRET` (secret), optional
  `OIDC_DEMO_EMAIL` (local/test only). Replace the “no OAuth client secret exists” sentence.
  Hosted Secrets Manager keys remain M9 / later deployment work.

## Out of Scope

- Application code, migrations, dependencies, version bump
- Capability status change (FE-033 ships that)
- Rate limiting (M15), production MFA (later), hosted secret injection (M9)

## Acceptance Criteria

- [ ] ADR-014 exists, Accepted, and names rejected alternatives
- [ ] Identity contract documents mapping, protections, audit actions, and RBAC preservation
- [ ] Endpoint index lists the three planned routes
- [ ] Environment contract classifies every `OIDC_*` key; no real values anywhere in `/docs`
- [ ] No doc claims production OAuth or HIPAA identity

## Dependencies

- SEC-001, BE-014 (shipped)
- Blocks: DATA-003, BE-017, FE-033

## Validation

- Docs review against ADR-003, identity contract, and package baseline
- Search `/docs` for secrets and for “production OAuth” claims

## Risks / Considerations

- Email-based first link is safe only with `email_verified` and a pre-provisioned user; document
  that the demo has no self-signup.
- Seeded `*@example.test` emails cannot sign in with real Google; document the Fake adapter and
  `OIDC_DEMO_EMAIL` local seed hook.
