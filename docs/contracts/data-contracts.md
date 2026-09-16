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
