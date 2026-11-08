---
id: DATA-007
type: task
area: backend
feature: identity-access
status: pending
priority: high
estimate: 3
dependencies: [SEC-013, DATA-005, DATA-006]
related_adrs: [ADR-002-tenant-isolation.md, ADR-005-synthetic-demo-data.md, ADR-010-postgresql-typeorm.md]
related_docs:
  [
    ../../contracts/data-contracts.md,
    ../../contracts/identity-and-access.md,
    ../../architecture/data-architecture.md,
    ../../mocks/demo-users.json,
    ../security/SEC-013-telehealth-2-visit-experience-contract.md,
    DATA-005-synthetic-patient-portal-account.md,
    DATA-006-live-seed-for-list-paging.md,
  ]
implementation:
  status: not_started
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: 6dae2090-a8f5-4c76-a561-e6ac829e5ab6
  identifier: MEDCONNECT-160
---

# DATA-007 — Staff display identity and demo visit reason

## Objective

Give every practice membership a display name, an optional credential and an optional demo persona
key, show the display name wherever the API shows a provider today, and seed synthetic names and the
"Blood pressure follow-up" visit reason. Contract: [SEC-013](../security/SEC-013-telehealth-2-visit-experience-contract.md)
scope 6.

## Context

`users` holds only an email (`apps/api/src/persistence/entities/user.entity.ts`) and
`practice_memberships` holds practice, user and role
(`apps/api/src/persistence/entities/practice-membership.entity.ts`). So `providerName` is the
provider's email in telehealth and appointment responses
(`apps/api/src/telehealth/telehealth-session.service.ts:300`,
`apps/api/src/scheduling/appointment.service.ts:339`), and the seeded MFA nurse
(`LIVE_DEMO_MFA_NURSE_ID`, `apps/api/src/identity/seed-mock-identity.ts:59`) has no name at all.
The M22 call shows up to three named tiles, so names must come from the server
([BE-027](BE-027-telehealth-keepalive-and-host-rule.md) builds the `participants` list from this
task's fields).

## Scope

- Migration `1760000000013-MembershipDisplayIdentity` (next number after
  `1760000000012-RateLimitBuckets`): add to `practice_memberships`
  - `display_name varchar(120) null`
  - `credential varchar(16) null` (for example "MD", "RN")
  - `persona_key varchar(40) null`, constrained to a closed list of demo persona keys
  Membership-level, not user-level, so the same user can carry practice-specific display data.
  Identity tables keep no RLS; reads stay filtered by the server-resolved tenant (ADR-002).
- Display rule (one helper used by every RDO): `displayName` when set; otherwise a role label
  ("Provider", "Nurse", "Practice admin", "Receptionist", "Patient"). Never fall back to email.
  For PATIENT memberships the patient record's first and last name win.
- Response changes:
  - Appointment and telehealth session RDOs: `providerName` becomes the display name (for
    example "Dr. Jordan Ellis"). Field name unchanged. The credential is a separate field and is
    not appended.
  - Practice user directory (`apps/api/src/practice/practice-user.rdo.ts`): add `displayName`,
    `credential`, `personaKey`. No write endpoint for them in M22.
- Seeds (`apps/api/src/identity/seed-mock-identity.ts`, `seed-mock-identity-corpus.ts`):
  synthetic display names for every seeded staff membership, including the extra DATA-006 staff
  (a fixed, obviously synthetic name list; deterministic). Demo accounts:
  - provider `jordan.ellis@synthetic.example` → "Dr. Jordan Ellis", credential "MD", persona
    `provider-jordan-ellis`
  - MFA nurse `mfa.nurse@example.test` → "Riley Park", credential "RN", persona `nurse-riley-park`
  - patient `avery.quinn@synthetic.example` → persona `patient-avery-quinn` (name from the patient
    record)
  - practice admin → "Morgan Hale" (no persona; admins don't join calls)
- Demo visit reason: the seeded in-window telehealth appointment's notes become "Blood pressure
  follow-up" (Avery's seeded condition is hypertension). The seed currently looks this row up by
  `LIVE_TELEHEALTH_NOTES` (`seed-mock-identity.ts:67`, used near line 365); keep the upsert
  idempotent by matching the old value once and updating it, or by switching the lookup to a
  stable key. A re-run must not create a second visit.
- `docs/mocks/demo-users.json` and the web mock fixtures (`apps/web/src/lib/api/mocks/fixtures.ts`,
  `telehealth-mock.ts`, appointment mocks) mirror the same names, credentials, persona keys and
  visit reason, so mock mode and live mode match.
- Docs: data-contracts (membership fields shipped), `docs/architecture/data-architecture.md`
  (columns), `docs/product/identity-access.md` if it lists directory fields.

## Out of Scope

- Editing display names in the UI or a PATCH endpoint
- Persona illustrations and the persona camera ([FE-065](../frontend/FE-065-demo-persona-camera.md))
- Session `participants`, `viewerCanEnd`, `mediaExpiresAt` ([BE-027](BE-027-telehealth-keepalive-and-host-rule.md))
- Real names, real credentials or any real person (ADR-005)

## Requirements

- No email is returned as a person's name in any appointment or telehealth response.
- Seeds stay idempotent and synthetic; Render `SEED_ON_DEPLOY` re-runs keep one visit row.
- Display data is not sent to Daily ([SEC-013](../security/SEC-013-telehealth-2-visit-experience-contract.md) scope 5).

## Acceptance Criteria

- [ ] Migration adds the three nullable columns and the persona key constraint; down migration
      removes them
- [ ] One display helper; no RDO shows an email as a name; role label fallback covered by tests
- [ ] Appointment and telehealth `providerName` shows "Dr. Jordan Ellis" for the seeded provider
- [ ] Practice user directory returns `displayName`, `credential`, `personaKey`
- [ ] Seeded nurse is "Riley Park" (credential "RN"); seeded visit reason is "Blood pressure follow-up"; seed
      re-run creates no duplicates
- [ ] Mock fixtures and `demo-users.json` match the seed
- [ ] Contracts and data architecture updated; CHANGELOG entry and version bump (ADR-007)

## Dependencies

- Contract: [SEC-013](../security/SEC-013-telehealth-2-visit-experience-contract.md)
- Shipped: DATA-005, DATA-006
- Blocks: [BE-027](BE-027-telehealth-keepalive-and-host-rule.md), [FE-065](../frontend/FE-065-demo-persona-camera.md)

## Validation

- `npm run test -w apps/api` (seed corpus spec, display helper spec, RDO specs)
- Fresh local seed, then `GET /appointments` and `GET /telehealth/sessions?appointmentId=` as the
  provider and the patient
- Web unit tests that read mock fixtures

## Risks / Considerations

- The `providerName` value changes from email to name: same field and type, so clients keep
  working. Any test that asserts the email string changes with it.
- Renaming the seeded visit notes touches the seed's lookup key (see Scope).
- Version: new response fields and seed data are a compatible feature (MINOR, ADR-007).
