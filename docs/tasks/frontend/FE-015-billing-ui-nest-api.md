---
id: FE-015
type: task
area: frontend
feature: billing
status: implemented
priority: high
estimate: 3
dependencies: [FE-008, BE-007, BE-009]
related_adrs: [ADR-003-authentication.md]
related_docs: [frontend-architecture.md,../contracts/api-endpoints.md,../contracts/data-contracts.md,../contracts/identity-and-access.md,../tasks/backend/BE-007-billing-api.md,../tasks/backend/BE-009-identity-and-access-http.md,FE-008-billing-dashboard.md]
plane:
  work_item_id: 99dce776-8637-4de1-901d-bdf4b2f6420b
  identifier: MEDCONNECT-47
---

# FE-015 — Billing UI on the Nest billing API

## Objective

Connect the existing billing dashboard to the Nest billing API when mocks are off, with a loginable practice-admin session and seeded invoices so the live list and detail are demonstrable.

## Scope

Invoice list and detail against [BE-007](../backend/BE-007-billing-api.md), authenticated with the [BE-009](../backend/BE-009-identity-and-access-http.md) bearer session. Enough synthetic invoices that the live dashboard is demonstrable. One non-mock browser check for seeded list plus detail.

Payment and claims cards stay labeled boundaries. Do not enable Record payment. Do not call `POST /billing/invoices`, `POST /billing/payments`, or `GET /billing/claims`. Stripe SDK, ACH origination, EDI 837 generation, invoice-create UI, and nurse visit-context billing stay unrequested.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.
- Do not reopen FE-008, BE-007, or BE-009. Existing Playwright specs stay on `NEXT_PUBLIC_USE_MOCKS=true`.

## Acceptance criteria

- [x] With mocks off, list and detail call Nest invoices using the BE-009 session
- [x] `InvoiceListRdo` / `InvoiceRdo` map onto the UI `Invoice` type; `practiceId` is not used for authorization
- [x] Payment/claims remain labeled boundaries; Record payment stays disabled; no PAN fields
- [x] A synthetic seed plus a loginable practice admin makes the live dashboard demonstrable
- [x] One non-mock browser check covers seeded list and detail

## Implementation notes

With mocks off, the browser calls Nest at `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:3001`). Login stores the opaque bearer from `POST /auth/login`.

Replace the `billingRealAPI` 404 stub in `apps/web/src/lib/api/billing-api.ts`. Live list is `GET /billing/invoices`; live detail is `GET /billing/invoices/:id`. Unwrap `InvoiceListRdo.invoices`. Do not hardcode mock ids (`demo-invoice-*`). Map `InvoiceRdo` onto the UI `Invoice` type. Drop `practiceId` from authorization in the client; tenant comes from the session.

Keep `PaymentClaimsBoundaries` as labeled Stripe/ACH and EDI 837 copy. Record payment stays disabled. Do not add invoice-create UI. Do not send card or bank account numbers.

`npm run seed:mock-identity` already inserts two Avery Quinn invoices (issued office visit, paid telehealth visit) and a loginable `PRACTICE_ADMIN` `practice.admin@example.test` (password `Demo-Admin-1`). Invoice ids are server UUIDs. The issued row currently uses a static `dueAt` of `2026-09-15`; Nest derives `overdue` when that date is in the past. If the live spec must assert **Issued**, change that `dueAt` to relative-to-now. Do not add a third invoice unless the two seeded rows cannot make the screen demonstrable.

Extend `playwright.live.config.ts` `testMatch` for a live billing spec: sign in as that practice admin, open `/dashboard/billing`, assert seeded Avery Quinn invoices render, open a UUID detail, and assert payment/claims boundary labels. Do not move mock billing specs off `NEXT_PUBLIC_USE_MOCKS=true`.

NURSE remains off Billing nav. Frontend checks stay UX only. PATIENT portal live billing is out of scope (no loginable portal user on seed).

## Completion

- Implementation: Live invoice list and detail on the Nest billing API with the BE-009 bearer session. `GET /billing/invoices` unwraps `InvoiceListRdo.invoices`; detail uses the server UUID. `practiceId` is mapped onto the UI type only; tenant comes from the session. Payment/claims stay labeled boundaries and Record payment stays disabled.
- Tests: Vitest covers `InvoiceRdo` mapping and live list/detail against `/billing/invoices` (Bearer, no client `practiceId`). `npm run e2e:live` covers seeded Avery Quinn Overdue and Paid invoices plus UUID detail; mock Playwright stays on `NEXT_PUBLIC_USE_MOCKS=true`.
- PR:
- Notes: Seed `dueAt` of `2026-09-15` is unchanged; Nest returns `overdue` for the office-visit row. No `POST /billing/invoices`, `POST /billing/payments`, or `GET /billing/claims`. PATIENT portal live billing and nurse visit-context billing stay out of scope.
