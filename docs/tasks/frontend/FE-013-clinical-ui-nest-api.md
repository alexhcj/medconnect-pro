---
id: FE-013
type: task
area: frontend
feature: ehr
status: planned
priority: high
estimate: 3
dependencies: [FE-003, FE-011, BE-005, BE-009]
related_adrs: [ADR-003-authentication.md]
related_docs: [frontend-architecture.md,../contracts/api-endpoints.md,../contracts/data-contracts.md,../tasks/backend/BE-005-clinical-record-api.md,../tasks/backend/BE-009-identity-and-access-http.md]
---

# FE-013 — Clinical UI on the Nest clinical API

## Objective

Connect the existing patient-profile clinical lists to the Nest clinical API when mocks are off, with a loginable provider session and seeded rows so the live profile is demonstrable.

## Scope

History, conditions, vitals, and medications lists against [BE-005](../backend/BE-005-clinical-record-api.md), authenticated with the [BE-009](../backend/BE-009-identity-and-access-http.md) bearer session. Enough synthetic clinical rows that the live provider profile is demonstrable. One non-mock browser check for those seeded lists.

Documents stay hidden or `clinicalUnavailable` in live mode. POST/create forms, PATCH, and DELETE stay unrequested.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.
- Do not reopen FE-003, FE-011, BE-005, or SEC-003. Existing Playwright specs stay on `NEXT_PUBLIC_USE_MOCKS=true`.

## Acceptance criteria

- [ ] With mocks off, the provider profile calls Nest history, conditions, vitals, and medications using the BE-009 session
- [ ] Clinical RDOs map onto UI types; `practiceId` is not used for authorization
- [ ] Documents are not requested from Nest
- [ ] A synthetic seed plus a loginable provider makes the live clinical profile demonstrable
- [ ] One non-mock browser check covers the seeded provider profile lists

## Implementation notes

With mocks off, the browser calls Nest at `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:3001`). Login stores the opaque bearer from `POST /auth/login`.

Unhide history, vitals, and medications in live mode with the existing permission helpers (`write:medical_records` / `write:vitals`). Do not gate those sections on `isMockMode()`. Documents stay hidden in live mode.

Replace `clinicalUnavailable` with session-authenticated `GET` for `/patients/:id/history`, `/conditions`, `/vitals`, and `/medications`. Map list wrappers (`HistoryListRdo.history`, `ConditionListRdo.conditions`, `VitalListRdo.vitals`, `MedicationListRdo.medications`) onto UI types. Drop `practiceId` from UI types; tenant comes from the session.

Add a conditions list section (diagnoses). [BE-005](../backend/BE-005-clinical-record-api.md) shipped `GET /patients/:id/conditions`; [FE-003](FE-003-patient-profile.md) never rendered `Patient.conditions`. Use a new `ClinicalCondition` UI type. Do not reuse `Patient.conditions: string[]`. Gate it with `write:medical_records`, same as history.

Do not add POST/create forms. Sections are list-only; seed satisfies demonstrability. Do not call document routes, PATCH, or DELETE.

Extend `npm run seed:mock-identity` with at least one history, condition, vital, and medication row on a seeded patient. Add a loginable `PROVIDER` mock IdP account for the existing seeded user `jordan.ellis@synthetic.example` (`LIVE_DEMO_PROVIDER_ID`, password `Demo-Provider-1`). Practice admin remains denied on clinical HTTP.

Extend `playwright.live.config.ts` `testMatch` for a live clinical spec: sign in as that provider, open a seeded patient, assert history, conditions, vitals, and medications render. Do not move mock profile specs off `NEXT_PUBLIC_USE_MOCKS=true`. The practice-admin live patient spec may keep asserting History is absent (no clinical write grants).

## Completion

- Implementation:
- Tests:
- PR:
- Notes:
