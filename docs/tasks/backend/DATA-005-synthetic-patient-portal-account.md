---
id: DATA-005
type: task
area: backend
feature: demo-data
status: pending
priority: high
estimate: 2
dependencies: [DATA-002, BE-009]
related_adrs: [ADR-005-synthetic-demo-data.md, ADR-002-tenant-isolation.md]
related_docs:
  [
    ../../architecture/data-architecture.md,
    ../../contracts/identity-and-access.md,
    ../../mocks/demo-users.json,
    ../../product/identity-access.md,
    BE-003-patient-api.md,
    BE-009-identity-and-access-http.md,
  ]
implementation:
  status: not_started
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: 618b7ebf-8608-4b65-a8c0-ee13d8589632
  identifier: MEDCONNECT-110
---

# DATA-005 — Synthetic patient portal account

## Objective

Add one loginable synthetic `PATIENT` for the interview demo, linked to Avery Quinn, using the
existing mock IdP and `portalUserId`.

## Context

Harbor patients are demographic rows. `upsertPatient` does not set `portalUserId`. The mock IdP
has practice admin, provider, and MFA nurse only. `PATIENT` already has `read:own_patient`,
`read:billing`, and `write:billing`, and the dashboard already shows Dashboard, Appointments,
Telehealth, and Billing for that role. There is no password column on `users`.

## Scope

- Mock IdP account `avery.quinn@synthetic.example` / `Demo-Patient-1`, role `PATIENT`, no MFA.
- Find-or-create the user, a Harbor `PATIENT` membership, and `portalUserId` on the existing
  Avery Quinn patient row.
- Add the same account to [docs/mocks/demo-users.json](../../mocks/demo-users.json).
- Tests: seed is idempotent; the patient list for that user is own-scope; staff accounts are
  unchanged.

## Out of Scope

- A password column, registration, or account-admin UI
- Extra permissions, including `write:appointments`
- A second patient login
- Login panel copy (FE-037)
- Telehealth lookup (BE-024)

## Requirements

- Synthetic data only. Do not invent a real person or reuse a non-demo email.
- Re-running seed must not duplicate the user, membership, or patient, and must not clear
  `portalUserId` once set.
- The patient must not receive staff clinical permissions.

## Acceptance criteria

- [ ] Mock IdP accepts `avery.quinn@synthetic.example` / `Demo-Patient-1` and does not require MFA
- [ ] Seed links that user to Avery Quinn through `portalUserId` and a Harbor `PATIENT` membership
- [ ] A second seed run does not create a second user or membership
- [ ] Own-scope patient reads return Avery Quinn and do not return other patients
- [ ] Practice admin, provider, and MFA nurse fixtures are unchanged
- [ ] `docs/mocks/demo-users.json` lists the patient account
- [ ] OpenAPI does not contain `Demo-Patient-1`

## Dependencies

- Blocked by: DATA-002, BE-009
- Related: FE-037, FE-038, BE-003

## Validation

API unit or seed tests for find-or-create and own-scope. No browser pass in this task.

## Risks / considerations

- `write:billing` already lets this role record a demo payment on own invoices. Do not widen it.
- The patient email matches the demographic email. Login resolves the user row, not the patient
  row. Keep those ids linked only through `portalUserId`.

## Implementation notes

Stable id style should match `LIVE_DEMO_PROVIDER_ID` and `LIVE_DEMO_MFA_NURSE_ID`. Pick one
unused UUID and keep it in the seed module and `demo-users.json`.

Bump is MINOR while `0.x` when this ships: new demo sign-in. Update the release-roadmap crosswalk
for DATA-005 only.

## Completion

- Implementation:
- Tests:
- PR:
- Notes: Not started.
