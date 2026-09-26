---
id: FE-014
type: task
area: frontend
feature: telehealth
status: planned
priority: high
estimate: 3
dependencies: [FE-007, FE-012, BE-006, BE-009]
related_adrs: [ADR-003-authentication.md]
related_docs: [frontend-architecture.md,../contracts/api-endpoints.md,../contracts/data-contracts.md,../contracts/identity-and-access.md,../tasks/backend/BE-006-telehealth-session-api.md,../tasks/backend/BE-009-identity-and-access-http.md,FE-007-telehealth-session-shell.md]
plane:
  work_item_id: d9ec1aa4-1e3f-4c93-b3ac-ed22fa1a771e
  identifier: MEDCONNECT-46
---

# FE-014 — Telehealth UI on the Nest telehealth session API

## Objective

Connect the existing lobby and session shell to the Nest telehealth session API when mocks are off, with a loginable provider session and a seeded in-window telehealth appointment so the live shell is demonstrable.

## Scope

Lobby, join, waiting room, and end against [BE-006](../backend/BE-006-telehealth-session-api.md), authenticated with the [BE-009](../backend/BE-009-identity-and-access-http.md) bearer session. Enough synthetic seed that a loginable provider can open a joinable visit inside the 15-minute grace window. One non-mock browser check for that path.

Daily/WebRTC is not invoked. Do not add `GET /telehealth/sessions` or `POST .../leave`. Chat, recording, reconnection, signaling, and media tokens stay unrequested.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.
- Do not reopen FE-007, FE-012, BE-006, or BE-009. Existing Playwright specs stay on `NEXT_PUBLIC_USE_MOCKS=true`.

## Acceptance criteria

- [ ] With mocks off, the lobby and session shell call Nest create, get, join, and end using the BE-009 session
- [ ] `TelehealthSessionRdo` maps onto the UI type; `practiceId` is not used for authorization
- [ ] Daily/WebRTC is not invoked; no `/leave` route is added
- [ ] A synthetic in-window seed plus a loginable provider makes the live shell demonstrable
- [ ] One non-mock browser check covers lobby, join, placeholders, and end

## Implementation notes

With mocks off, the browser calls Nest at `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:3001`). Login stores the opaque bearer from `POST /auth/login`.

Lobby may keep listing joinable visits from `GET /appointments`. Do not invent `GET /telehealth/sessions`. Join visit must `POST /telehealth/sessions` with `{ appointmentId }`, then use the **server-generated UUID** for `GET /telehealth/sessions/:id`, `POST .../join`, `POST .../end`, and `/dashboard/telehealth/[sessionId]`. Stop deriving live session ids as `session-{appointmentId}`.

Map `TelehealthSessionRdo` onto the UI `TelehealthSession` type. Drop `practiceId` from authorization in the client; tenant comes from the session. Extra RDO fields (`patientId`, `providerId`, `waitingStartedAt`, `joinedAt`, `endedAt`) may be omitted from the UI type.

Map the existing Leave control to `POST /telehealth/sessions/:id/end` (closes the visit for all participants). Do not add a `/leave` route. Relabel the control to **End session** if copy must match the contract.

Surface Nest `409` conflicts (outside join window, already ended, office visit) on the existing session error path.

`npm run seed:mock-identity` already has a loginable `PROVIDER` `jordan.ellis@synthetic.example` (`LIVE_DEMO_PROVIDER_ID`, password `Demo-Provider-1`). Add a **relative-to-now** telehealth appointment for that provider and a seeded patient (start near now, end within the demo hour) so create/join succeed inside the 15-minute grace window. Do not reuse the static `2026-10-15` office visit: it is the wrong type and outside the window. Practice admin may see the lobby from appointment read scope but cannot join; live e2e must sign in as that provider.

Extend `playwright.live.config.ts` `testMatch` for a live telehealth spec: sign in as the provider, open the lobby, create/get/join the seeded visit, assert appointment linkage and media placeholders, then end. Do not move mock telehealth specs off `NEXT_PUBLIC_USE_MOCKS=true`. Daily stays unused.

Receptionist remains off Telehealth nav. Frontend checks stay UX only.

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
