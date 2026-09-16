# ADR-002 — Tenant Isolation

## Status

Accepted

## Decision

Practice/tenant context is derived from authenticated identity and enforced server-side.

Tenant-owned records carry tenant scope. PostgreSQL RLS may provide defense in depth for sensitive
boundaries.

## Rules

- never trust client-supplied tenant IDs;
- enforce tenant scope in repositories/services;
- test cross-tenant access;
- use tenant-aware cache/storage boundaries.
