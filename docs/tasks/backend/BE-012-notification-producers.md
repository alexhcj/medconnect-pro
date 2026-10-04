---
id: BE-012
type: task
area: backend
feature: notifications
status: pending
priority: high
estimate: 2
dependencies: [BE-008, BE-004]
related_adrs: [ADR-005-synthetic-demo-data.md]
related_docs:
  [
    ../../architecture/backend-architecture.md,
    ../../architecture/infrastructure-architecture.md,
    ../../contracts/identity-and-access.md,
    ../../product/notifications.md,
    BE-008-notification-domain.md,
  ]
implementation:
  status: not_started
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: 1171eb97-c23e-45f4-ab13-74c641c7ec31
  identifier: MEDCONNECT-76
---

# BE-012 — Notification producers (in-process)

## Objective

Enqueue in-app notifications from existing domain writes so the inbox is not only seed-static.
Use the shipped `NotificationService` and in-process `DeliveryBus`.

## Context

[BE-008](BE-008-notification-domain.md) exported `NotificationService` but left appointment
reminder producers out of scope. No other module calls `enqueue`. DATA-002 seeds inbox rows;
this task covers **ongoing** creates so a live appointment write appears in the recipient inbox.

Implements / extends `notifications.domain-http` (producers). UI remains FE-025.

## Scope

- From **appointment create** (and **cancel/delete** if that path already exists), enqueue an
  in-app notification to the assigned provider and, when the patient has a user account, the
  patient. If the seeded patients have no login, notifying the provider is enough to demonstrate
  the producer.
- Keep email/SMS on the existing demo adapters and preference skip rules
- Audit the enqueue/preference-adjacent action **without** title or body in the audit row
  (existing BE-008 PHI rule)
- Tests that a create calls enqueue and that preference-disabled channels are skipped

## Out of Scope

- Client `POST /notifications`
- SNS, SQS, Redis, Bull, push, AWS SDK
- Appointment reminder cron / scheduler
- Document-upload or billing producers (one or two appointment events are enough)
- Frontend inbox (FE-025)
- Changing BE-008 HTTP routes

## Requirements

- Tenant from the session on the originating command; do not trust client `practiceId`
- Self-scope recipients only (`recipient_user_id` is a specific user, not a role blast)
- No new permission strings
- `synthetic: true` on produced rows

## Acceptance Criteria

- [ ] Creating an appointment enqueues at least one in-app notification for a real recipient
  user in that tenant
- [ ] Disabled preference channels are not delivered (existing NotificationService behavior)
- [ ] Audit rows for the producer path omit notification title/body
- [ ] No Redis, SNS, SQS, or new HTTP POST for clients
- [ ] HTTP or service tests cover the producer; do not reopen QA-004’s task file

## Dependencies

- BE-008, BE-004
- DATA-002 is independent (seeded inbox vs live produce)
- Useful before FE-025 but not a hard UI blocker if seed rows exist

## Validation

- `npm run test:api` service/HTTP coverage for enqueue-on-create
- Confirm no AWS SDK dependency added

## Risks / Considerations

- Importing NotificationsModule into AppointmentsModule must not create a circular module
  graph; follow existing Nest export patterns.
- Do not notify every staff member by role.

## Implementation notes

Suggested order: after BE-008 (shipped); can parallel DATA-002. Wire `NotificationService`
from the appointment service after a successful persist.

Writing this spec is not a version bump.

## Completion

- Implementation:
- Tests:
- PR:
- Notes: Pending M10 implementation.
