---
id: BE-020
type: task
area: backend
feature: api-protection
status: pending
priority: medium
estimate: 1
dependencies: [SEC-007, BE-001]
related_adrs: [ADR-015-rate-limiting-and-api-protection.md]
related_docs:
  [
    ../../architecture/security-architecture.md,
    ../security/SEC-007-rate-limit-and-api-protection-contract.md,
  ]
implementation:
  status: not_started
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: 218a876e-de87-4aba-9c93-e0c03d1fcbe1
  identifier: MEDCONNECT-98
---

# BE-020 — API security headers and no-store auth responses

## Objective

Send baseline security headers on every API response and prevent caching of token-bearing
responses.

## Scope

- Middleware in `configure-app.ts` (direct implementation unless ADR-015 approves `helmet`):
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY` /
  `frame-ancestors 'none'`, HSTS only when `APP_ENV` is not `local`.
- `Cache-Control: no-store` on `/auth/*` (including OAuth) and the telehealth media-token route.
- Swagger UI at `/api/docs` keeps working.

## Out of Scope

- Next.js web headers / CSP for `apps/web`
- TLS termination (M9)

## Acceptance Criteria

- [ ] Every response carries the agreed headers; HSTS absent locally, present for non-local env
- [ ] Auth, OAuth, and media-token responses carry `Cache-Control: no-store`
- [ ] CORS preflight and credentialed requests unchanged (`platform.http.spec.ts`)
- [ ] Swagger UI loads
- [ ] Existing suites pass

## Dependencies

- SEC-007, BE-001

## Validation

- `npm test` in `apps/api`

## Risks / Considerations

- PATCH version bump.

## Completion
