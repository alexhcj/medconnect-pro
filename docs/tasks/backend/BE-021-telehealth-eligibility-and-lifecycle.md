---
id: BE-021
type: task
area: backend
feature: telehealth
status: implemented
priority: high
estimate: 4
dependencies: [SEC-008]
related_adrs: [ADR-002-tenant-isolation.md, ADR-013-daily-custom-call-object.md, ADR-015-rate-limiting-and-api-protection.md]
related_docs:
  [
    ../../architecture/backend-architecture.md,
    ../../architecture/security-architecture.md,
    ../../contracts/api-endpoints.md,
    ../../contracts/data-contracts.md,
    ../../contracts/identity-and-access.md,
    ../../product/telehealth.md,
    ../security/SEC-008-live-telehealth-workflow-contract.md,
    BE-006-telehealth-session-api.md,
    BE-016-telehealth-daily-media-token-http.md,
    ../backend/BE-019-auth-and-sensitive-route-rate-limits.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: null
  identifier: null
---

# BE-021 — Telehealth eligibility and lifecycle hardening

## Objective

Enforce the SEC-008 live-telehealth contract in Nest: re-check appointment eligibility on get,
join, and media-token; require `in_session` before minting; lazy-end ineligible sessions; add
create/join rate limits; document 502 `MEDIA_UNAVAILABLE` in OpenAPI.

## Context

[BE-006](BE-006-telehealth-session-api.md) and [BE-016](BE-016-telehealth-daily-media-token-http.md)
ship create/get/join/end and Daily minting. Join and mint currently ignore later appointment
cancel/complete. Mint is allowed while the session is still `waiting`. OpenAPI omits 502.
Create and join are not rate-limited.

M16 is **Live Telehealth**. The contract is [SEC-008](../security/SEC-008-live-telehealth-workflow-contract.md).
Frontend leave-versus-end and ineligible UX is [FE-035](../frontend/FE-035-clinical-live-visit-ux.md).

Do not recreate Daily adapters, session HTTP, or M15 limiter platform.

Implements / extends `telehealth.start-session` and `telehealth.live-media` (HTTP hardening).

## Scope

- Shared eligibility helper used by create, get, join, and mint in
  [telehealth-window.ts](../../../apps/api/src/telehealth/telehealth-window.ts) and
  [telehealth-session.service.ts](../../../apps/api/src/telehealth/telehealth-session.service.ts).
- Ineligible open session (cancelled, completed, or past grace) → persist `ended` and best-effort
  Daily delete (same as existing grace). Audit `telehealth_session.ended` without tokens or PHI.
- `POST .../media-token` requires `state === 'in_session'`; otherwise 409 `SESSION_NOT_JOINABLE`.
- Conditional/idempotent first join (no double `joined` audit).
- `@RateLimit` on create (20 / 5 min) and join (30 / 5 min), session user, fail open. Keep
  media-token 30 / 5 min.
- OpenAPI 502 on media-token via `npm run openapi:generate`.
- No appointment-service coupling: lazy eligibility on the next telehealth access (no worker).

## Out of Scope

- `POST .../leave` or `GET /telehealth/sessions`
- Daily adapter rewrite, frontend, new `telehealth:*` permissions
- Chat, recording, Socket.IO, Redis, AWS
- Recreating BE-006 / BE-016 / BE-018 / BE-019 platform code

## Requirements

- Nest remains authorization authority. Visit-participant rules from BE-006/BE-016 stay.
- Client `practiceId` is ignored for authorization and rejected on mismatch.
- Meeting tokens and `DAILY_API_KEY` are not written to audit rows, logs, Git, or docs.
- Errors stay generic: `NOT_FOUND`, `FORBIDDEN`, `SESSION_NOT_JOINABLE`, `SESSION_ENDED`,
  `MEDIA_UNAVAILABLE`.
- CI must pass with the Fake adapter (no `DAILY_API_KEY`).

## Acceptance Criteria

- [x] Cancelled or completed appointment: get/join/mint persist `ended` and reject further media
      (409), including after a session was created while scheduled
- [x] Mint while `waiting` → 409 `SESSION_NOT_JOINABLE`; mint after join → 200 `{roomUrl,token}`
      for visit participants only
- [x] Unrelated user / receptionist / other patient → 403/404 as today; no token in body, logs,
      or audit
- [x] Duplicate create returns the existing non-ended session; recreate after ended → 409
      `SESSION_ENDED`
- [x] Daily REST failure → 502 `MEDIA_UNAVAILABLE` without leaking key or token; OpenAPI
      documents 502
- [x] Create/join 429 uses the existing `RATE_LIMITED` envelope; media-token policy unchanged
- [x] Existing OAuth, cookie session, and M15 auth rate-limit tests still pass

## Dependencies

- SEC-008
- Blocks: FE-035 implementation
- Does not wait on FE-035 Figma, M9, or a Daily account for CI

## Validation

- Unit: [telehealth-window.spec.ts](../../../apps/api/src/telehealth/telehealth-window.spec.ts),
  [telehealth-session.service.spec.ts](../../../apps/api/src/telehealth/telehealth-session.service.spec.ts)
- HTTP: [telehealth.http.spec.ts](../../../apps/api/test/telehealth.http.spec.ts),
  [authorization-matrix.http.spec.ts](../../../apps/api/test/authorization-matrix.http.spec.ts),
  create/join rate-limit coverage, [openapi.contract.spec.ts](../../../apps/api/test/openapi.contract.spec.ts)
  for 502
- `npm run test:api`, lint, type-check, `npm run openapi:generate`

## Risks / Considerations

- Lazy-end on GET changes a previously joinable session to `ended` when the appointment was
  cancelled; that is the intended security outcome.
- First-join races must not double-audit `joined`.
- Shipping this slice is **MINOR** (contract behavior change).

## Implementation notes

Suggested order: eligibility helper, lazy-end on get/join/mint, join-before-mint, rate limits,
OpenAPI 502, tests.

Reuse [telehealth-access.ts](../../../apps/api/src/telehealth/telehealth-access.ts) and the
existing Daily port. Do not add `@daily-co/daily-js` to `apps/api`.

Writing this spec is not a version bump.

## Completion

Shipped with FE-035 in 0.81.0 (MINOR). Eligibility is re-checked on get/join/mint; mint requires
`in_session`; lazy-end on ineligible appointments; create/join fail-open rate limits; OpenAPI 502
`MEDIA_UNAVAILABLE`. Version bump is shared with FE-035.
