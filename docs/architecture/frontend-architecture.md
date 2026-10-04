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
- telehealth workflows;
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

### Client state

Use local React state for local UI concerns.

Use Zustand only for cross-component client state that is not server state.

Do not put server data into Zustand simply to duplicate TanStack Query.

## Public vs authenticated

Marketing routes must not inherit the dashboard shell or session gate. `(auth)` and `(dashboard)`
stay isolated from the public `(marketing)` group ([FE-017](../tasks/frontend/FE-017-marketing-website-foundation.md)).

Implemented App Router groups in `apps/web/src/app`:

```text
(marketing)/          # public; MarketingShell; no session gate
  page.tsx            # /
  platform/page.tsx   # /platform
  platform/*/page.tsx # feature pages (FE-021)
  security/page.tsx   # /security
  about/page.tsx      # /about
  demo/page.tsx       # /demo → existing /login (mock IdP)
(auth)/               # /login, /register, /email-verification
(dashboard)/          # DashboardAuthGate + DashboardShell
```

Marketing chrome lives in `apps/web/src/components/marketing/` (`MarketingShell`, header, footer,
mobile nav, page container, section composition, and `FeaturePageLayout` for `/platform/*`). It reuses
`components/ui` primitives and shared tokens, not the dashboard shell. `/demo` links to
`LOGIN_PATH` (`/login`); it does not add a second identity stack.

Copy must follow [docs/product/](../product/README.md) and
[capability-matrix.md](../marketing/capability-matrix.md). Do not claim HIPAA
certification, production OAuth, live video, or hosted payments. Sitemap:
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

Dashboard overview cards in mock mode use fixtures. Live `GET /dashboard/overview` is not a Nest
controller; the Next BFF path is not a supported live integration. That gap belongs to frontend
Slice 2, not to a failed M0–M7 join.

## Hosting

`apps/web` publishes from `main` on Amplify Hosting compute (SSR App Router; do not
static-export). Operator steps: [deploy.md](../workflows/deploy.md). Hosted preview and
production set `NEXT_PUBLIC_USE_MOCKS=false`. `NEXT_PUBLIC_API_BASE_URL` and server
`API_BASE_URL` must equal **that environment’s** HTTPS API origin (`production_api_url` on
`main`; `preview_api_url` on Amplify PR previews). All-branch Amplify env is the preview API;
`main` overrides to production. Amplify holds no database URLs and
no Secrets Manager ARNs.

Mock IdP login stays same-origin `/login`. Auth remains an opaque bearer in `localStorage`; do
not rewrite identity to cookies. The leftover dashboard-overview BFF may still 401 without an
`accessToken` cookie — hosted validation uses a dashboard list page, not overview cards.

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
