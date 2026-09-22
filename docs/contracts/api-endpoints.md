# API Endpoints Contract

This document describes intended API boundaries. NestJS OpenAPI output is the authoritative
machine-readable contract (`apps/api/openapi/openapi.json`). This file remains a human-readable
domain index and should not duplicate every generated schema.

Planned routes become NestJS controllers and DTOs when the corresponding backend task ships. Those
implementations feed generated OpenAPI; Postman collections are then re-imported from that artifact.
See [API contract workflow](../workflows/api-contract-workflow.md) and [ADR-004](../decisions/ADR-004-api-contracts.md).

## Platform

- `GET /health`
- `GET /ready`

Unauthenticated liveness and readiness. `GET /ready` checks that PostgreSQL accepts a connection
([DATA-001](../tasks/backend/DATA-001-postgresql-tenant-model.md)). `GET /health` does not depend
on the database.

## Authentication

Target identity is OAuth 2.0 / OIDC Authorization Code + PKCE with MFA and refresh-token rotation
([ADR-003](../decisions/ADR-003-authentication.md),
[identity-and-access.md](identity-and-access.md)). The production-oriented user login is the IdP
authorize/callback flow, not a custom password IdP.

The application still exposes a session/BFF surface for token refresh, logout, and (until an IdP
exists) a mock stand-in:

- `POST /auth/login` — mock IdP / BFF stand-in only; not the target production identity protocol
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/logout-all`
- `POST /auth/mfa/verify`

Authorization, tenant resolution, and resource checks on every protected resource follow the
identity-and-access contract. Do not duplicate the permission catalog here.

## Patients

- `GET /patients`
- `GET /patients/:id`
- `POST /patients`
- `PATCH /patients/:id`
- `GET /patients/:id/history`
- `GET /patients/:id/vitals`
- `GET /patients/:id/medications`
- `GET /patients/:id/documents`
- `POST /patients/:id/documents`

## Appointments

- `GET /appointments`
- `GET /appointments/:id`
- `POST /appointments`
- `PATCH /appointments/:id`
- `DELETE /appointments/:id`
- `GET /providers/:id/availability`

## Dashboard

- `GET /dashboard/overview`

## Telehealth

- `POST /telehealth/sessions`
- `GET /telehealth/sessions/:id`
- `POST /telehealth/sessions/:id/join`
- `POST /telehealth/sessions/:id/end`

## Billing

- `GET /billing/invoices`
- `GET /billing/invoices/:id`
- `POST /billing/invoices`
- `POST /billing/payments`
- `GET /billing/claims`

## Administration

- `GET /admin/users`
- `PATCH /admin/users/:id/roles`
- `GET /admin/audit-events`
- `GET /admin/security-events`

## API conventions

- version API when breaking changes require it;
- consistent pagination;
- consistent filtering/sorting;
- consistent error envelope (see [data-contracts.md](data-contracts.md));
- correlation/request ID (`X-Correlation-ID`);
- authorization on every protected resource;
- server-side tenant resolution;
- no sensitive fields in error messages.
