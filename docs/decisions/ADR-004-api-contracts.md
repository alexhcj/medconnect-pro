# ADR-004 — API Contract Ownership

## Status

Accepted

## Decision

Before the backend exists, Markdown documents define intended API/data boundaries. Once NestJS is
implemented, OpenAPI generated from the backend becomes the machine-readable API contract.

Postman is the primary interactive API development and testing tool. It consumes the generated
OpenAPI document; it is not a second source of API definitions.

Swagger UI is an optional viewer of the same generated document. It is not required for the
workflow and is not an authorization control.

Human-readable design remains in [`/docs/contracts/`](../contracts/). Do not duplicate generated
OpenAPI schemas in Markdown.

The generated artifact path is `apps/api/openapi/openapi.json`. Do not hand-edit that file.

Developer workflow: [api-contract-workflow.md](../workflows/api-contract-workflow.md).

## Rationale

Writing a complete hand-maintained OpenAPI specification before backend implementation would create
avoidable duplication and drift.

Maintaining independent Postman collections or a separate Swagger schema would create the same
drift. One generated specification feeds both Postman (import) and Swagger UI (optional).

The repository Markdown remains useful as a human-readable domain index.

## Consequences

- Planned endpoints are listed in Markdown until they are implemented as NestJS controllers and
  DTOs.
- Implemented endpoints change in code first, then OpenAPI is regenerated, then Postman is
  re-imported. Markdown is updated only when the human domain index or conventions change.
- Collections in Postman drift unless re-imported after a contract change; the repository does not
  assume cloud auto-sync.
- Secrets, access tokens, and real patient data must never appear in committed OpenAPI artifacts,
  Postman environments, or Markdown examples.
