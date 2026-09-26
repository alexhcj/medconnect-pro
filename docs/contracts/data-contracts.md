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

Application session over a telehealth appointment. This is not a media/WebRTC room and does not
mint join tokens.

Request concepts:

- appointmentId (create only)

Response concepts:

- session identity (server-generated UUID)
- linked appointment identity and window
- authorized participant names
- session state
- waiting/join/end timestamps
- synthetic (always true)

State machine:

- `waiting` after create
- `in_session` after an authorized participant joins
- `ended` after `POST .../end` or after lazy grace expiry

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

## Audit events

`GET /admin/audit-events` returns tenant-scoped rows from `audit_events`. Response fields are
identity and action metadata only: `id`, `practiceId`, `actorUserId`, `action`, `resourceType`,
`resourceId`, `correlationId`, `createdAt`. There is no payload object. Emails, passwords, notes,
and clinical text must not appear. Reads require `admin:practice`. Tenant comes from the session.

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
- `UNAUTHORIZED` and `FORBIDDEN` are reserved for later identity work and are not emitted by the
  platform foundation.
- Clients may send `X-Correlation-ID`; the API always returns it (incoming value or a generated UUID).

## Correlation

Header name: `X-Correlation-ID`. The same value appears on the error envelope as `correlationId`.
