# Data Contracts

## Purpose

Define boundaries between external requests, domain/application models and persistence.

## Conventions

```text
Request
  ↓
Request DTO
  ↓
Domain/Application model
  ↓
Persistence model
  ↓
Domain/Application model
  ↓
Response DTO
```

Do not expose persistence models directly to API consumers.

After NestJS exists, request DTOs and response DTOs (RDOs) are the OpenAPI component schemas.
Decorate those types so generated OpenAPI stays aligned with validation. Do not copy generated
schemas back into this file. Workflow: [api-contract-workflow.md](../workflows/api-contract-workflow.md).

## Patient

### PatientCreateDto

Expected concepts:

- firstName
- lastName
- dateOfBirth
- contact information
- emergency contact
- insurance information
- provider assignment

### PatientUpdateDto

Only mutable fields should be accepted.

### PatientRdo

Expose only fields allowed for the authenticated user and tenant.

Clinical fields must not appear merely because the database model contains them.

## Appointment

Request concepts:

- patientId
- providerId
- start/end
- appointment type
- location/session type
- notes where permitted

Response concepts:

- appointment identity
- scheduling state
- authorized participant information

## Telehealth session

Application session over a telehealth appointment. Create, get, join, and end do not mint Daily
meeting tokens. Media is a separate transport: `POST .../media-token` returns an ephemeral
`roomUrl` and meeting token. The session row may persist only an opaque `daily_room_name`. Meeting
tokens are never stored.

Request concepts:

- appointmentId (create only)

Response concepts:

- session identity (server-generated UUID)
- linked appointment identity and window
- authorized participant names
- session state
- waiting/join/end timestamps
- synthetic (always true)

Media-token response concepts:

- roomUrl
- short-lived meeting token (not persisted)

State machine:

- `waiting` after create
- `in_session` after an authorized participant joins
- `ended` after `POST .../end` or after lazy grace expiry

Media-token does not change that state machine. Token TTL is bounded by the join window (appointment
end plus 15 minutes). Nest `ended` remains source of truth if Daily room delete fails.

One session row per appointment. Creating again returns the existing non-ended session. Recreating
after `ended` is rejected.

### Timeout and grace (demo policy)

Not an authentication timeout ([identity-and-access.md](identity-and-access.md) session rules). Not
a production SLA.

- Join window: 15 minutes before `appointment.start` through 15 minutes after `appointment.end`.
- Create is allowed only for `type=telehealth` appointments in `scheduled` or `confirmed` whose end
  plus 15 minutes has not already passed.
- After appointment end plus 15 minutes, the next GET/join/end lazily persists `ended` (no worker).
- Join outside the window returns a conflict. There is no background timeout job.

## Clinical data

Keep clinical boundaries explicit. Clinical collections are nested under a patient and must not appear on `PatientRdo`.

This API is **not a FHIR server**. Request and response DTOs use application field names. FHIR R4
resource names below are conceptual alignment only: payloads are not FHIR JSON, and unsupported
resources, profiles, and code systems are out of scope.

| Collection | HTTP | Bounded FHIR concept | Application fields | Not claimed |
| --- | --- | --- | --- | --- |
| History entry | `GET`/`POST /patients/:id/history` | ClinicalImpression / DocumentReference-like visit event | type (`visit` \| `consultation` \| `procedure`), occurredAt, title, summary, providerId, status | FHIR resource JSON, Composition, narrative notes attached to an event |
| Condition | `GET`/`POST /patients/:id/conditions` | Condition (`code.text` + `clinicalStatus`) | display, clinicalStatus (`active` \| `resolved` \| `inactive`), recordedAt, recordedById | ICD/SNOMED, Condition FHIR profile |
| Vital | `GET`/`POST /patients/:id/vitals` | Observation vital-signs panel (one flattened panel per recording) | recordedAt, systolicMmHg, diastolicMmHg, heartRateBpm, temperatureC, respiratoryRate, spo2Percent, weightKg, recordedById | LOINC, one Observation per measure |
| Medication | `GET`/`POST /patients/:id/medications` | MedicationRequest-like order | name, dosage, frequency, route, startDate, endDate, prescriberId, instructions, status | MedicationStatement vs Request split, RxNorm |

A **history entry** is a significant clinical event in the longitudinal record. It must not contain
diagnoses, vitals, or medications. Narrative notes attached to an event, patient, or appointment are
a later concern. Documents are a separate boundary.

`synthetic` is always true. Actor ids (`providerId`, `recordedById`, `prescriberId`) and tenant scope
come from the session, not from the client. Create DTOs accept only the mutable clinical fields for
that collection.

## Documents

Patient-attached files with metadata in PostgreSQL and bytes in an object store
([SEC-004](../tasks/security/SEC-004-document-access-control.md)). This is **not** a FHIR
DocumentReference server. Conceptual DocumentReference alignment is metadata-only.

