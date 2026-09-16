# Package Baseline

This project intentionally follows current stable package releases rather than historical versions.

## Current package policy

- Prefer stable releases.
- Avoid alpha/canary/beta packages unless a feature explicitly requires them.
- Verify major upgrades against Next.js/React compatibility before installing.
- Do not add a package when the platform or an existing dependency already solves the problem.
- Backend-only dependencies belong in the backend package, not the frontend package.
- Authentication/crypto packages should not be shipped to the browser unnecessarily.

## Important current decisions

### Keep

- `@daily-co/daily-js` — telehealth client boundary.
- `@headlessui/react` — accessible interactive primitives.
- `@hookform/resolvers` — RHF/Zod integration.
- `@tanstack/react-query` — server state.
- `axios` — keep if the existing API layer is already built around it.
- `class-variance-authority`, `clsx`, `tailwind-merge` — UI class composition.
- `date-fns` — date utilities.
- `lucide-react` — primary icon library.
- `react-big-calendar` — scheduling UI.
- `react-datepicker` — keep only where a dedicated datepicker is useful outside calendar UI.
- `react-dropzone` — secure upload UI boundary.
- `react-hook-form` + `zod` — forms/validation.
- `react-hot-toast` — lightweight transient notifications if the existing UI uses it.
- `recharts` — dashboard analytics.
- `socket.io-client` — planned realtime client.
- `zustand` — limited client state only.

### Remove from frontend

- `bcryptjs` — backend-only password hashing; the target identity architecture is OAuth/OIDC.
- `jsonwebtoken` — do not parse/verify backend JWTs in the browser; authentication should be handled
  through the chosen identity/session architecture.
- `next-auth` — do not add another identity abstraction if the target is OAuth/OIDC with a dedicated
  identity layer. If the existing demo already depends on NextAuth, migrate deliberately rather than
  mixing two auth systems.

### Icons

Prefer Lucide React consistently. Heroicons can be removed if it is not already deeply used.
Keeping both icon libraries is unnecessary duplication.

### React Query Devtools

Keep as a development-only dependency/import path if used, but do not expose it in production.

## Current stable versions verified during this documentation update

- Next.js 16.3.5
- React 19.3.0
- React DOM 19.3.0
- TypeScript 7.0.2
- TanStack Query 5.102.8
- React Hook Form 7.88.0
- @hookform/resolvers 5.9.1
- Zod 4.6.5
- Zustand 5.0.15
- Recharts 3.10.1
- react-big-calendar 1.20.0
- react-dropzone 20.1.1
- socket.io-client 4.8.3
- lucide-react 1.46.0
- tailwind-merge 3.7.0
- bcryptjs 3.0.3 (backend only if custom password auth is ever introduced)
- next-auth 4.24.15 (not recommended for the target architecture)
- @nestjs/swagger 12.0.1
- ESLint 10.10.0
- Prettier 3.6.2 or current stable
- Tailwind CSS 4.x

The version list is a snapshot and should be rechecked before a future dependency upgrade.
