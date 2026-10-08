---
id: BE-017
type: task
area: backend
feature: identity-access
status: pending
priority: high
estimate: 5
dependencies: [DATA-003, BE-009, BE-014, SEC-006]
related_adrs: [ADR-003-authentication.md]
related_docs:
  [
    ../../contracts/identity-and-access.md,
    ../../contracts/api-endpoints.md,
    ../../contracts/environment-configuration.md,
    ../../architecture/security-architecture.md,
    ../../product/identity-access.md,
    BE-014-httponly-cookie-session-http.md,
    DATA-003-external-identity-persistence.md,
    ../security/SEC-006-oidc-bff-contract-and-adr.md,
  ]
implementation:
  status: not_started
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: 82f60598-b1b2-4cb2-8490-68a454a8b8f9
  identifier: MEDCONNECT-92
---

# BE-017 — Nest OIDC client, mapping, and session issuance

## Objective

Let a provisioned user sign in through OAuth 2.0 / OIDC Authorization Code + PKCE and receive the
**same** Nest opaque HttpOnly session that password login issues, so every guard, role, tenant,
and resource check applies unchanged.

## Context

Contract and ADR: [SEC-006](../security/SEC-006-oidc-bff-contract-and-adr.md). Persistence:
[DATA-003](DATA-003-external-identity-persistence.md). Session machinery:
[BE-014](BE-014-httponly-cookie-session-http.md). Extend `IdentityModule`; do not add a second
auth module, Passport, or NextAuth.

## Scope

- `OidcProvider` port; Google adapter via `openid-client` (api workspace only); Fake adapter
  selected when Google env is unset and `APP_ENV=local` (and tests). Factory mirrors
  `createDailyMediaAdapter`.
- `GET /auth/oauth/:provider/start` (`@Public`): validate provider and relative `returnTo`;
  create flow state (state, PKCE S256 verifier, nonce); 302 to authorize URL.
- `GET /auth/oauth/:provider/callback` (`@Public`): consume state; exchange code with verifier;
  validate ID token `iss`, `aud`, `exp`, `nonce`, `email_verified`; map identity per ADR-014;
  bind membership with existing login rules; insert session; set cookies; 302 to
  `WEB_ORIGIN/login/oauth/complete` (or `/login?reason=oauth_failed` on any failure).
- Fake authorize endpoint for the Fake adapter only; never registered outside local/test.
- `GET /auth/session` (cookie or Bearer): `userId`, `email`, `role`, `practiceId`, `expiresIn`.
  No tokens, hashes, or secrets.
- Discard provider tokens after validation; never persist them.
- Audit: `auth.oauth.succeeded`, `auth.oauth.failed`, `auth.oauth.linked`,
  `auth.oauth.identity_mismatch` via existing `AuditEventRepository` (visible in security events).
- Env schema: `OIDC_*` keys from SEC-006; hosted with OAuth enabled but no secret → start returns
  a labeled 503, not a crash. `OIDC_DEMO_EMAIL` honored only by `seed:mock-identity` locally.
- `.env.example` placeholders (empty). OpenAPI for the new routes.

## Out of Scope

- Frontend (FE-033)
- JIT signup, unlink, admin linking UI, multiple providers beyond Google + Fake
- Rate limiting (M15), production MFA, Secrets Manager injection (M9)
- Removing `POST /auth/login` or mock MFA

## Acceptance Criteria

- [ ] Fake happy path sets `mcp_access` / `mcp_refresh`; the session passes `AuthGuard`,
      `PermissionsGuard`, and tenant probes with the membership role
- [ ] Missing, unknown, expired, and replayed `state` fail without a session
- [ ] Wrong PKCE verifier, wrong `nonce`, wrong `aud`/`iss`, and unverified email fail
- [ ] Unknown email is rejected (no user row created)
- [ ] First verified-email login creates one `external_identities` row and audits `auth.oauth.linked`
- [ ] `sub` linked to another user, or a different `sub` for an already-linked user, is rejected
      and audits `auth.oauth.identity_mismatch`
- [ ] Absolute or off-allowlist `returnTo` is rejected (no open redirect)
- [ ] Browser-facing errors are generic; no provider error detail or token in the redirect
- [ ] IdP claims cannot change role or practice
- [ ] `GET /auth/session` returns the server-resolved role and practice for cookie and Bearer
- [ ] Password login, mock MFA, refresh rotation/reuse, logout, logout-all tests still pass
- [ ] No real client ID or secret committed; OpenAPI contract test passes

## Dependencies

- DATA-003, SEC-006, BE-009, BE-014
- Blocks: FE-033

## Validation

- `npm run test:api` (HTTP tests with cookie jar against the Fake adapter; no Google network)
- Extend the existing authorization matrix harness with an OAuth-issued session
- Manual: real Google with a local `.env` and `OIDC_DEMO_EMAIL` seed (optional, not CI)

## Risks / Considerations

- Callback is a cross-site top-level GET; `state` is the CSRF defense and cookie CSRF does not
  apply. Session cookies are set on the API origin as today.
- Auth start/callback are future rate-limit targets (M15); keep them as distinct routes.
- MINOR version bump (new public API surface).
