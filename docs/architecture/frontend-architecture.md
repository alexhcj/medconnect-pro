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
- public marketing pages (M8 / FE-017; isolated from the dashboard shell).

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
  security/page.tsx   # /security
  about/page.tsx      # /about
  demo/page.tsx       # /demo → existing /login (mock IdP)
(auth)/               # /login, /register, /email-verification
(dashboard)/          # DashboardAuthGate + DashboardShell
```

Marketing chrome lives in `apps/web/src/components/marketing/` (`MarketingShell`, header, footer,
mobile nav, page container). It reuses `components/ui` primitives and Tailwind tokens, not the
dashboard shell. `/demo` links to `LOGIN_PATH` (`/login`); it does not add a second identity stack.
Placeholder copy must not claim HIPAA certification, production OAuth, live video, or hosted
payments. Design, `/platform/*` feature pages, screenshots, and deploy/preview are later work.

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
