# ADR-013 — Daily custom call object

## Status

Accepted

## Decision

Live telehealth media uses Daily as a hosted WebRTC provider with a **custom call object** on the
client. Nest is the only party that holds `DAILY_API_KEY` and mints short-lived meeting tokens
after visit-participant authorization. The browser never calls Daily REST with the API key.

This is not Daily Prebuilt (no Prebuilt iframe). This is not a self-hosted SFU. Socket.IO is not
used for media signaling. Application session HTTP (`create` / `join` / `end`) stays a separate
transport from the Daily room.

Tenant isolation for who may mint a token remains server-side
([ADR-002](ADR-002-tenant-isolation.md)). Meeting tokens are not persisted. The session row may
store only an opaque Daily room name.

## Rationale

BE-006 already authorizes appointment-linked visits. Media needs a real WebRTC path without
moving authorization into the client or introducing a second signaling stack. Daily’s REST rooms
and meeting tokens keep Nest as the authorization authority. A Fake adapter when the key is unset
keeps CI free of Daily credentials.

## Consequences

- `POST /telehealth/sessions/:id/media-token` is the Nest mint surface ([BE-016](../tasks/backend/BE-016-telehealth-daily-media-token-http.md)).
- Frontend join uses `@daily-co/daily-js` call object ([FE-030](../tasks/frontend/FE-030-daily-media-session-shell.md)); that SDK is not added to `apps/api`.
- Rooms are private, expiry-bounded to the existing 15-minute join window, and deleted best-effort on Nest `end`.
- Unset `DAILY_API_KEY` selects the Fake adapter. Hosted Secrets Manager injection of the key is not this decision.
