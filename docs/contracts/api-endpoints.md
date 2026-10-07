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

The application still exposes a mock IdP session surface (not a Next.js identity BFF) for token
refresh, logout, and login until an IdP exists:

- `POST /auth/login` — mock IdP stand-in only; not the target production identity protocol. Sets
  HttpOnly session cookies and still returns a JSON token pair for machine clients.
- `POST /auth/refresh` — body `refreshToken` or `mcp_refresh` cookie
- `POST /auth/logout` — cookie or Bearer
- `POST /auth/logout-all` — cookie or Bearer
- `POST /auth/mfa/verify` — body `mfaToken` or `mcp_mfa` cookie

Protected routes accept the `mcp_access` cookie **or** `Authorization: Bearer`. Browser clients
should send `credentials: 'include'`. Hosted cookie-authenticated mutations also send
`X-CSRF-Token`. Live Next uses cookies and does not persist tokens
([FE-027](../tasks/frontend/FE-027-live-cookie-session-client.md)).

Authorization, tenant resolution, and resource checks on every protected resource follow the
identity-and-access contract. Do not duplicate the permission catalog here.

## Patients

- `GET /patients`
- `GET /patients/:id`
- `POST /patients`
- `PATCH /patients/:id`
- `GET /patients/:id/history`
- `POST /patients/:id/history`
- `GET /patients/:id/conditions`
- `POST /patients/:id/conditions`
- `GET /patients/:id/vitals`
- `POST /patients/:id/vitals`
- `GET /patients/:id/medications`
- `POST /patients/:id/medications`
- `GET /patients/:id/documents`
- `POST /patients/:id/documents`
- `GET /patients/:id/documents/:documentId/content`

Clinical collections are the first EHR slice ([BE-005](../tasks/backend/BE-005-clinical-record-api.md)): history entries (visit/consultation/procedure events), conditions, vitals, and medications. Writes are create-only (`POST`). History entries are not a bucket for diagnoses, vitals, or medications.

Documents are a separate access-control boundary ([SEC-004](../tasks/security/SEC-004-document-access-control.md)): metadata list, multipart upload, and authorized binary download. Upload is `multipart/form-data` (`file` + `category`). Download streams through Nest; it is not a public blob URL. There is no PATCH or DELETE.

## Appointments

- `GET /appointments`
- `GET /appointments/:id`
- `POST /appointments`
- `PATCH /appointments/:id`
- `DELETE /appointments/:id`
- `GET /providers/:id/availability`

## Dashboard

Implemented Nest analytics surface (**M10** [BE-011](../tasks/backend/BE-011-dashboard-overview-api.md),
live UI [FE-024](../tasks/frontend/FE-024-live-dashboard-overview.md)). Any authenticated member of
the session tenant may read it; which cards appear follows role. Live Next.js calls Nest
`GET /dashboard/overview` with credentialed cookies
([FE-027](../tasks/frontend/FE-027-live-cookie-session-client.md)). Mock mode still renders overview
cards from fixtures.

- `GET /dashboard/overview` — session-tenant aggregates (`synthetic` always true); omits
  `patient_satisfaction`

## Telehealth

These routes are the application session for an appointment-linked visit, not a media room. Media
transport (Daily/WebRTC) is a separate boundary. `POST .../end` closes the visit for all
participants; there is no participant-leave route yet.

- `POST /telehealth/sessions`
- `GET /telehealth/sessions/:id`
- `POST /telehealth/sessions/:id/join`
- `POST /telehealth/sessions/:id/end`

## Billing

Invoice list/detail, a Stripe/ACH payment adapter boundary, and a labeled EDI 837 claims envelope.
Do not send card or bank account numbers. `GET /billing/claims` is not claim submission.

- `GET /billing/invoices`
- `GET /billing/invoices/:id`
- `POST /billing/invoices`
- `POST /billing/payments`
- `GET /billing/claims`

## Notifications

In-app inbox and channel preferences for the authenticated user. There is no client `POST` to
create notifications; appointment create, cancel, and delete enqueue internally
([BE-012](../tasks/backend/BE-012-notification-producers.md)).
Email/SMS are adapter boundaries, not live carriers ([BE-008](../tasks/backend/BE-008-notification-domain.md)).

- `GET /notifications`
- `PATCH /notifications/:id/read`
- `GET /notifications/preferences`
- `PATCH /notifications/preferences`

## Administration

- `GET /admin/users`
- `GET /admin/audit-events`
- `PATCH /admin/users/:id/roles` — implemented (**M10** [BE-013](../tasks/backend/BE-013-role-assignment-http.md))
- `GET /admin/security-events` — implemented (**M11** [BE-015](../tasks/backend/BE-015-security-events-http.md))

## API conventions

- version API when breaking changes require it;
- consistent pagination;
- consistent filtering/sorting;
- consistent error envelope (see [data-contracts.md](data-contracts.md));
- correlation/request ID (`X-Correlation-ID`);
- authorization on every protected resource;
- server-side tenant resolution;
- no sensitive fields in error messages.
