# Data Architecture

## Primary store

PostgreSQL.

## Supporting stores

- Redis for cache/session/rate-limit/short-lived coordination where justified.
- S3 for documents and other objects.
- KMS for cryptographic key management.

## Tenant model

```text
Practice
 ├── Users
 ├── Providers
 ├── Patients
 ├── Appointments
 ├── Clinical Records
 ├── Documents
 └── Billing Data
```

## Clinical data

Use FHIR R4-aligned boundaries where useful.

Do not claim full FHIR compliance simply because a DTO resembles a FHIR resource.

Document exactly which resources and workflows are supported.

## Data lifecycle

Sensitive data requires:

- authorization;
- auditability;
- retention policy;
- deletion/archival rules where appropriate;
- backup/restore strategy.

## Synthetic demo data

All fixtures are fictional and must not resemble identifiable real patients.
