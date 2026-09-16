# API Endpoints Contract

This document describes intended API boundaries before the NestJS backend exists.

Once the backend is implemented, NestJS OpenAPI output becomes the authoritative machine-readable
contract. This file remains a human-readable domain index and should not duplicate every generated
schema.

## Authentication

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/logout-all`
- `POST /auth/mfa/verify`

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
- consistent error envelope;
- correlation/request ID;
- authorization on every protected resource;
- server-side tenant resolution;
- no sensitive fields in error messages.
