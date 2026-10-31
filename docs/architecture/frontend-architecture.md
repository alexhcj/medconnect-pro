# Frontend Architecture

## Stack

Next.js App Router + React + TypeScript in `apps/web`.

## Layers

```text
UI / route
  ↓
feature components
  ↓
hooks / query layer
  ↓
API client
  ↓
HTTP API
```

## Responsibilities

### Route/page layer

- composition;
- route-level loading/error boundaries;
- access-aware UI composition.

### Feature layer

- patient workflows;
- appointment workflows;
- telehealth workflows (leave is client/Daily teardown; Nest `POST .../end` closes the visit);
- billing workflows;
- public marketing pages (M8; isolated from the dashboard shell). FE-017–FE-023 shipped.

### Query/data layer

TanStack Query owns server state.

Centralize:

- query defaults;
- cache policy;
- retry policy;
- invalidation conventions;
- API error normalization.

### Forms

React Hook Form owns complex form state.

Zod provides schema validation.

### Dates and times

Every displayed date or time goes through `apps/web/src/lib/format/date.ts`, fixed to `en-US`
(`08/10/2026`, `7:00 PM`, viewer-local zone label such as `PDT`), never the browser or OS
language; an ESLint rule bans `toLocale*String` in `apps/web/src`. Date-only values
(`YYYY-MM-DD`) format from their parts, without a UTC conversion. Inputs use `DateField` and
`DateTimeField` (`components/ui/`, FE-057) instead of native date inputs; form values keep their
existing `YYYY-MM-DD` and local `YYYY-MM-DDTHH:mm` formats, so schemas and the API are unchanged.

### Form controls

Every text, search, select, date and time control is 40 px high (`h-10`, Figma `size/control`)
and shares `formControlClassName` (`components/forms/form-field-styles.ts`). Select lists use
`SelectField` (`components/ui/`, FE-058) on the Headless UI listbox, never a native `<select>`
(ESLint rule in `apps/web`); forms bind it with React Hook Form `Controller`, list filters with
controlled values.

### Client state

Use local React state for local UI concerns.

Use Zustand only for cross-component client state that is not server state.

Do not put server data into Zustand simply to duplicate TanStack Query.

## Public vs authenticated

The public marketing site is `apps/marketing`, a static Next.js export. It does not inherit the
dashboard shell or session gate. The authenticated application in `apps/web` owns `/login` and
`/dashboard`. `/` on the application redirects to `/login`. Sign-in links on the marketing site
are absolute URLs on the application origin
([ADR-018](../decisions/ADR-018-render-marketing-static-site.md)).

Implemented App Router groups in `apps/web/src/app`:

```text
page.tsx              # / redirects to /login
(auth)/               # /login, /register, /email-verification
(dashboard)/          # DashboardAuthGate + DashboardShell
```

Marketing pages live in `apps/marketing/src/app/(marketing)/` (`/`, `/platform`, `/platform/*`,
`/security`, `/about`, `/demo`). Chrome lives in `apps/marketing/src/components/marketing/`. It
copies the button and card primitives it needs and imports `apps/web/src/styles/tokens.css`.
`/privacy-policy` and `/terms-of-service` stay on the application.

Copy must follow [docs/product/](../product/README.md) and
[capability-matrix.md](../marketing/capability-matrix.md). Do not claim HIPAA
certification, production OAuth, production telehealth / HIPAA video, or hosted payments. Sitemap:
[sitemap.md](../marketing/sitemap.md).

### Design tokens

One Figma file is the canonical visual source ([ADR-011](../decisions/ADR-011-figma-canonical-visual-source.md)):
https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd

FE-018 maps color, type, space, radius, and shadow into `apps/web/src/styles/tokens.css`.
`:root` keeps Figma WEB names (`--color-bg-surface`, `--radius-md`, `--space-4`). `@theme`
aliases those values to Tailwind utilities (`bg-brand`, `text-foreground`, `border-input`,
`ring-ring`, `font-sans`). Inter is `--font-sans` via `next/font` (`--font-inter` on `<html>`).
`primary-*` aliases the blue scale. Spacing stays the default 4px Tailwind scale.

Shared primitives remain `Button`, `Card`, and `Input` in `components/ui`. Marketing chrome
under `components/marketing/` consumes the same tokens and primitives. Marketing is spacious;
the dashboard stays information-dense — do not restyle dashboard layout from this mapping. Do
not add a second design-system package. Production frontend hosting is AWS Amplify
([INFRA-009](../tasks/infrastructure/INFRA-009-aws-amplify-hosting-for-nextjs.md)); PR previews
use Amplify-native hosts against the shared preview API
([INFRA-010](../tasks/infrastructure/INFRA-010-preview-environment-and-pr-delivery.md)).

Dashboard overview cards in live mode call Nest `GET /dashboard/overview` with credentialed
cookies. Mock mode still renders fixtures. The leftover Next BFF was removed in FE-024.

## Hosting

`apps/web` publishes from `main` on Amplify Hosting compute (SSR App Router; do not
static-export). Operator steps: [deploy.md](../workflows/deploy.md). Hosted preview and
production set `NEXT_PUBLIC_USE_MOCKS=false`. `NEXT_PUBLIC_API_BASE_URL` and server
`API_BASE_URL` must equal **that environment’s** HTTPS API origin (`production_api_url` on
`main`; `preview_api_url` on Amplify PR previews). All-branch Amplify env is the preview API;
`main` overrides to production. Amplify holds no database URLs and
no Secrets Manager ARNs.

Mock IdP login stays same-origin `/login`. Live Nest calls send `credentials: 'include'` and
use HttpOnly session cookies; mock mode still stores a stand-in session in `localStorage`. Live
dashboard overview cards call Nest `GET /dashboard/overview` with those cookies.

## Accessibility

- semantic HTML;
- keyboard navigation;
- visible focus;
- labels and descriptions;
- accessible dialogs/popovers;
- sufficient contrast;
- screen-reader states;
- touch-friendly controls.

## Responsive clinical use

Tablet is a first-class target because clinical workflows may happen away from a desktop workstation.

## Testing

Frontend unit/component tests use Vitest; browser E2E uses Playwright. See
[frontend-testing.md](../workflows/frontend-testing.md) and
[ADR-008](../decisions/ADR-008-frontend-testing-stack.md).
