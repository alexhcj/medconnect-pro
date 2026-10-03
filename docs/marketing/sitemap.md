# Marketing sitemap

Public pages, why they exist, and how they map to Next.js. Requirements:
[requirements.md](requirements.md). Status of each capability:
[capability-matrix.md](capability-matrix.md).

Foundation and finished pages exist from FE-017–FE-023. Do not mix marketing chrome into `(auth)`
or `(dashboard)`.

## Top-level pages

| Path | Purpose | Task |
| --- | --- | --- |
| `/` | Product value and module introduction | FE-019 |
| `/platform` | Complete feature map | FE-020 |
| `/security` | Implemented controls and design principles | FE-022 |
| `/about` | Project, architecture, portfolio context | FE-022 |
| `/demo` | Safe demo entry; links to existing `/login` | FE-022 |

Top-level marketing nav stays Home, Platform, Security, About, Demo unless this sitemap changes.

## Platform feature pages

| Path | Purpose | Task |
| --- | --- | --- |
| `/platform/patient-management` | Patient directory, profiles, vitals, documents, history | FE-021 |
| `/platform/appointments` | Calendar, appointments, availability | FE-021 |
| `/platform/telehealth` | Virtual-visit workflow (session shell, not live video) | FE-021 |
| `/platform/billing` | Invoices and labeled payment/claims boundaries | FE-021 |
| `/platform/analytics` | Dashboard metrics as they exist (mock overview cards) | FE-021 |
| `/platform/administration` | Users and audit viewer (no role PATCH) | FE-021 |

Use `/platform/appointments` (not `/platform/scheduling`) so the URL matches the existing FE-017
proposal and the appointments module.

## Sign in

Sign-in is **not** a marketing route. Visitors enter through `/login` in the `(auth)` group
([FE-010](../tasks/frontend/FE-010-mock-authentication-ui.md)). `/demo` and homepage CTAs use
`LOGIN_PATH` (`/login`). Do not add `/sign-in`.

## Outside marketing chrome

`/privacy-policy` and `/terms-of-service` remain outside the marketing layout. They currently
claim HIPAA. Rewriting them is not an M8 marketing task.

## Next.js mapping

```text
apps/web/src/app/(marketing)/
  page.tsx                         # /
  platform/page.tsx                # /platform
  platform/patient-management/
  platform/appointments/
  platform/telehealth/
  platform/billing/
  platform/analytics/
  platform/administration/
  security/page.tsx
  about/page.tsx
  demo/page.tsx
```

`(auth)/` continues to own `/login`. `(dashboard)/` continues to own the authenticated app.
Marketing components live in `apps/web/src/components/marketing/`. Shared primitives stay in
`apps/web/src/components/ui/`.

## Deploy

Hosted deployment and preview environments are **M9**. They are not implied by this
sitemap.
