---
id: FE-034
type: task
area: frontend
feature: identity-access
status: shipped
priority: medium
estimate: 1
dependencies: [BE-019, FE-027, FE-028, FE-033]
related_adrs: [ADR-015-rate-limiting-and-api-protection.md]
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../contracts/data-contracts.md,
    ../backend/BE-019-auth-and-sensitive-route-rate-limits.md,
  ]
design:
  required: false
  tool: figma
  file_url: ""
  frame: ""
  status: not_required
implementation:
  status: done
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: 15ff9c64-1962-4a5a-a4ba-754a7635ee04
  identifier: MEDCONNECT-99
---

# FE-034 — Rate-limited auth UX

## Objective

Show a clear, accessible "too many attempts" message when Nest returns 429 `RATE_LIMITED` on
login, MFA, or OAuth.

## Scope

- Map 429 `RATE_LIMITED` (and `details.retryAfterSeconds`) to a typed error in
  [http.ts](../../../apps/web/src/lib/api/http.ts).
- [login-form.tsx](../../../apps/web/src/components/auth/login-form.tsx) and
  [mfa-challenge-form.tsx](../../../apps/web/src/components/auth/mfa-challenge-form.tsx): show
  "Too many attempts. Try again in N seconds." in the existing error alert (`aria-live`).
- OAuth failure landing (`/login?reason=...`) shows the same message for the rate-limited reason.
- Mock mode: equivalent fixture path for demos and Playwright.
- Design not required: reuses the existing error alert pattern, no new layout.

## Out of Scope

- Client-side throttling or countdown timers that disable the form (optional, not required)
- Non-auth 429 surfaces

## Acceptance Criteria

- [x] 429 maps to the typed error with retry seconds; missing details fall back to generic text
- [x] Login, MFA, and OAuth landing render the message and it is announced
- [x] No token, email, or raw server detail rendered
- [x] Vitest for mapping and forms; Playwright mock check passes
- [x] Existing auth Vitest and Playwright suites pass

## Dependencies

- BE-019, FE-027, FE-028, FE-033

## Validation

- Web Vitest and Playwright mock; optional `e2e:live` with `dev:real`

## Risks / Considerations

- PATCH version bump.

## Completion

Shipped in 0.80.0 (MINOR rather than PATCH: the OAuth callback redirect contract changed).
`RateLimitedError` and `rateLimitMessage` live in `apps/web/src/lib/api/http.ts`; the login and
MFA forms reuse their existing `role="alert"` error. The API's `OAuthCallbackRateLimitFilter` now
redirects throttling to `/login?reason=rate_limited` (ADR-015 amendment), which the login page
renders as a danger alert. Mock mode rate-limits `rate.limited@example.test` with 60 seconds.
