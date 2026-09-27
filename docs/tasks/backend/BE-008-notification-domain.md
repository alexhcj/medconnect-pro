---
id: BE-008
type: task
area: backend
feature: notifications
status: implemented
priority: medium
estimate: 3
dependencies: [BE-004]
related_adrs: []
related_docs: [backend-architecture.md,infrastructure-architecture.md]
plane:
  work_item_id: 81fe6921-deaf-486a-a34d-b8cb1b4fbfaf
  identifier: MEDCONNECT-17
---

# BE-008 — Notification domain

## Objective

Create notification domain and async delivery boundary.

## Scope

In-app notifications plus email/SMS abstraction.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [x] Notification model exists
- [x] Preferences exist
- [x] Retry policy documented
- [x] Async boundary documented

## Implementation notes

SNS/SQS are target infrastructure; local implementation may use adapters.

## Completion

- Implementation: NestJS notifications module with `GET /notifications`, `PATCH /notifications/:id/read`, `GET /notifications/preferences`, and `PATCH /notifications/preferences`. Inbox and preferences are self-scope only (no new catalog permissions). In-app rows persist as delivered. Email/SMS use demo adapters behind an in-process `DeliveryBus` (three attempts, 1s/4s backoff, then `failed`). `synthetic` is always true. Tenant from the session. Frontend live client stays unwired.
- Tests: Access, schema, service (skip-by-preference, self-only, practiceId reject, audit without payload), delivery retry/fail units; HTTP tests for anonymous access, default/update preferences, own inbox vs other-user/email-ledger/cross-tenant not-found, and client `practiceId` mismatch; RLS coverage for both tables; matrix GET `/notifications` (`npm run test:api` with Compose Postgres).
- PR:
- Notes: Appointment reminder producers stay out of scope (BE-004). No AWS SDK, push, or new permission strings. Version 0.41.1 → 0.42.0 (MINOR).
