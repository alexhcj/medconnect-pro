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

Planned analytics surface (**M10** [BE-011](../tasks/backend/BE-011-dashboard-overview-api.md),
[FE-024](../tasks/frontend/FE-024-live-dashboard-overview.md)). **Not implemented** in Nest. Live
Next.js `/api/dashboard/overview` is a leftover BFF that expects a cookie token and a Nest route
that does not exist. Mock mode renders overview cards from fixtures. FE-024 deletes that BFF.

- `GET /dashboard/overview` — planned; not a current controller

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
create notifications; other domains enqueue internally when they exist
([BE-012](../tasks/backend/BE-012-notification-producers.md) is the M10 appointment producer).
Email/SMS are adapter boundaries, not live carriers ([BE-008](../tasks/backend/BE-008-notification-domain.md)).

- `GET /notifications`
- `PATCH /notifications/:id/read`
- `GET /notifications/preferences`
- `PATCH /notifications/preferences`

## Administration

- `GET /admin/users`
- `GET /admin/audit-events`
- `PATCH /admin/users/:id/roles` — planned (**M10** [BE-013](../tasks/backend/BE-013-role-assignment-http.md)); not implemented
- `GET /admin/security-events` — planned (M11); not implemented

## API conventions

- version API when breaking changes require it;
- consistent pagination;
- consistent filtering/sorting;
- consistent error envelope (see [data-contracts.md](data-contracts.md));
- correlation/request ID (`X-Correlation-ID`);
- authorization on every protected resource;
- server-side tenant resolution;
- no sensitive fields in error messages.
