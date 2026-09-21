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

## Clinical data

Keep clinical boundaries explicit.

Use FHIR R4-aligned concepts where beneficial, without claiming complete FHIR compliance.

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
- `UNAUTHORIZED` and `FORBIDDEN` are reserved for later identity work and are not emitted by the
  platform foundation.
- Clients may send `X-Correlation-ID`; the API always returns it (incoming value or a generated UUID).

## Correlation

Header name: `X-Correlation-ID`. The same value appears on the error envelope as `correlationId`.
