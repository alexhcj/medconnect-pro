# Frontend Testing

Frontend tests use two runners with separate configs and globs. Do not add Jest.

## Responsibilities

- **Vitest** (`vitest.config.mts`) — unit tests, React component tests, hook tests, and in-process
  component integration. Uses React Testing Library and jsdom.
- **Playwright** (`playwright.config.ts`) — browser E2E for critical workflows, dashboard
  navigation, and Next.js behavior that jsdom cannot cover (including async Server Components).

Do not repeat the same assertion in both layers without a reason. Prefer unit tests for pure logic,
RTL for visible component behavior, and E2E for real routing and layout.

## Organization

| Layer | Location | Suffix |
| --- | --- | --- |
| Unit / component | Colocated under `src/` | `*.test.ts` / `*.test.tsx` |
| E2E | `e2e/` | `*.spec.ts` |

Vitest only discovers files under `src/`. Playwright only discovers files under `e2e/`.

## Naming

Use a behavior-oriented name: `it('opens mobile navigation from the header control')`, not
`it('works')`.

## Test data and mocking

- Use deterministic synthetic fixtures only. See [docs/mocks](../mocks/README.md).
- Never use real patient information.
- Mock Next.js navigation, session, and I/O at the boundary (`vi.mock`). Do not mock away the
  behavior under test.

E2E runs against mock mode with `NEXT_PUBLIC_MOCK_DELAY=0` and `NEXT_PUBLIC_MOCK_ERROR_RATE=0`.

## Testing Library

- Query by role, label, and accessible name (`screen.getByRole`).
- Drive interaction with `@testing-library/user-event`.
- Assert user-visible outcomes, not internal component state.
- jsdom does not apply CSS breakpoints; open the mobile nav via its control instead of resizing.

## E2E

- Chromium only until broader browser coverage is justified.
- Start or reuse the Next.js app through Playwright `webServer` (deterministic mocks).
- Prefer roles and names over CSS selectors.

## Commands

```bash
npx playwright install chromium   # once per machine
npm test                          # Vitest once
npm run test:watch
npm run test:coverage
npm run e2e
npm run e2e:ui
```
