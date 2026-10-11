---
id: FE-036
type: task
area: frontend
feature: identity-access
status: implemented
priority: medium
estimate: 2
dependencies: [BE-023, FE-027, FE-010]
related_adrs: [ADR-003-authentication.md]
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../architecture/security-architecture.md,
    ../../contracts/api-endpoints.md,
    ../../contracts/identity-and-access.md,
    ../../product/identity-access.md,
    ../../marketing/capability-matrix.md,
    FE-010-mock-authentication-ui.md,
    FE-027-live-cookie-session-client.md,
    ../backend/BE-023-concurrent-session-inventory-http.md,
    ../security/SEC-009-m17-security-findings-and-contract-reconciliation.md,
  ]
design:
  required: false
  tool: figma
  file_url: ""
  frame: ""
  status: not_required
implementation:
  status: complete
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: 5a9f85d7-16d0-4b53-8e16-b6ba271de53e
  identifier: MEDCONNECT-106
---

# FE-036 — Live concurrent-session chrome

## Objective

Wire the existing concurrent-session dialog to Nest session inventory so live users can review
and revoke **other** sessions without signing out of the current one.

## Context

[FE-010](FE-010-mock-authentication-ui.md) shipped session chrome, including
[`concurrent-session-dialog.tsx`](../../../apps/web/src/components/session/concurrent-session-dialog.tsx).
[FE-027](FE-027-live-cookie-session-client.md) mapped terminate to `POST /auth/logout-all` and
left live `checkConcurrentSessions` empty. Nest list/revoke is
[BE-023](../backend/BE-023-concurrent-session-inventory-http.md). The contract is
[SEC-009](../security/SEC-009-m17-security-findings-and-contract-reconciliation.md).

No new screens. Design is not required.

Implements / extends `identity-access.concurrent-sessions`. Mark that capability **shipped**
(qualified) when this task completes; keep the module `partial`. Update
[capability-matrix.md](../../marketing/capability-matrix.md) in lockstep. Do not claim production
session management or HIPAA.

## Scope

- [`session-real.ts`](../../../apps/web/src/lib/api/session-real.ts): `checkConcurrentSessions`
  calls `GET /auth/sessions` with credentials. Map the honest RDO (`sessionId`, timestamps,
  `isCurrent`, optional device class) into the dialog. **Do not invent IP, city, or browser
  strings in live mode.**
- `terminateSessions(ids)`: `POST /auth/sessions/:id/revoke` for each selected id. Use
  `POST /auth/logout-all` only for logout-everywhere. Revoking others must not clear the current
  live session metadata.
- Adapt dialog fields/copy to the Nest RDO (hide or drop live IP/location rows). Mock fixtures
  may keep synthetic location/IP and must stay labeled mock. Default mock list remains a **single
  current session** so dashboard E2E is not blocked.
- Vitest for live mapping and terminate-other vs logout-all. Accessible dialog behavior already
  in FE-010; keep keyboard and announcements.
- When shipped: catalog `identity-access.concurrent-sessions` → `shipped`, `public: qualified`;
  capability matrix authentication row may mention demo concurrent-session review. No unqualified
  “production session manager” claim.

## Out of Scope

- New Figma or a second session-settings page
- Idle keep-alive / `sendActivity` HTTP
- MFA policy UI, OAuth unlink
- Rewriting mock mode onto cookies
- Recreating FE-010 / FE-027 / BE-014

## Requirements

- Frontend checks remain UX only; Nest is authoritative.
- Live mode must not display fabricated geolocation or IP.
- Do not persist access or refresh tokens.
- Hosted cookie mutations send the existing CSRF header.

## Acceptance Criteria

- [x] Live dialog opens when Nest returns more than one session
- [x] “Continue here” / terminate-other does not sign the current user out
- [x] Logout-everywhere still calls `POST /auth/logout-all`
- [x] Live UI does not show fake IP or location
- [x] Mock single-session default still avoids blocking dashboard E2E
- [x] Vitest covers mapping and terminate vs logout-all
- [x] Catalog + capability matrix updated; claims stay qualified

## Dependencies

- BE-023, FE-027, FE-010
- Design not required (reuse existing dialog)

## Validation

- Vitest: [`session-real.test.ts`](../../../apps/web/src/lib/api/session-real.test.ts), dialog
  component tests as needed
- `npm run test:web`, lint, type-check
- Mock Playwright dashboard must not hang on a concurrent-session dialog

## Risks / Considerations

- Shipping with BE-023 in the same change is **MINOR**; if BE-023 already bumped, this UI join
  may be **PATCH**.
- `ConcurrentSessionInfo` currently includes `ipAddress` / `location`; live mapping must not
  populate those from Nest.

## Implementation notes

Suggested order: after BE-023. Reuse `useConcurrentSessions` / `useTerminateSessions`.

Writing this spec is not a version bump.

## Completion

Shipped in 0.84.0 (MINOR). Live `checkConcurrentSessions` maps `GET /auth/sessions` without IP,
location, or browser strings. Revoking other sessions calls `POST /auth/sessions/:id/revoke` and
keeps the current live session. Logout everywhere still calls `POST /auth/logout-all`. The mock
default remains one labeled demo session. Catalog `identity-access.concurrent-sessions` is
`shipped` and `public: qualified`. The identity module stays `partial`. Not a production session
manager.