Request concepts (upload, `multipart/form-data`):

- `file` (single part; PDF, PNG, or JPEG; max 5 MiB)
- `category` (`intake` | `insurance` | `clinical`)
- optional client `practiceId` is ignored for authorization and rejected on mismatch

Response concepts (metadata):

- document identity (server-generated UUID)
- patient identity
- display `name` (sanitized original filename)
- `contentType` (`application/pdf` | `image/png` | `image/jpeg`)
- `category`
- `sizeBytes`
- `uploadedAt`
- `uploadedById` (session actor)
- `synthetic` (always true)

The object-store key is persistence-only and must not appear on the RDO. Download is
`GET /patients/:id/documents/:documentId/content` (authorized octet-stream), not a public URL.
The demo object store is a local filesystem adapter with tenant-prefixed keys
(`practices/{practiceId}/patients/{patientId}/{documentId}`). S3 SSE-KMS remains the target when
infrastructure exists.

## Billing

Practice-scoped invoices, a Stripe/ACH adapter boundary, and a labeled claims envelope. Billing
accounts are implicit (patient + practice). There is no `/billing/accounts` route. Do not store or
accept payment card or bank account numbers.

Request concepts (create invoice):

- patientId
- dueAt
- optional currency (`USD`)
- lineItems (`description`, `amountCents`)
- optional client `practiceId` is ignored for authorization and rejected on mismatch

Request concepts (record payment):

- invoiceId
- method (`stripe` | `ach`)

Response concepts (invoice):

- invoice identity (server-generated UUID)
- patient identity and display name
- status (`issued` | `paid` | `overdue`) — `overdue` is derived when persisted status is `issued`
  and `dueAt` is in the past
- amountCents (sum of line items, computed server-side)
- issuedAt / dueAt
- line items
- synthetic (always true)

Response concepts (payment):

- payment identity
- linked invoice
- method
- opaque synthetic processor reference
- status `recorded`

Response concepts (claims):

- envelope identity (same as invoice id)
- linked invoice
- status `not_submitted`
- processor labeled `edi837`
- synthetic (always true)

This is not Stripe, ACH origination, or EDI 837 generation. `POST /billing/payments` calls an
in-process demo adapter. `GET /billing/claims` does not persist claim rows or emit X12.

## Notifications

Practice-scoped in-app inbox plus email/SMS delivery ledger
([BE-008](../tasks/backend/BE-008-notification-domain.md)). This is not a push service, SMTP, or
a carrier. Titles and bodies are synthetic only; they must not contain clinical notes, emails,
passwords, or other PHI-like fields.

Request concepts (update preferences):

- optional `inAppEnabled`, `emailEnabled`, `smsEnabled` (booleans)
- optional client `practiceId` is ignored for authorization and rejected on mismatch

There is no client create DTO. Enqueue is an internal application call (`recipientUserId`,
`type`, `title`, `body`, channels derived from preferences).

Response concepts (in-app notification):

- notification identity (server-generated UUID)
- `channel` `in_app` (inbox list does not include email/SMS ledger rows)
- `type` (`generic` | `appointment_changed`)
- `title`, `body`
- `status` (`delivered` for in-app rows that reached the inbox)
- `readAt` (null until `PATCH .../read`)
- `createdAt`
- `synthetic` (always true)

Response concepts (preferences):

- `inAppEnabled`, `emailEnabled`, `smsEnabled`
- `synthetic` (always true)

Missing preference rows return all channels enabled (defaults). Disabled channels are not
dispatched.

### Async delivery and retry (demo policy)

Not a production SLA. Target infrastructure is SNS fan-out to SQS queues consumed by workers.
The current Nest adapter is an in-process `DeliveryBus` (no AWS SDK).

- **In-app:** persist synchronously as `delivered`. No retry.
- **Email / SMS:** persist `pending`, enqueue on the bus, deliver through demo adapters that
  log/capture only.
- **Retry:** up to 3 attempts, waiting 1s then 4s between them (exponential backoff) using the
  injected clock.
- **Dead letter:** after max attempts, persist `status = failed`. There is no AWS DLQ.

Appointment create, cancel, and delete enqueue in-app (and preference-enabled email/SMS)
notifications through [BE-012](../tasks/backend/BE-012-notification-producers.md). Reminder cron
jobs stay out of scope.

## Dashboard overview

`GET /dashboard/overview` returns role-filtered aggregate cards for the session tenant
([BE-011](../tasks/backend/BE-011-dashboard-overview-api.md)). There is no request body. Optional
client `practiceId` is ignored for authorization and rejected on mismatch. No catalog permission
string; any authenticated member of the resolved tenant may read it.

