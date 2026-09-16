# ADR-004 — API Contract Ownership

## Status

Accepted

## Decision

Before the backend exists, Markdown documents define intended API/data boundaries. Once NestJS is
implemented, OpenAPI generated from the backend becomes the machine-readable API contract.

## Rationale

Writing a complete hand-maintained OpenAPI specification before backend implementation would create
avoidable duplication and drift.

The repository Markdown remains useful as a human-readable domain index.
