# API Architecture

## Style

REST-oriented API with OpenAPI.

## Responsibilities

REST defines:

- resource endpoints;
- HTTP semantics;
- authentication/authorization;
- validation;
- pagination/filtering;
- business operations;
- errors.

OpenAPI defines:

- endpoint contract;
- request/response schemas;
- authentication requirements;
- error schemas;
- documentation;
- contract-testing support.

## Flow

```text
Next.js
  ↓
API client
  ↓
HTTP request
  ↓
NestJS Controller
  ↓
DTO validation
  ↓
Authorization
  ↓
Application service
  ↓
Repository / integration
  ↓
PostgreSQL / Redis / S3 / external API
  ↓
Response DTO
  ↓
Frontend
```

## OpenAPI policy

OpenAPI should be generated from the NestJS backend once the backend exists.

Before the backend exists, repository Markdown contracts describe intended boundaries. They are
planning contracts, not generated OpenAPI truth.