Response concepts:

- `synthetic` (always true)
- `metrics` — only the cards the session role may see (mirrors `docs/mocks/dashboard.json` `roles`,
  without `patient_satisfaction`)

Live metric ids:

- `total_patients`, `todays_appointments` — staff roles; UTC calendar day of `now` for today
- `monthly_revenue` — `SUPER_ADMIN`, `PRACTICE_ADMIN`, `RECEPTIONIST`; sum of invoice `amountCents`
  with `issuedAt` in the current UTC month
- `upcoming_visits`, `open_balance` — `PATIENT` only; scoped through `patients.portalUserId`

`value` is a formatted string (counts and currency). Metric titles and descriptions are generic
labels. They must not include patient names, emails, or other PHI. Do not copy generated OpenAPI
schemas here.

## Audit events

`GET /admin/audit-events` returns tenant-scoped rows from `audit_events`. Response fields are
identity and action metadata only: `id`, `practiceId`, `actorUserId`, `action`, `resourceType`,
`resourceId`, `correlationId`, `createdAt`. There is no payload object. Emails, passwords, notes,
and clinical text must not appear. Reads require `admin:practice`. Tenant comes from the session.

## Security events

`GET /admin/security-events` returns the same RDO fields as audit events from the same
`audit_events` table, filtered server-side to `auth.*` actions (login, logout, MFA, refresh-reuse,
and failed login for a resolvable known user). It does not replace the audit list. Unknown emails
do not produce a practice row. Passwords, MFA secrets, and session hashes must not appear. Reads
require `admin:practice`. Tenant comes from the session. Optional client `practiceId` is ignored
for authorization and rejected on mismatch.

M15 (planned) adds `auth.rate_limited`, written only when a rate-limited request resolves to a
known practice user, at most once per key per window, with no IP, email, or key hash
([ADR-015](../decisions/ADR-015-rate-limiting-and-api-protection.md)).

## Practice user directory

`GET /admin/users` returns session-tenant memberships joined from `practice_memberships` and
`users`. Response fields:

- `id` (user id, not membership id)
- `email`
- `role` (membership role for the resolved practice)
- `practiceId` (session tenant; display only)
- `synthetic` (always true)

`PATCH /admin/users/:id/roles` accepts `{ role }` from the closed catalog and returns the same
practice-user RDO. Optional client `practiceId` on the body is ignored for authorization and
rejected on mismatch.

Identity tables have no RLS. Filter memberships by server-resolved tenant. Optional client
`practiceId` is ignored for authorization and rejected on mismatch. Passwords, MFA secrets, and
session hashes must not appear. Reads and role assignment require `admin:users`.

## Validation

Use server-side DTO validation as authoritative.

Frontend Zod schemas improve UX but do not replace backend validation.

## Error envelope

JSON error responses from `apps/api` use this shape (no stack traces, tokens, or PHI):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "path": "field", "message": "..." }]
  },
  "correlationId": "uuid"
}
```

- `details` is omitted when there are no field-level issues.
- Validation failures use `code` `VALIDATION_ERROR` and HTTP 400.
- Unexpected failures use `INTERNAL_ERROR` with a generic message.
- `GET /ready` uses HTTP 503 and `code` `SERVICE_UNAVAILABLE` when PostgreSQL is unreachable.
- Missing or invalid credentials use `code` `UNAUTHENTICATED` and HTTP 401.
- Authenticated callers without permission, or a client `practiceId` that does not match the
  session tenant, use `code` `FORBIDDEN` and HTTP 403.
- Rate-limited requests (M15; envelope and limiter shipped in
  [BE-018](../tasks/backend/BE-018-rate-limit-platform-and-client-ip.md), route policies pending
  BE-019; [ADR-015](../decisions/ADR-015-rate-limiting-and-api-protection.md))
  use HTTP 429, `code` `RATE_LIMITED`, `details` `{ "retryAfterSeconds": number }`, and a
  `Retry-After` header in seconds. Additive. `details` is an object for this code (OpenAPI
  `RateLimitedErrorEnvelope`); validation errors keep the `[{path, message}]` array. Counters persist in PostgreSQL `rate_limit_buckets`
  (policy, 64-hex key hash, window start, count, expiry; no tenant data, no RLS, no raw IP/email;
  [DATA-004](../tasks/backend/DATA-004-rate-limit-bucket-persistence.md)).
- When the limiter store is unavailable on auth/OAuth routes, the API returns HTTP 503 with `code`
  `RATE_LIMIT_UNAVAILABLE` (fail closed). Other protected routes fail open. Additive.
- Clients may send `X-Correlation-ID`; the API always returns it (incoming value or a generated UUID).

## Correlation

Header name: `X-Correlation-ID`. The same value appears on the error envelope as `correlationId`.
