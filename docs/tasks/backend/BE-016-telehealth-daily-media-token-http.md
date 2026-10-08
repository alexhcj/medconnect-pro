---
id: BE-016
type: task
area: backend
feature: telehealth
status: implemented
priority: high
estimate: 4
dependencies: [BE-006, BE-009]
related_adrs: [ADR-002-tenant-isolation.md, ADR-013-daily-custom-call-object.md]
related_docs:
  [
    ../../architecture/backend-architecture.md,
    ../../architecture/security-architecture.md,
    ../../architecture/api-architecture.md,
    ../../contracts/api-endpoints.md,
    ../../contracts/data-contracts.md,
    ../../contracts/environment-configuration.md,
    ../../contracts/identity-and-access.md,
    ../../product/telehealth.md,
    ../../decisions/ADR-013-daily-custom-call-object.md,
    BE-006-telehealth-session-api.md,
    BE-009-identity-and-access-http.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: a679c0c1-0aed-418a-b8e4-c5a2d8e3d302
  identifier: MEDCONNECT-87
---

# BE-016 — Telehealth Daily media token HTTP

## Objective

Mint a short-lived Daily meeting token from Nest after the same visit-participant authorization
as `POST /telehealth/sessions/:id/join`, so live media stays a separate transport from the
shipped application session.

## Context

[BE-006](BE-006-telehealth-session-api.md) ships appointment-linked create / get / join / end.
The controller states that join does not mint a media token. The session entity has no Daily
room fields. `@daily-co/daily-js` is already a frontend boundary and is unused.

M12 is **Telehealth Media Maturity**. This task is the Nest half of `telehealth.live-media`.
The session shell is [FE-030](../frontend/FE-030-daily-media-session-shell.md).

Reuse cookie-or-bearer `AuthGuard` from [BE-014](BE-014-httponly-cookie-session-http.md). Do not
recreate M5 session HTTP or M11 identity work.

Implements / extends `telehealth.live-media` (HTTP half).

## Scope

- `DailyMediaPort` in the existing Telehealth module: create-or-get room, mint meeting token,
  delete room. Follow the document-store port pattern
  ([document-object-store.ts](../../../apps/api/src/documents/document-object-store.ts)).
- `DailyRestAdapter` when `DAILY_API_KEY` is set; `FakeDailyAdapter` for tests and when the key
  is unset (CI must pass without Daily credentials).
- Migration: nullable `daily_room_name` (or equivalent) on `telehealth_sessions`.
- `POST /telehealth/sessions/:id/media-token` (cookie or Bearer). Authorize like join: appointment
  provider, portal patient, or assigned nurse. Receptionist still cannot join or mint.
- Lazy Daily room on first token; later tokens reuse the room. Token TTL bounded by the existing
  15-minute join window.
- `POST .../end` best-effort deletes the Daily room; Nest `ended` remains source of truth if
  Daily fails.
- OpenAPI via `npm run openapi:generate`. Mark the route in
  [api-endpoints.md](../../contracts/api-endpoints.md). Document media-token vs application
  session in [data-contracts.md](../../contracts/data-contracts.md). Add `DAILY_API_KEY` as an
  API-only secret in [environment-configuration.md](../../contracts/environment-configuration.md)
  and `.env.example` placeholders. Do not put the key in `NEXT_PUBLIC_*`.
- **ADR-013** — Daily custom call object; Nest mints tokens; no Socket.IO for media; not Daily
  Prebuilt; not a self-hosted SFU.
- Optional seed: assign MFA nurse `mfa.nurse@example.test` to Avery Quinn so a second loginable
  visit participant exists. Do not invent a PATIENT portal login.

## Out of Scope

- Frontend Daily UI (FE-030)
- Chat, recording, transcription
- Socket.IO / application realtime
- `GET /telehealth/sessions` or `POST .../leave`
- New `telehealth:*` permission strings (keep BE-006 mapping)
- Hosted Secrets Manager / AWS injection of `DAILY_API_KEY` (M9 paused)
- Stripe / M13 billing
- OAuth, Redis, rate limiting

## Requirements

- Nest remains authorization authority. Do not call Daily from the browser with the API key.
- Client `practiceId` is ignored for authorization and rejected on mismatch (existing pattern).
- Meeting tokens and `DAILY_API_KEY` are not written to audit rows, logs, Git, or docs.
- Audit media-token mint and room delete without PHI or token material, using the existing
  [AuditEventRepository](../../../apps/api/src/audit/audit-event.repository.ts).
- Join / end / grace behavior from BE-006 is unchanged.
- Confirm Daily REST room-retention defaults at implementation time (expiry plus delete on end).

## Acceptance Criteria

- [x] Authorized visit participant receives `roomUrl` and a meeting token; unauthorized and
      cross-tenant callers get the existing not-found or forbidden pattern (no oracle)
- [x] Receptionist cannot mint a media token
- [x] Tokens are not written to audit rows or logs
- [x] Unset `DAILY_API_KEY` uses the Fake adapter; HTTP tests pass in CI without Daily
- [x] Join, end, and grace behavior from BE-006 is unchanged
- [x] OpenAPI includes `POST /telehealth/sessions/:id/media-token`
- [x] Environment catalog lists `DAILY_API_KEY` as an API-only secret
- [x] ADR-013 is accepted in `docs/decisions/`

## Dependencies

- BE-006, BE-009 (shipped)
- Blocks: FE-030
- Does not wait on FE-030 Figma, M9, or a Daily account for CI

## Validation

- Port unit tests (Fake adapter plus mocked Daily REST)
- Service tests for join-participant authz, idempotent room reuse, and end succeeding when Daily
  delete fails
- HTTP tests in [telehealth.http.spec.ts](../../../apps/api/test/telehealth.http.spec.ts)
  (cookie and/or Bearer)
- `npm run test:api`, lint, type-check, `npm run openapi:generate`

## Risks / Considerations

- Real two-way video needs a local `DAILY_API_KEY`. Unset key must not fail CI.
- Hosted secret injection is not this task.
- Daily outage must not block Nest `end`.
- Do not persist meeting tokens on the session row; persist only the room name.

## Implementation notes

Suggested order: ADR-013 and port, then migration, then `media-token` HTTP, then end-path
best-effort delete, then contracts/env examples, then optional nurse assignment seed.

Reuse [telehealth.module.ts](../../../apps/api/src/telehealth/telehealth.module.ts),
[telehealth-access.ts](../../../apps/api/src/telehealth/telehealth-access.ts), and
[telehealth-session.service.ts](../../../apps/api/src/telehealth/telehealth-session.service.ts).
Do not add `@daily-co/daily-js` to `apps/api`.

Writing this spec is not a version bump. Shipping this slice is **MINOR**.

## Completion

- Implementation: `DailyMediaPort` (Fake vs REST), `daily_room_name` migration,
  `POST /telehealth/sessions/:id/media-token`, best-effort Daily delete on end, ADR-013.
- Tests: port/adapter unit tests, service mint/reuse/end-on-Daily-failure, HTTP cookie-or-bearer
  surface via Bearer in `telehealth.http.spec.ts`, OpenAPI cookie-or-bearer assert.
- PR:
- Notes: Version 0.71.0 → 0.72.0 (MINOR). Product `telehealth.live-media` stays planned until
  FE-030. Plane MEDCONNECT-87 is a human update.
