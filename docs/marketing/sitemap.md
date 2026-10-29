# Marketing sitemap

Public pages, why they exist, and how they map to Next.js. Requirements:
[requirements.md](requirements.md). Status of each capability:
[docs/product/](../product/README.md). Public-claim ceiling:
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
| `/architecture` | Visual system map, request and authorization flow, current vs planned | FE-055 |

Top-level marketing nav is Home, Platform, Security, About, Architecture, Demo unless this sitemap
changes. `/architecture` is also reached from the footer, About › Architecture, and each Security
implemented control.

## Platform feature pages

| Path | Purpose | Task |
| --- | --- | --- |
| `/platform/patient-management` | Patient directory, profiles, vitals, documents, history | FE-021 |
| `/platform/appointments` | Calendar, appointments, availability | FE-021 |
| `/platform/telehealth` | Virtual-visit workflow (session shell plus demo Daily media) | FE-021 |
| `/platform/billing` | Invoices and labeled payment/claims boundaries | FE-021 |
| `/platform/analytics` | Dashboard metrics as they exist (live Nest overview cards) | FE-021 |
| `/platform/administration` | Users and audit viewer (no role PATCH) | FE-021 |

Use `/platform/appointments` (not `/platform/scheduling`) so the URL matches the existing FE-017
proposal and the appointments module.

## Sign in

Sign-in is **not** a marketing route. Visitors enter the application at `/login`
([FE-010](../tasks/frontend/FE-010-mock-authentication-ui.md)). Marketing CTAs use the absolute
application login URL. Do not add `/sign-in`.

## Outside marketing chrome

`/privacy-policy` and `/terms-of-service` remain outside the marketing layout. They currently
claim HIPAA. Rewriting them is not an M8 marketing task.

## Next.js mapping

```text
apps/marketing/src/app/(marketing)/
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
  architecture/page.tsx
  demo/page.tsx
```

`apps/web` `(auth)/` continues to own `/login`. `(dashboard)/` continues to own the authenticated
app. The application root redirects to `/login`. Marketing components live in
`apps/marketing/src/components/marketing/`. Shared color tokens stay in
`apps/web/src/styles/tokens.css`.

## Deploy

The public pages deploy as a Render static site
([ADR-018](../decisions/ADR-018-render-marketing-static-site.md)). The authenticated application
is a separate web service. Sign-in stays `/login` on that application, not on the marketing host.
`/privacy-policy` and `/terms-of-service` stay on the application. AWS preview and production
hosting remain M9 (paused) and are not closed by this site.
