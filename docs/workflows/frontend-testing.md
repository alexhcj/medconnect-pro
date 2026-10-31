# Frontend Testing

Frontend tests use two runners with separate configs and globs. Do not add Jest.

## Responsibilities

- **Vitest** (`apps/web/vitest.config.mts`) — unit tests, React component tests, hook tests, and in-process
  component integration. Uses React Testing Library and jsdom.
- **Playwright** (`apps/web/playwright.config.ts`) — browser E2E for critical workflows, dashboard
  navigation, and Next.js behavior that jsdom cannot cover (including async Server Components).

Do not repeat the same assertion in both layers without a reason. Prefer unit tests for pure logic,
RTL for visible component behavior, and E2E for real routing and layout.

## Organization

| Layer | Location | Suffix |
| --- | --- | --- |
| Unit / component | Colocated under `apps/web/src/` | `*.test.ts` / `*.test.tsx` |
| E2E | `apps/web/e2e/` | `*.spec.ts` |

Vitest only discovers files under `apps/web/src/`. Playwright only discovers files under `apps/web/e2e/`.

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
- Authenticated dashboard flows must sign in through the mock IdP (see `e2e/helpers/mock-auth.ts`).
- `npm run screenshots:marketing` (QA-012) uses `playwright.capture.config.ts` to serve a production
  mock build on port 3100 and rewrite the 8 PNGs in `apps/marketing/public/marketing/`. It asserts
  no devtools are present before each shot. `e2e:mocks` ignores `e2e/capture/`. Stop `next dev`
  first: the build overwrites `.next`.

## Live e2e (`npm run e2e:live`)

Browser checks against the Nest API (`apps/web/playwright.live.config.ts`, specs named
`*-live.spec.ts`). Local only; not run in CI. Mock specs never run here and live specs never run
under `npm run e2e:mocks`.

Run procedure (repo root):

1. `docker compose up -d postgres`, then `npm run migration:run`.
2. `npm run seed:mock-identity`. Run it **before every run**: it resets the seeded telehealth visit
   (a finished session cannot be created again, and the visit is joinable for about 4 hours after
   seeding) and puts the seeded appointment back in the current week.
3. Start the API on :3001 (`npm run start -w medconnect-api`, `APP_ENV=local` for the fake OIDC).
4. Reset limiter and session state (see below) if you signed in by hand or ran the suite recently.
5. `npm run e2e:live`. Playwright starts Next on :3000 itself, so free that port first.

How sign-in is handled: `auth` projects run the real sign-in specs (`auth-live`, `auth-mfa-live`,
`auth-oauth-live`); `setup` signs in once as the practice admin and once as the live provider and
saves the sessions under `e2e/.auth/` (gitignored); every other live spec reuses them through
`storageState` and must not sign out; `teardown` signs both out. A run makes 2 practice-admin
password sign-ins, 1 live-provider, 1 MFA nurse, and 1 OAuth. The API allows 5 password sign-ins per
account per 15 minutes and 20 per IP (`auth.login.account`, `auth.login.ip`). Two runs fit; a
third within 15 minutes, or manual sign-ins as the same accounts, hit "Too many attempts".
Production limits are not relaxed for tests.

Reset limiter and session state (local dev database only; it signs out every open session):

```bash
docker compose exec -T postgres psql -U medconnect -d medconnect \
  -c "DELETE FROM rate_limit_buckets; UPDATE auth_sessions SET revoked_at = now() WHERE revoked_at IS NULL;"
```

Writing live specs: do not assert seeded counts or page 1 contents. Lists are paged and runs leave
rows behind (paid $41 invoices, `Quinn Harlow…` patients, appointments), so narrow with the URL
params the filters write (`usersQ`, `auditAction`, `securityAction`, `invoicesStatus`,
`invoicesSort`, `patientsQ`). Clean up only rows the spec created.

## Commands

```bash
npx playwright install chromium   # once per machine
npm test                          # Vitest once
npm run test:watch
npm run test:coverage
npm run e2e
npm run e2e:ui
```
