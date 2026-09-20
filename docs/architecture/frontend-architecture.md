# Frontend Architecture

## Stack

Next.js App Router + React + TypeScript.

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
- billing workflows.

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
