---
id: BE-019
type: task
area: backend
feature: api-protection
status: pending
priority: high
estimate: 3
dependencies: [BE-018, BE-015, BE-017]
related_adrs: [ADR-015-rate-limiting-and-api-protection.md, ADR-014-oidc-bff-and-external-identity.md]
related_docs:
  [
    ../../contracts/identity-and-access.md,
    ../../contracts/api-endpoints.md,
    ../../product/identity-access.md,
    ../security/SEC-007-rate-limit-and-api-protection-contract.md,
    BE-018-rate-limit-platform-and-client-ip.md,
  ]
implementation:
  status: not_started
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: d200efd8-7790-4914-94ef-020a5e7e3717
  identifier: MEDCONNECT-97
---

# BE-019 — Auth and sensitive-route rate-limit policies

## Objective

Apply the SEC-007 policy table to authentication and expensive routes, and audit throttling as a
security event.

## Scope

- [auth.controller.ts](../../../apps/api/src/identity/auth.controller.ts): `login` (IP + normalized
  email, independent buckets), `mfa/verify` (MFA session + IP), `refresh` (IP). Fail closed.
- [oauth.controller.ts](../../../apps/api/src/identity/oauth.controller.ts): `:provider/start`,
  `:provider/callback`, `fake/authorize` (IP). Callback throttling redirects to the existing
  generic `/login?reason=...` failure path rather than JSON.
- Session-user policies, fail open: `POST /telehealth/sessions/:id/media-token`, document
  download, `POST /billing/payments`.
- Audit `auth.rate_limited` (resource `session`, no email/IP/token) only when a known practice
  user resolves; once per key per window. Visible in `GET /admin/security-events`.
- Update the product registry (`docs/product/identity-access.md`) and capability matrix with
  demo rate limiting wording; no HIPAA claim.

## Out of Scope

- Global limits on every route; permanent lockout; CAPTCHA
- Frontend (FE-034)

## Acceptance Criteria

- [ ] Per-account login limit holds while the source IP rotates (`TRUST_PROXY=1` test)
- [ ] Per-IP login limit holds across different emails
- [ ] MFA verify is blocked well before the fixture code space is exhausted
- [ ] Refresh and OAuth routes return 429 (or the generic redirect for callback) past the limit
- [ ] A normal Fake OAuth flow (`test/oauth-flow.ts`) and normal login still succeed
- [ ] Media-token, document download, and payment return 429 past the limit
- [ ] Security-events shows `auth.rate_limited` with no email, IP, or token
- [ ] Authorization matrix and all existing HTTP suites pass
- [ ] OpenAPI documents 429 on every policy route; contract test passes

## Dependencies

- BE-018, BE-015, BE-017
- Blocks: FE-034

## Validation

- `npm test` in `apps/api` (HTTP specs with in-memory store reset per test)
- `npm run openapi:generate`

## Risks / Considerations

- Shared-NAT clinics: account keys plus generous IP limits.
- Existing suites that log in repeatedly must reset the injected store.
- MINOR version bump.

## Completion
