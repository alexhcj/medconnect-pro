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

OpenAPI is generated from the NestJS backend ([BE-002](../tasks/backend/BE-002-openapi-foundation.md)).
Markdown contracts remain the human-readable domain index, not a second machine-readable spec.

```text
/docs/contracts/          Human-readable design
        ↓
NestJS controllers + DTOs Implementation
        ↓
Generated OpenAPI         apps/api/openapi/openapi.json
        ├── Postman       Primary exploration and API tests
        └── Swagger UI    Optional viewer (/api/docs)
```

- Do not hand-edit the generated JSON.
- Do not maintain a separate OpenAPI file for Swagger UI or Postman.
- Swagger UI may be disabled in production-like deployments; hiding it is not a security control.
- Workflow details: [api-contract-workflow.md](../workflows/api-contract-workflow.md).
- Ownership: [ADR-004](../decisions/ADR-004-api-contracts.md).
