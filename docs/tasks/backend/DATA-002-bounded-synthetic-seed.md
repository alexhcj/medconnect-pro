---
id: DATA-002
type: task
area: backend
feature: demo-data
status: pending
priority: high
estimate: 2
dependencies: [DATA-001, BE-003, BE-004, BE-007, BE-008]
related_adrs: [ADR-005-synthetic-demo-data.md]
related_docs:
  [
    ../../architecture/data-architecture.md,
    ../../product/analytics.md,
    ../../product/notifications.md,
    BE-008-notification-domain.md,
    BE-011-dashboard-overview-api.md,
  ]
implementation:
  status: not_started
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: 18617f11-3891-44c0-a131-61894dc6f819
  identifier: MEDCONNECT-73
---

# DATA-002 — Bounded synthetic seed for live analytics and inbox

## Objective

Expand `npm run seed:mock-identity` so live dashboard overview cards and the notification inbox
are demonstrable from real tenant rows, without a 10,000-row corpus.

## Context

Current seed is a thin demo: two patients (Avery Quinn, Blake Chen), one scheduled appointment,
one in-window telehealth visit, plus clinical/document/invoice rows. Mock overview cards still
show “2,834 patients”. [BE-011](BE-011-dashboard-overview-api.md) must aggregate honest counts.
[FE-025](../frontend/FE-025-notifications-ui.md) needs a non-empty live inbox.

This is M10 seed work, not a ratings domain and not interview-scale synthetic PHI.

Implements / extends `analytics.overview-api` and `notifications.notification-center` (seed only;
those capabilities stay planned until BE-011 / FE-025 ship).

## Scope

Harbor Synthetic Practice only. Keep existing loginable accounts
(`practice.admin@example.test`, `jordan.ellis@synthetic.example`) and the two named patients.

Add:

- at least **20** synthetic patients (`synthetic: true`);
- at least **8** appointments, including at least **2** whose `startAt` falls on the calendar day
  of seed time (UTC date is enough; match the existing in-window telehealth pattern);
- at least **4** invoices in the current month so a monthly-revenue card can be non-zero;
- at least **3** in-app notification rows for the practice admin and **2** for the provider
  (self-scope inbox; no practice-wide copy).

Idempotent: re-running seed must not duplicate patients by email or explode row counts.

## Out of Scope

- 100–10,000 patient corpus
- Extra directory roles (nurse/receptionist/patient users) unless two memberships cannot
  support later role PATCH — they can; leave BE-010’s two-row directory
- Fake `audit_events` rows
- SNS/SQS, Redis, AWS
- Ratings / patient-satisfaction persistence
- Reopening BE-003/BE-004/BE-007/BE-008 APIs

## Requirements

- All names, emails, and clinical fields remain fictional ([ADR-005](../../decisions/ADR-005-synthetic-demo-data.md)).
- Tenant from Harbor Synthetic Practice `practice_id`. Assigned provider stays
  `jordan.ellis@synthetic.example` unless a row already exists.
- Notification seed rows are in-app inbox items with `synthetic: true`. Do not put note/body
  text into audit payloads if any audit is emitted.
- Do not change Compose Postgres, RLS, or `medconnect_app`.

## Acceptance Criteria

- [ ] After `npm run seed:mock-identity`, Harbor Synthetic Practice has ≥20 patients, ≥8
  appointments (including ≥2 on the seed calendar day), ≥4 current-month invoices, and inbox
  rows for both the practice admin and the provider at the counts above
- [ ] Re-running the seed does not duplicate the expanded patients (email uniqueness) or
  unbounded extra appointments/invoices/notifications
- [ ] Existing live e2e accounts and Avery/Blake rows still exist
- [ ] No real PHI; every new clinical/billing/notification row is `synthetic: true`

## Dependencies

- DATA-001, BE-003, BE-004, BE-007, BE-008 (tables and entities exist)
- Blocks: BE-011 (credible aggregates), FE-025 (non-empty inbox). BE-012 producers are
  independent of seeded inbox rows.

## Validation

- Seed script unit or HTTP-adjacent assertion that counts meet the minima after a second run
- `npm run test:api` still passes with Compose Postgres
- Manual: `npm run seed:mock-identity` then confirm counts in Postgres or via later BE-011

## Risks / Considerations

- Relative “today” appointments must remain valid after re-seed (same pattern as the live
  telehealth window refresh).
- Do not invent metrics the domain cannot support.

## Implementation notes

Suggested order: first M10 task. Edit `apps/api/src/identity/seed-mock-identity.ts`. Keep the
script the single seed entry (`npm run seed:mock-identity`).

Writing this spec is not a version bump.

## Completion

- Implementation:
- Tests:
- PR:
- Notes: Pending M10 implementation.
