# ADR-014 — OIDC BFF and external identity

## Status

Accepted

## Decision

Nest is the confidential OAuth 2.0 / OpenID Connect client (Authorization Code + PKCE S256) for
the demo. It maps a verified external identity onto an existing `users` row and issues the
**existing** opaque HttpOnly session ([BE-014](../tasks/backend/BE-014-httponly-cookie-session-http.md)).
There is no second identity stack. The browser never receives provider access, refresh, or ID
tokens.

- **Providers:** Google is the first real provider. A Fake OIDC adapter is selected when the Google
  configuration is unset, for `APP_ENV=local` and tests only (same pattern as the Daily Fake
  adapter, [ADR-013](ADR-013-daily-custom-call-object.md)). Providers sit behind a port keyed by a
  provider string; later providers are adapters, not rewrites.
- **Identity model:** `external_identities (provider, subject)` linked to `users`. No provider
  columns on `users`. Short-lived `oauth_flow_states` (state, nonce, PKCE verifier, `returnTo`)
  live in PostgreSQL. No Redis and no new signing secret.
- **Mapping rules:**
  1. `(provider, sub)` match → that user.
  2. Else a verified email (`email_verified=true`) matching a pre-provisioned user → first link.
  3. Else reject. No JIT provisioning or self-signup.
  A mismatched `sub` or email never merges identities.
- **Authorization:** roles and tenant always come from `practice_memberships`. IdP claims never
  become roles or tenants ([ADR-002](ADR-002-tenant-isolation.md)).
- **Mock paths remain:** mock password login and labeled mock MFA stay. OAuth sessions do not chain
  mock MFA.

This is a demo integration. It is not production OAuth, production MFA, or HIPAA identity
infrastructure.

## Rationale

[ADR-003](ADR-003-authentication.md) targets OIDC + PKCE. Nest already owns sessions, cookies,
CSRF, refresh rotation, RBAC, tenant resolution, and `auth.*` audit. Making Nest the OIDC client
reuses all of that and keeps provider secrets server-side.

## Alternatives rejected

- **NextAuth / Auth.js:** a second session stack in Next, conflicting with the identity contract.
- **Passport-only:** strategy glue without the explicit state/nonce/PKCE persistence and mapping
  rules this demo needs to show.
- **Auth0 / Cognito:** a hosted IdP adds an external account and moves session authority out of
  Nest; AWS setup is paused (M9).
- **JIT signup:** unsafe without tenant invitation flows; the demo has no self-signup.

## Consequences

- Persistence: [DATA-003](../tasks/backend/DATA-003-external-identity-persistence.md).
- Routes and session issuance: [BE-017](../tasks/backend/BE-017-oidc-client-and-session-issuance.md).
- Login UX: [FE-033](../tasks/frontend/FE-033-oauth-login-ux.md).
- `OIDC_*` configuration is cataloged in [environment-configuration.md](../contracts/environment-configuration.md).
  Hosted Secrets Manager injection of `OIDC_CLIENT_SECRET` is later deployment work (M9).
- Seeded `*@example.test` users cannot sign in with real Google; local demos use the Fake adapter
  or the `OIDC_DEMO_EMAIL` seed hook.
