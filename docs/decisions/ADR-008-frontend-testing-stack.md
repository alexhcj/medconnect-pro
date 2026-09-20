# ADR-008 — Frontend Testing Stack

## Status

Accepted

## Decision

The Next.js frontend uses **Vitest** for unit and React Testing Library component tests, and
**Playwright Test** for end-to-end browser tests. Jest is not a project test runner.

## Rationale

FE-001 introduced Jest while package scripts already advertised Playwright without installing or
configuring it. Two runners for the same unit/component layer would duplicate dependencies and
conventions. Vitest matches the Vite/Next TypeScript toolchain, keeps RTL, and stays isolated from
Playwright's browser runner.

## Rules

- Vitest owns `apps/web/src/**/*.test.{ts,tsx}`.
- Playwright owns `apps/web/e2e/**/*.spec.ts` and Chromium until another browser is explicitly added.
- React components are tested through user-visible behavior (Testing Library), not implementation
  details.
- E2E uses deterministic synthetic mock data, not production healthcare data.
- Do not reintroduce Jest for frontend tests.

## Consequences

- Frontend QA-001 conventions live in [frontend-testing.md](../workflows/frontend-testing.md).
- Backend/Nest test infrastructure remains a later slice (BE-001).
