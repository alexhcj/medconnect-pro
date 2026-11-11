---
id: BE-028
type: task
area: backend
feature: telehealth
status: pending
priority: medium
estimate: 3
dependencies: [SEC-013, BE-027, FE-067]
related_adrs:
  [
    ADR-002-tenant-isolation.md,
    ADR-007-semantic-versioning.md,
    ADR-013-daily-custom-call-object.md,
    ADR-015-rate-limiting-and-api-protection.md,
  ]
related_docs:
  [
    ../../contracts/api-endpoints.md,
    ../../contracts/data-contracts.md,
    ../../contracts/identity-and-access.md,
    ../security/SEC-013-telehealth-2-visit-experience-contract.md,
    BE-027-telehealth-keepalive-and-host-rule.md,
    ../frontend/FE-067-green-room-for-later-joiners.md,
  ]
implementation:
  status: not_started
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: d737008c-f633-4333-a303-a1d91e484cc4
  identifier: MEDCONNECT-170
---

# BE-028 — Telehealth connected participants

## Objective

`GET /telehealth/sessions/:id` and `POST .../join` report which assigned participants are currently connected to the
call, so clients can show that someone is in the visit and who it is.

## Context

FE-067 shows "This visit has already started" to a later joiner because the client cannot know who is in the call.
`participants` is the assigned roster, not live presence ([api-endpoints.md](../../contracts/api-endpoints.md)). The
approved FE-067 Figma frames name the person ("Dr. Jordan Ellis is already in this visit", "The patient is already in
this visit"). Showing that truthfully needs server-side presence. A follow-up frontend task uses this field.

## Scope

- Add a presence read to `DailyMediaPort` for a session's room, with a fake adapter for local runs and CI. The Daily
  REST adapter polls Daily's room presence endpoint behind a short per-session cache (decision: polling, not
  webhooks; webhooks stay with the M23 audit work). A time-boxed spike confirms the endpoint, its latency and its rate
  limits before the contract is fixed.
- Extend the session response with the connected subset of `participants`: `userId` and `role` only. Names and roles
  come from the roster Nest already builds; display names are never taken from Daily.
- Map Daily participants to the assigned roster through the `user_id` Nest sets on the meeting token. Anyone not on
  the roster is dropped.
- Keep the visit-participant authorization of get and join unchanged. Receptionists and out-of-scope viewers get
  nothing new.
- Edit `docs/contracts/api-endpoints.md`, `data-contracts.md` and `identity-and-access.md`, and regenerate OpenAPI.
- Cache the result for a short window per session and rate-limit it (ADR-015) so polling clients cannot hammer Daily.

## Out of Scope

- Admission, lobby, lock, remove and Daily webhooks into the audit log (M23).
- Device, network or background data (SEC-013 scope 7).
- Persisting presence history, or an audit row for presence reads.
- The frontend change (separate follow-up task).
- Changes to End visit, the heartbeat or token minting.

## Requirements

- Presence is derived server-side and never trusted from the client.
- If Daily is slow or unavailable, the response still succeeds with presence marked unavailable. It does not fail the
  visit and does not return stale names as current.
- No Daily API key or room material appears in the response.
- Tenant scope and the participant rule are unchanged.

## Acceptance Criteria

- [ ] The contract is edited and states that presence is the connected subset of the roster, plus the unavailable case
- [ ] A connected assigned participant appears with `userId` and `role`; a participant who left does not; a stranger in
      the room is dropped
- [ ] Presence is omitted or empty for a non-participant, and the unchanged authorization is covered by tests
- [ ] A Daily failure returns the session with presence marked unavailable and no 5xx
- [ ] The fake adapter and the REST adapter are unit tested; the REST adapter is checked once against the real Daily
      account
- [ ] Cache window and rate limit are set and tested
- [ ] OpenAPI regenerated and the contract test passes
- [ ] CHANGELOG and version (ADR-007)

## Dependencies

- SEC-013 (contract), BE-027 (roster, heartbeat, host rule) and FE-067 (the green room that needs it).
- Blocks [FE-069](../frontend/FE-069-green-room-named-presence-line.md), which names the person in the green room.
- Related: M23 Daily webhooks (a possible later replacement for polling), QA-015.

## Validation

`npm run lint:api`, `npm run type-check:api`, `npm run test:api`, `npm run openapi:generate`, and a live run on the
Render demo with two real participants.

## Risks / Considerations

- Daily's presence data lags by a few seconds, so "connected" is approximate and copy must not promise real time.
- Presence needs a Daily REST call per uncached read; the cache and rate limit keep that cheap.
- The `user_id` mapping depends on how the meeting token is minted today; the spike must confirm it.

## Versioning

After 1.0.0: an added response field and contract change is a MINOR (ADR-007 MINOR cap).

## Roadmap

Standalone follow-up to M22 (found while scoping FE-067). Not an M23 control. No milestone crosswalk row.
