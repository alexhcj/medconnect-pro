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
- `GET /auth/sessions` — cookie or Bearer. Caller’s non-revoked issued sessions only. Fields and the
  ban on IP, location, and raw user-agent are in
  [identity-and-access.md](identity-and-access.md). Implemented by
  [BE-023](../tasks/backend/BE-023-concurrent-session-inventory-http.md); generated OpenAPI includes
  this path.
- `POST /auth/sessions/:id/revoke` — cookie or Bearer. Revoke another of the caller’s sessions
  without ending the current one; revoking the current session equals logout. Same CSRF rule as
  logout for cookie mutations. Same field rules as the list. OpenAPI includes this path.
- `POST /auth/mfa/verify` — body `mfaToken` or `mcp_mfa` cookie

Demo OIDC routes ([BE-017](../tasks/backend/BE-017-oidc-client-and-session-issuance.md),
[ADR-014](../decisions/ADR-014-oidc-bff-and-external-identity.md)); not production OAuth.
Providers: `google` (when configured) and `fake` (`APP_ENV=local` only):

- `GET /auth/oauth/:provider/start?returnTo=` — public; `returnTo` must be `/dashboard` or a path
  under it (default `/dashboard`). Creates flow state (PKCE S256, `state`, `nonce`) and 302s to the
  provider. Unknown provider or bad `returnTo` → 400; hosted OAuth not configured → 503
  `OAUTH_UNAVAILABLE`.
- `GET /auth/oauth/:provider/callback` — public; validates and maps identity, sets the existing
  session cookies, then 302s to `WEB_ORIGIN/login/oauth/complete?returnTo=<path>`. Any failure 302s
  to `WEB_ORIGIN/login?reason=oauth_failed` with no provider detail. A rate-limited callback 302s
  to `WEB_ORIGIN/login?reason=rate_limited` with `Retry-After`.
- `GET /auth/session` — cookie or Bearer; `userId`, `email`, `role`, `practiceId`, `expiresIn`
  (server-resolved; no tokens)

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
transport (Daily/WebRTC) is a separate boundary. `POST .../media-token` mints a short-lived Daily
meeting token after the same visit-participant authorization as join, and only when the Nest
session is `in_session`. Get, join, and mint re-check appointment eligibility (type, state, grace)
and lazily end the session when the appointment is cancelled, completed, or past grace
([SEC-008](../tasks/security/SEC-008-live-telehealth-workflow-contract.md)). `POST .../end` closes
the visit for all participants. Leave is a client/Daily teardown; there is no Nest
`POST .../leave`. Daily mint failure is 502 `MEDIA_UNAVAILABLE`.
`GET /telehealth/sessions?appointmentId=` returns the same session object as get for a visit
participant when a non-ended session exists, or 404 when it does not. It does not create a
session. `POST /telehealth/sessions` still requires `write:appointments`.

- `POST /telehealth/sessions` — requires `write:appointments`
- `GET /telehealth/sessions?appointmentId=` — open session for one appointment, or 404
- `GET /telehealth/sessions/:id`
- `POST /telehealth/sessions/:id/join`
- `POST /telehealth/sessions/:id/media-token`
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
- consistent pagination (see [List pagination](#list-pagination));
- consistent filtering/sorting;
- consistent error envelope (see [data-contracts.md](data-contracts.md));
- correlation/request ID (`X-Correlation-ID`);
- authorization on every protected resource;
- server-side tenant resolution;
- no sensitive fields in error messages.

## List pagination

Page-based convention ([BE-025](../tasks/backend/BE-025-billing-and-user-list-pagination-contract.md)).
Applies to `GET /billing/invoices`, `GET /billing/claims` and `GET /admin/users`.
`GET /admin/audit-events` and `GET /admin/security-events`
([BE-026](../tasks/backend/BE-026-audit-and-security-event-list-total.md)) use the same envelope
(`events` plus `total`, `hasMore`, `nextPage`) and `page`/`pageSize` query, but keep a default
`pageSize` of 50 and their existing filters (`action`, `resourceType`, `from`, `to`); `total`
counts the caller's practice rows matching those filters. Patients and appointments use their own
fixed page sizes.

- Query: `page` (integer 1–1000, default 1) and `pageSize` (integer 1–100, default 25). Anything
  else returns 400 `VALIDATION_ERROR`. A request with no params returns the first default page.
- Envelope: the existing array key (`invoices`, `claims`, `users`) plus `total`, `hasMore` and
  optional `nextPage`. `total` counts only rows visible to the caller that match the filters:
  tenant and own-patient scope and filters are applied before paging. A page past the end returns an
  empty array with the same `total`.
- `GET /billing/invoices`: `status` (`issued` | `paid` | `overdue`, derived as in the invoice
  response) and `sort` (`issued-desc` default, `issued-asc`). Ties break on invoice id.
- `GET /billing/claims`: paging only; claims page over the caller's visible invoices, newest first.
- `GET /admin/users`: `q` (case-insensitive email substring; users have no name field) and `role`.
  Ordered by membership creation, then id.
- Unknown `status`, `sort` or `role` values return 400. Unrecognised query keys are ignored.
- **Client compatibility:** the envelope is additive. Clients that read only the array key keep
  working and receive the first 25 rows until FE-043 (users) and FE-045 (invoices, claims) consume
  the paging fields.
