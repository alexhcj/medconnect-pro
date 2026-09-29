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
- public marketing pages (M8; isolated from the dashboard shell). Foundation is FE-017;
  remaining visual language and pages are FE-018–FE-023.

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
mobile nav, page container, and later section/feature-page composition). It reuses
`components/ui` primitives and shared tokens, not the dashboard shell. `/demo` links to
`LOGIN_PATH` (`/login`); it does not add a second identity stack.

Copy must follow [capability-matrix.md](../marketing/capability-matrix.md). Do not claim HIPAA
certification, production OAuth, live video, or hosted payments. Sitemap:
[sitemap.md](../marketing/sitemap.md).

### Design tokens

One Figma file is the canonical visual source ([ADR-011](../decisions/ADR-011-figma-canonical-visual-source.md)).
FE-018 maps color, type, space, radius, and shadow into the Tailwind theme and/or CSS variables
and keeps `Button`, `Card`, and `Input` as shared primitives. Marketing is spacious; the
dashboard stays information-dense. Do not add a second design-system package. Deploy/preview is a
later milestone.

Dashboard overview cards in mock mode use fixtures. Live `GET /dashboard/overview` is not a Nest
controller; the Next BFF path is not a supported live integration. That gap belongs to frontend
Slice 2, not to a failed M0–M7 join.

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
