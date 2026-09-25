# Synthetic Mock Data

The project uses deterministic synthetic data for development and demonstrations.

`/docs/mocks` is the **only fixture source of truth**. Runtime mock handlers load these JSON files; they must not duplicate or invent fixture records.

## Rules

- All names and identifiers are fictional.
- `example.test` is used for email addresses.
- `555` telephone ranges are used for obvious demo numbers.
- Never import real patient data into this directory.
- Mock data must not be presented as production healthcare data.
- Code under `apps/web/src/lib/api/mocks` may implement delay, errors, pagination, and in-memory writes. It must not grow the fixture schema ahead of `/docs`.
- Promote a field from application mocks into these files **only when** `/docs` contracts, product requirements, or architecture already require it.

## Files

- `demo-users.json` — synthetic mock-IdP accounts for FE-010 (email/password/role only; not a real IdP).
- `patients.json` — patient RDO-oriented demographics, contact, emergency contact, insurance, tenant/provider assignment.
- `dashboard.json` — aggregate overview metrics only (no patient names or identifiers).
- `providers.json` — providers referenced by `providerId`.
- `appointments.json` — synthetic appointments keyed by patient and provider (type, state, start/end). Runtime handlers add participant display names.
- `medications.json`, `vitals.json`, `history.json`, `conditions.json`, `documents.json` — clinical resources keyed by `patientId` (not nested on the patient).

## Recommended usage

Import fixtures only through the mock API/data layer (`apps/web/src/lib/api/mocks`), via the `@docs/mocks/*` alias.

Do not import JSON directly into UI components.
