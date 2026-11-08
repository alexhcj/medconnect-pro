---
id: BE-027
type: task
area: backend
feature: telehealth
status: implemented
priority: high
estimate: 3
dependencies: [SEC-013, DATA-007, BE-021, BE-023, BE-024]
related_adrs:
  [
    ADR-002-tenant-isolation.md,
    ADR-007-semantic-versioning.md,
    ADR-013-daily-custom-call-object.md,
    ADR-015-rate-limiting-and-api-protection.md,
    ADR-016-super-admin-session-tenant-scope.md,
  ]
related_docs:
  [
    ../../contracts/api-endpoints.md,
    ../../contracts/data-contracts.md,
    ../../contracts/identity-and-access.md,
    ../../architecture/security-architecture.md,
    ../security/SEC-013-telehealth-2-visit-experience-contract.md,
    BE-021-telehealth-eligibility-and-lifecycle.md,
    BE-023-concurrent-session-inventory-http.md,
    BE-024-telehealth-open-session-lookup.md,
    DATA-007-staff-display-identity.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: c036138d-0045-41bd-b143-12b6488e825c
  identifier: MEDCONNECT-159
---

# BE-027 — Telehealth keep-alive, passive requests and the End visit host rule

## Objective

Implement the server side of [SEC-013](../security/SEC-013-telehealth-2-visit-experience-contract.md):
passive requests that don't refresh idle activity, the in-visit heartbeat, the host-only End
visit rule, and the session response additions (`participants`, `mediaExpiresAt`, `viewerCanEnd`).

## Context

- Every authenticated request sets `lastActivityAt` (`apps/api/src/identity/auth.service.ts:196`),
  and the web app polls `GET /auth/sessions` every 2 minutes, so idle sign-out never fires on a
  visible tab. A hidden tab during a long call can still expire.
- `POST /telehealth/sessions/:id/end` needs only `write:appointments`
  (`apps/api/src/telehealth/telehealth-session.controller.ts:125`), so a receptionist can end a
  live visit (`apps/api/test/telehealth.http.spec.ts:223`).
- The session RDO has `patientName` and `providerName` only
  (`apps/api/src/telehealth/telehealth-session.rdo.ts`).
- Visit-participant resolution (provider, portal patient, assigned nurse) already exists for join,
  mint and the open-session lookup ([BE-024](BE-024-telehealth-open-session-lookup.md)); reuse it.

## Scope

- **Passive marker.** Requests carrying `X-MCP-Activity: passive` authenticate normally but do not
  write `lastActivityAt`. Everything else behaves as today. Implement it where `authenticate`
  touches activity (`auth.service.ts:185-199`); no other route changes. If CORS is configured for
  the API, allow the header.
- **Heartbeat.** `POST /telehealth/sessions/:id/heartbeat`, 204 on success. Same participant rule as
  join; the session must be `in_session` and the appointment still eligible (reuse the BE-021
  eligibility path, including lazy-end). Ended, ineligible or past-grace sessions return the
  existing conflict codes; unknown or cross-tenant ids return not-found. The route is an ordinary
  authenticated request, so it refreshes `lastActivityAt`; it never touches `absoluteExpiresAt`.
  No audit row. Rate limit 10 per 5 minutes, session user, fail open (ADR-015 row exists). OpenAPI
  documents 204, 404, 409 and 429.
- **Host rule for end.** `POST .../end` additionally requires that the caller is the appointment's
  provider or holds PRACTICE_ADMIN (SUPER_ADMIN within the session practice, ADR-016). Others get
  the forbidden envelope; not-found behavior for unknown and cross-tenant ids is unchanged. Lazy-end
  paths are unchanged. Update the OpenAPI description.
- **Session response additions** (all session reads, create, join and end responses):
  - `participants: [{userId, displayName, role}]` for the appointment provider, the portal patient
    and each assigned nurse, with display names from [DATA-007](DATA-007-staff-display-identity.md)
  - `mediaExpiresAt` (ISO string): appointment end + 15 minutes, the same value as the room and
    token expiry (`joinWindowExpiresAtUnix`)
  - `viewerCanEnd: boolean`, computed from the host rule for the caller
- **Daily.** Meeting tokens keep `user_id` only; assert in tests that no `user_name` is sent
  (`apps/api/src/telehealth/daily-rest-adapter.ts`).
- Docs: mark the SEC-013 items shipped in api-endpoints, data-contracts and identity-and-access;
  CHANGELOG; version per Risks.

## Out of Scope

- The web client: passive header on the inventory poll, heartbeat loop, `viewerCanEnd` in the UI
  ([FE-064](../frontend/FE-064-call-states-keepalive-and-wrap-up.md), [FE-063](../frontend/FE-063-call-stage-and-controls.md))
- Admission, lock, remove, owner tokens, webhooks (M23)
- Changing idle or absolute durations

## Requirements

- Authorization stays server-side; `viewerCanEnd` is a hint only.
- The heartbeat cannot keep a session alive past the join window or the absolute cap.
- No meeting tokens, `DAILY_API_KEY`, names or device data in audit rows or logs.

## Acceptance Criteria

- [x] A passive request leaves `lastActivityAt` unchanged; an ordinary request still updates it
      (fake-clock unit test)
- [x] Heartbeat: 204 for provider, patient and assigned nurse in `in_session`; 409 in `waiting`,
      `ended` or past grace; 403 for callers who can read the session but are not visit
      participants (same as join); 404 for out-of-scope, unknown and cross-tenant ids; 429 over limit
- [x] Heartbeat never moves `absoluteExpiresAt` (unit test across the 24 h boundary)
- [x] End: provider and practice admin succeed; receptionist, nurse and patient are forbidden;
      `telehealth.http.spec.ts:223` updated to the new rule
- [x] Session responses carry `participants`, `mediaExpiresAt`, `viewerCanEnd` with correct values
      per caller role
- [x] Authorization matrix (`apps/api/test/authorization-matrix-harness.ts`) covers heartbeat and
      the end host rule
- [x] Daily token request body has no `user_name`
- [x] Contracts, OpenAPI, CHANGELOG and version updated

## Dependencies

- Contract: [SEC-013](../security/SEC-013-telehealth-2-visit-experience-contract.md)
- Needs: [DATA-007](DATA-007-staff-display-identity.md) (display names)
- Blocks: [FE-063](../frontend/FE-063-call-stage-and-controls.md), [FE-064](../frontend/FE-064-call-states-keepalive-and-wrap-up.md)

## Validation

- `npm run test -w apps/api` (auth service, telehealth service, controller HTTP specs,
  authorization matrix)
- Local stack: provider joins, waits 16 minutes with the tab hidden while the heartbeat runs, then
  ends the visit successfully

## Risks / Considerations

- **Versioning.** Removing End from receptionists is a breaking authorization change. Under the
  ADR-007 MINOR cap (user decision, 2026-11-08) it ships as a MINOR bump, with "Breaking" in the
  CHANGELOG entry and the contracts updated in the same change.
- Passive marking means idle sign-out starts working on visible tabs (intended).
- The passive marker is client-cooperative by design (identity contract).

## Completion

Shipped at 1.2.0 (MINOR, ADR-007 MINOR cap; "Breaking" in the CHANGELOG for the host-only End rule).

- Passive marker: `authenticate(token, {passive})` in `identity/auth.service.ts`, header read in
  `identity/auth.guard.ts`, `X-MCP-Activity` added to CORS. Tests: `test/auth.service.spec.ts`
  (passive vs ordinary, idle still enforced, 24 h boundary with continuous activity).
- Heartbeat: `POST /telehealth/sessions/:id/heartbeat` (204), policy `telehealthHeartbeat` (10 / 5 min).
  Non-participants who can read the session get 403 (same as join); the acceptance criterion was
  corrected from 404 during planning. Tests: service spec, `test/telehealth.http.spec.ts`,
  `test/auth-rate-limit.http.spec.ts`, authorization matrix.
- Host rule: `canEndTelehealthVisit` (`telehealth/telehealth-access.ts`), checked after the tenant-scoped
  load and before the already-ended return. The matrix gains an `endSessionId` fixture.
- Response additions: `participants`, `mediaExpiresAt`, `viewerCanEnd` (`toSessionRdo`, `buildParticipants`,
  `TelehealthSessionRepository.listAssignedNurses`). `participants` is the assigned roster, not live presence.
- Daily token body asserted to carry only `room_name`, `exp`, `user_id`.
- Not done here: the manual local-stack check (provider joins, tab hidden 16 minutes with the heartbeat
  running, then ends the visit). It needs the web heartbeat loop from FE-064. The web End visit button
  still shows for receptionists until FE-063.
- Reviewed with the security-reviewer agent: no blocking findings.
