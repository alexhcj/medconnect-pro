---
id: FE-012
type: task
area: frontend
feature: scheduling
status: planned
priority: high
estimate: 3
dependencies: [FE-006, FE-011, BE-004, BE-009]
related_adrs: [ADR-003-authentication.md]
related_docs: [frontend-architecture.md,../contracts/api-endpoints.md,../contracts/data-contracts.md,../tasks/backend/BE-004-appointment-api.md,../tasks/backend/BE-009-identity-and-access-http.md]
plane:
  work_item_id:
  identifier:
---

# FE-012 — Appointment UI on the Nest appointment API

## Objective

Connect the existing appointment list, calendar, and create UI to the Nest appointment API when mocks are off.

## Scope

List, calendar, and create against [BE-004](../backend/BE-004-appointment-api.md), authenticated with the [BE-009](../backend/BE-009-identity-and-access-http.md) bearer session. Enough synthetic appointments that the live calendar is demonstrable. One non-mock browser check for calendar (or list) plus create.

Availability, PATCH, and DELETE stay unrequested. Those routes exist on Nest; this UI does not consume them.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.
- Do not reopen FE-005, FE-006, BE-004, or QA-003. Existing Playwright specs stay on `NEXT_PUBLIC_USE_MOCKS=true`.

## Acceptance criteria

- [ ] With mocks off, list, calendar, and create call the Nest appointment API using the BE-009 session
- [ ] `AppointmentRdo` maps onto the UI appointment type
- [ ] Availability, PATCH, and DELETE are not requested from Nest
- [ ] A synthetic seed or create path makes the live calendar demonstrable
- [ ] One non-mock browser check covers calendar (or list) plus create

## Implementation notes

With mocks off, the browser calls Nest at `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:3001`). Login stores the opaque bearer from `POST /auth/login`. List and create use `/appointments`. Do not call `GET /providers/:id/availability`, `PATCH /appointments/:id`, or `DELETE /appointments/:id`.

`npm run seed:mock-identity` already inserts one synthetic appointment (`2026-10-15T14:00Z`) for the first seeded patient and live provider `11111111-1111-4111-8111-111111111111`. The calendar visible date already initializes from loaded appointments. The live provider dropdown keeps using that id. It is not a Nest providers route.

Map `AppointmentRdo` / `AppointmentSearchResultRdo` onto the UI appointment type. The list is paginated (default page size 50); the first page is enough for the demo seed. Do not add calendar infinite-scroll.

Surface Nest `409` `APPOINTMENT_CONFLICT` on the existing form error path. Optional: map the seeded provider id to `liveDemoProvider` display name in the client mapper so the calendar does not show the provider email. Do not change BE-004 for that.

Extend `playwright.live.config.ts` `testMatch` for the live appointment spec. Do not move mock appointment specs off `NEXT_PUBLIC_USE_MOCKS=true`.

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
