# Changelog

All notable changes to the MedConnect Pro application/demo artifact are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) as defined in
[ADR-007](docs/decisions/ADR-007-semantic-versioning.md).

## [0.100.0] - 2026-10-29

### Added

- FE-055: new static `/architecture` marketing page. A system map shows the public site, web app,
  NestJS API (nine domain modules) and PostgreSQL as Current; Daily, the sign-in adapter (mock IdP
  today) and Render demo hosting as External; Redis, S3/KMS and AWS production as Planned (dashed,
  `bg-warning-subtle`, "Planned" badge). From `md` the map is an SVG (title and description) with
  node buttons (`aria-pressed`) and a polite live detail panel; below `md` a grouped accordion list
  replaces it. `/architecture#<node>` preselects a node. The page also draws the five-step
  authorization flow with where each step is enforced, and the current vs planned stack.
- Architecture is the sixth top-nav item (header, mobile menu and footer) and is in the sitemap.
- Each `/security` implemented control has a "Where it's enforced" link to its node.
  `MarketingStatusCard` takes an optional inline `link` beside the static Badge.

### Changed

- `/about` drops "Current stack vs planned" (moved to `/architecture`) and links to the new page
  from the Architecture section. The status tone map adds `External` (neutral).
- `sitemap.md`, the FE-055 spec and `capability-matrix.md` (new "Architecture page" note) match.
  Figma page "FE-055 Architecture" holds the 1440, 768 and 390 frames.

## [0.99.6] - 2026-10-29

### Changed

- FE-054: the `/about` "Implementation state" section is a roadmap board. Three columns
  (Shipped, In progress, Up next), each a list under an h3 `Badge` heading, plus one full-width
  Paused line for AWS production hosting. Columns stack below `lg` and sit three-up from `lg`, so
  no card is alone on a row. Items are capability-level, never task IDs. Figma About frames and
  the `Roadmap item` / `Roadmap paused row` components match.
- `MARKETING_ABOUT_STATE` holds `columns` and `paused` instead of four status cards. The status
  tone map adds `Up next` (neutral).
- `.claude/rules/documentation.md` progress trackers: update the About roadmap board when a
  milestone changes state. `capability-matrix.md` adds an "About roadmap board" note on what each
  column may claim.

## [0.99.5] - 2026-10-29

### Changed

- FE-053: status labels on the `/security`, `/about` and `/demo` cards render as a `Badge`. The
  tone comes from one typed map (`marketing-status-tones.ts`): Implemented pattern, Shipped and
  Current are success; In progress is accent; Not shipped and Planned are neutral; Partial, Paused
  and Must not claim are warning. Badges are static and not focusable.
- The `/demo` "What you can walk through" cards are whole-card links (one focus stop each). The
  route text stays in the footer next to an ArrowRight icon, with hover (stronger border and
  shadow, arrow nudge) and focus-visible ring states. Figma Card `Variant=Route` matches.
- The Patient management and Appointments walk-through descriptions drop the duplicated
  "Link: /platform/..." text.

## [0.99.4] - 2026-10-29

### Added

- FE-052: homepage hero visual. From `lg` the hero is two columns, with the dashboard screenshot
  and two claim chips ("RBAC and tenant isolation", "Synthetic data only"). At `md` the image sits
  alone under the CTAs, and below `md` it is hidden.
- Homepage "Who it is for" role cards: an intro and six cards (icon, role, scope line), with the
  copy approved in the FE-052 spec and covered by a unit test. Below `md` they are 2-column
  icon-and-name tiles. About keeps its role tags.
- Homepage Security principles add "PostgreSQL RLS" and "Document ACL", reused verbatim from
  `/security`.

### Changed

- The homepage uses `MarketingBand` sections in a fixed order:
  - Hero, Practice modules, Product UI, UX principles and Who it is for on surface.
  - Connected workflow and Security principles on canvas.
  - The CTA keeps its rounded brand card.

  A band that follows another of the same tone drops its top padding (Hero → Modules excepted).
- Practice module cards are `MarketingLinkCard`s to `/platform/<slug>`, with the app sidebar's
  icons.
- The Product UI slider:
  - shows one full-width slide;
  - has module chips (`aria-current`) and a disabled-at-the-ends prev/next with an "n / 6"
    counter;
  - labels each slide "n of 6: Module";
  - announces user-driven changes in a polite live region;
  - turns smooth scrolling off under `prefers-reduced-motion`;
  - ignores scroll sync while a requested move is in flight.
- Security principles use `MarketingSplitSection` (the `/security` intro and link) with five icon
  cards. UX principles keep text-only cards in a 3 / 2 / 1-column grid.
- Below `md`, cards use 16px padding (`p-4`), matching the approved Figma 390 frame.
- `telehealth.png` re-captured with the QA-012 signed-in capture.
- `docs/marketing/requirements.md`: super admin is described as scoped to the signed-in practice
  (ADR-016).
- Marketing copy aligned with the homepage:
  - `/about` Security patterns now names PostgreSQL RLS and document ACL.
  - The `/security` authorization model's Role step reads "Six roles; super admin stays in the
    session practice" instead of "Practice and platform roles".
- Capability matrix, Authentication row: the "no patient portal" rule now allows a Patient
  role-scope line that matches the app's role nav and the identity contract. It still rules out
  portal products, portal features and patient sign-up.

### Fixed

- The marketing e2e expects the current Administration feature-page heading ("Users, roles, and
  audit viewer"). It had been stale since the 0.99.1 copy sync.

## [0.99.3] - 2026-10-28

### Added

- FE-051: marketing building blocks for M21.
  - `Badge`: a static status label with `success`, `accent`, `neutral` and `warning` tones,
    using existing tokens only.
  - `MarketingBand`: a full-bleed section background (`surface`, `canvas` or `brand`).
  - `MarketingSplitSection`: a two-column lead and items layout with `reverse`.
  - `MarketingLinkCard`: a card that is a single link, with an arrow, a hover state and a
    focus ring.
- Matching Figma components on the Components page: `Card` variants Default, Icon, Link and
  Status; `Badge`; `Section band`; `Split section`.

### Changed

- Marketing grids: 3 items now go from 1 to 3 columns at `md`, so no card is left on its own at
  640–767 px. 4 items show 2 columns from `sm` before 4 at `lg`.
- `MarketingCtaBand` takes `rowFrom` (`sm`, `md` or `lg`) instead of `stackUntilLg`.
- The homepage CTA renders through `MarketingCtaBand` with unchanged copy; the duplicate
  component is removed.

## [0.99.2] - 2026-10-28

### Added

- QA-012: `npm run screenshots:marketing` regenerates the 8 marketing and README screenshots (`apps/web/playwright.capture.config.ts`, `apps/web/e2e/capture/marketing-screenshots.spec.ts`). It serves a production mock build on port 3100 and asserts that no TanStack Query or Next.js devtools are present before each shot. Fixed 1440 px viewport, device scale factor 1, light scheme, animations off.

### Changed

- All marketing screenshots were recaptured with the new command. `login.png` now shows the FE-050 logo header. Filenames and alt text are unchanged.
- `playwright.config.ts` ignores `e2e/capture/`, so `npm run e2e:mocks` does not run the capture.
- The milestone-close prompt's "Screenshot refresh" step and `frontend-testing.md` now point at the command.

## [0.99.1] - 2026-10-27

### Changed

- Marketing copy synced with the live app state: `/about` Implementation state now covers the application demo, security patterns, the delivery pipeline (CI, manual PR previews, interim Render demo) and paused AWS production instead of stopping at M8. Docker image builds and Terraform definitions are listed as current; Redis, S3/KMS document storage and an applied AWS production stay planned.
- Administration copy no longer says "Security-events HTTP is not shipped"; it describes the tenant-scoped security-events viewer.
- Capability matrix: Scheduling lists the planned waitlist and check-in, the deploy row names the shipped Render PR previews, and a "Last synced release" line tracks the root version.

### Added

- `npm run docs:marketing-sync` (`scripts/ci/check-marketing-sync.mjs`, spec via `npm run test:marketing-sync`): read-only drift check between the product registry, the matrix, marketing copy and the root version; runs in CI.
- Process: `docs-sync-checker`, `implement-task`, `close-milestone` and the documentation rule now require the marketing re-audit and the matrix version line.

## [0.99.0] - 2026-10-26

### Added

- FE-050: the web auth pages (`/login`, `/register`, `/email-verification`) show the MedConnect Pro
  logo above the card and a "← Back to home" link below it, both plain same-tab links to the
  marketing site, so a visitor who arrived by a direct link can leave without Back. Logo target is at
  least 44 px tall with a visible focus ring and the accessible name "MedConnect Pro, back to home".
  Below 360 px the wordmark shrinks (Compact variant).
- `NEXT_PUBLIC_MARKETING_URL` (web, optional, public, build-time). Only an `http(s)` URL is used;
  unset or invalid renders the logo as plain branding with no link and no back link. Documented in
  `environment-configuration.md`, the `.env.*` examples, `deploy-render.md` and `deploy.md`; set in
  `render.yaml` for `medconnect-web`. Amplify needs the value in the console (operator step).

### Changed

- New shared `app/(auth)/layout.tsx`. `/login/oauth/complete` moved to an `(oauth)` route group (same
  URL, same `noindex`, no header). The login, MFA and stub cards no longer own the full-screen
  wrapper; the page is top-aligned and the FE-049 status-indicator bottom reserve moved to the layout.

## [0.98.0] - 2026-10-26

### Added

- FE-049: API status indicator on web `/login`. A fixed bottom-right button opens a small non-modal
  card (checking, waking, ready, unreachable): it opens by itself while the free-tier API wakes
  (elapsed seconds, "usually about a minute", no percentage), gives up with a manual Retry after
  about 90 s, and collapses to a green dot when `/health` answers. Polls `/health` with backoff
  only while checking or waking; a healthy dot never polls. Bottom sheet below 480 px, with page
  bottom padding so the form stays clear. Hidden in mock mode and PR previews. Real `<button>` with
  `aria-expanded`; Enter/Space toggle, Esc closes; one `role="status"` announcement per change.
- Wake ping helper (web and marketing): unauthenticated, cookieless, no-cors `keepalive`
  `GET /health`, deduplicated for 60 s per tab and across tabs through `localStorage`, skipped for
  `navigator.webdriver`. Web `/login` pings on first form focus, not on mount. Marketing pings only
  on a trusted hover, focus or click on a sign-in link.
- `ServiceWakingError` in `apps/web/src/lib/api/http.ts` (502/503/504 without an error envelope,
  network failures and timeouts). A sign-in submitted while the API is asleep is queued, shows
  "Server is waking up, see the status indicator", finishes by itself (including the MFA step),
  can be cancelled, gives up after three automatic attempts, drops after 5 minutes, and never resends
  a sign-in that timed out (it may have reached the server). 401, 429 and enveloped 5xx
  handling is unchanged. Attention cue on a queued submit: ring pulse, shake only under
  `prefers-reduced-motion: no-preference`.
- `NEXT_PUBLIC_API_ORIGIN` (marketing, optional, public, build-time). Documented in
  `environment-configuration.md` and the marketing `.env.*` examples. Unset sends no ping.
- `@axe-core/playwright` (web devDependency) and Playwright specs for the indicator: touch tap,
  mouse hover preview, and axe scans (WCAG 2.2 A/AA) of `/login` in the waking and queued states.
- `/login` has a page title ("Sign in | MedConnect Pro"); axe flagged its absence.
- `/login` is `noindex`, and a new `apps/web/src/app/robots.ts` disallows it.

### Changed

- The `/mcp-api` route returns a bare 502 when the upstream is unreachable (previously an
  unhandled 500), which the client reads as a wake.
- `deploy-render.md` notes the wake ping, the API origin variable and instance-hours watching.
  No API or data contract change.

## [0.97.4] - 2026-10-26

### Changed

- SEC-011: production audit regressions. `package-lock.json` moves `zod` 4.6.5 -> 4.6.7,
  `body-parser` 2.3.0 -> 2.4.0 and `fast-uri` 3.1.8 -> 3.1.9; a root `overrides` entry pins
  `multer` to 2.5.0 (`@nestjs/platform-express` pins 2.4.0 exactly). `@nestjs/*` stays at 12.1.2.
  `npm audit --omit=dev` exits 0 again. No API or data contract change.

## [0.97.3] - 2026-10-23

### Added

- INFRA-020: `.github/pull_request_template.md` (task ID, Plane identifier, lane, preview, ADR-007
  impact, docs checklist).

### Changed

- `render.yaml`: `autoDeployTrigger: checksPass` on `medconnect-api`, `medconnect-web` and
  `medconnect-marketing`, so a red `ci` on `main` deploys nothing.
- `preview-status.yml`: with `AMPLIFY_APP_ID` unset the PR comment now describes the Render setup
  (CI result, `render-preview` label, mock-data web previews, link to `delivery-lanes.md`). The
  Amplify branch is unchanged. `test:render-previews` and `test:preview-delivery` cover both.
- `deploy-render.md` and `delivery-lanes.md` describe the gate. No API or data contract change.

## [0.97.2] - 2026-10-23

### Added

- FE-048: preview environment banner on `apps/web` (all routes, above the app shell and login) and
  `apps/marketing`. A thin, non-dismissable `role="status"` strip on warning tokens, shown only
  when `NEXT_PUBLIC_DEPLOY_CONTEXT` is exactly `pr-preview`; no DOM otherwise. Web copy: "PR
  preview · mock data · not the live demo"; marketing copy omits "mock data".
  `scripts/infra/render-marketing.mjs` now sets the variable on a marketing PR preview build
  (`IS_PULL_REQUEST=true`) and removes it otherwise; `render.yaml` builds marketing through it and
  `test:render-previews` covers it.

### Changed

- `environment-configuration.md`: `NEXT_PUBLIC_DEPLOY_CONTEXT` applies to web and marketing; the
  `.env.*.example` files note it stays unset outside Render previews. No API or data contract
  change.

## [0.97.1] - 2026-10-23

### Security

- SEC-010: cleared the 3 critical `npm audit --omit=dev` findings so the last `ci` step passes.
  `next` 16.3.8 -> 16.4.2 and `eslint-config-next` 16.3.8 -> 16.4.2 in `apps/web` and
  `apps/marketing` (GHSA-2464-fhr4-w9xw, GHSA-p3m5-59mp-jv5r, GHSA-673q-mjm6-r5xr).
  `@tanstack/react-query-devtools` moved to `devDependencies` in `apps/web`, which removes the
  `seroval` / `solid-js` path (GHSA-p6vx-979v-rg4c, GHSA-jp82-f5mq-hwhp) from the production
  tree. No code or contract change.

## [0.97.0] - 2026-10-23

### Added

- INFRA-019: Render PR service previews for `medconnect-marketing` and `medconnect-web`
  (`previews.generation: manual` in `render.yaml`; label `render-preview` or `[render preview]` in
  the title). `scripts/infra/render-web.mjs` builds the web preview on frontend mocks (no simulated
  errors, short delay, demo accounts shown, `NEXT_PUBLIC_DEPLOY_CONTEXT=pr-preview`) and starts it
  without `API_BASE_URL`, so `/mcp-api` answers 503. Live mode needs a non-PR build on `main`; any
  other state fails closed to mocks. The API and Postgres get no preview. Added
  `npm run test:render-previews` (Blueprint guard and mode-selection tests).

### Changed

- `render.yaml`: web build and start commands go through `render-web.mjs`.
- `environment-configuration.md`, `deploy-render.md`, `delivery-lanes.md`: preview behaviour,
  `IS_PULL_REQUEST` and `RENDER_GIT_BRANCH` mapping, cost and free-hours note. No application
  code or API change.

## [0.96.3] - 2026-10-22

### Fixed

- FE-047: audit and security event timestamps stay on one line from `md` up. The Time column is
  content-sized (`md:w-px` with no-wrap) instead of a fixed 192 px, and the other columns break
  anywhere (`overflow-wrap: anywhere`) so the table no longer clips at 1024 px. Mobile cards are
  unchanged. Added a unit test for the column classes and an e2e width check at 1440, 1280 and
  1024 px. `patient-form.test.tsx`: the two `fillCreateForm` tests now use
  `userEvent.setup({delay: null})` (about 3.5 s down to about 0.3 s each, previously close to the
  5 s default timeout under load). No API change.

## [0.96.2] - 2026-10-22

### Fixed

- FE-046: the audit Action filter now offers all 41 actions the API writes (adds appointment
  update/delete, `auth.oauth.*`, `auth.mfa.failed`, `auth.logout_all`, `auth.refresh.reuse`,
  `auth.session.revoked`, condition, medication, document list, vital list, patient update and
  telehealth media actions); the security-events filter offers every `auth.*` action. Removed the
  mock-only `invoice.viewed`. One declared action set with a drift-guard unit test. No API change.

## [0.96.1] - 2026-10-22

### Changed

- DATA-006: `npm run seed:mock-identity` adds 24 synthetic NURSE/RECEPTIONIST staff users, 8 older
  invoices on other patients, and 45 labeled audit events (30 `auth.*`, `seed-audit-NN` correlation
  ids), so the live audit, security-event, user, invoice and claims lists have a second page.
  Seeding stays idempotent. No schema, API or login change.

## [0.96.0] - 2026-10-21

### Added

- FE-045: `/dashboard/billing` loads one page of 10 invoices and one page of 10 claims envelopes at
  a time. Invoices have Status (All, Issued, Paid, Overdue) and Sort (newest or oldest issued first)
  selects, "Clear filters", "Showing 11–20 of 312 invoices · newest first", and numbered
  pagination (compact "Page N of M" below 768 px). Claims page on their own with the same range
  label; their pager is numbered when the card is at least 32 rem wide and compact otherwise. A filter or sort change returns the invoices to page 1 and leaves the
  claims page alone. Page, status and sort live in URL query params (`invoicesPage`,
  `invoicesStatus`, `invoicesSort`, `claimsPage`), so refresh and back/forward keep position; unknown
  values fall back to the defaults. The pager is hidden when everything fits on one page, disabled
  while the next page loads, and focus moves to the list after a page change. Loading, empty,
  filtered-empty, page-past-the-end and error states for both lists. Patients see only their own
  invoices and claims, with their own totals.
- `Pagination` takes `pageSize` and `container`; with `container` it switches layout on the width of
  its own container (CSS container query) instead of the viewport, so the claims card shows numbered
  pages whenever there is room.
- Mock mode: 30 generated synthetic invoices (35 in all) so paging, filters and sort can be seen
  without the live API; they live in the mock adapter, not in the shared fixture.

### Changed

- The Payment and Claims cards sit in a 1 : 2 grid from 768 px (Payment takes less space), and the
  Claims card is now titled "Claims envelopes" (was "Claims boundary"), matching the list, the
  product docs and the Figma frames; the list label, pager label and messages use the same name.
- `billingAPI.listInvoices` and `listClaims` take page and filter params and return
  `{items, total, hasMore, nextPage}`; `useInvoices` and `useClaims` take params and keep the
  previous page on screen while loading. Recording a payment refetches the page being viewed.
- The "View invoice" link is a 44 px target. `SelectField` accepts display labels for option values.

### Fixed

- `useListUrlState`: two list changes made before the URL updated (for example paging invoices and
  then claims) no longer drop the first change.

## [0.95.0] - 2026-10-20

### Added

- FE-044: the patients list shows one page of 10 rows with Previous/Next controls instead of
  growing with "Load more". The range ("Showing 11–20") and "Page N" sit beside the buttons; below
  768 px the buttons are full width. The API returns no total, so there is no page count. Page,
  search, status and sort live in URL query params (`patientsPage`, `patientsQ`, `patientsStatus`,
  `patientsSort`), so refresh and back/forward keep position; changing search, status or sort
  returns to page 1. Unknown status or sort values in the URL fall back to the defaults. Focus moves
  to the list after a page change; the pager is disabled while the next page loads.
- `SimplePagination` (`components/ui/simple-pagination.tsx`) for lists without a total, and
  `usePatientPage`, a single-page query that keeps the previous page on screen while loading.

### Changed

- The patient list status and sort selects are 44 px high. `usePatientSearch` stays for the
  appointment form's patient picker.

## [0.94.0] - 2026-10-20

### Added

- FE-043: Users, Audit events and Security events on `/dashboard/admin` load one page of 25 at a
  time. Numbered pagination (compact Previous/Next with "Page N of M" below 768 px) shows
  "Showing 26–50 of 312 events · newest first". Filters: action, resource type and From/To dates for
  events; email search (Search button or Enter) and role for users. Page and filters live in URL
  query params, namespaced per list (`auditPage`, `securityAction`, `usersQ`, and so on), so refresh
  and back/forward keep position; a filter change returns to page 1. Compact table from 768 px,
  stacked rows below; filtered-empty, past-the-end, page-change loading and error states. The
  `Pagination` control is shared for FE-044 and FE-045.
- Mock mode: deterministic synthetic rows after the shared fixtures (66 audit, 44 security, 46
  users) so paging can be demonstrated; the mock honours the same page, filter and total semantics.

### Changed

- `Input` is 44 px high (`h-11`) to meet the touch-target requirement; the patient list search and
  appointment form inputs follow. The Figma `Input` component matches.
- The admin API client and hooks return a paged result (`items`, `total`, `hasMore`, `nextPage`)
  and send `pageSize=25` explicitly (audit and security default to 50 on the server). A role change
  patches every cached users page. Date filters are UTC days sent as ISO instants.

## [0.93.0] - 2026-10-20

### Added

- BE-026: `GET /admin/audit-events` and `GET /admin/security-events` return `total` next to `events`,
  `hasMore` and `nextPage`. It counts only the caller's practice rows that match the `action`,
  `resourceType`, `from` and `to` filters; a page past the end returns an empty array with the same
  `total`. Documented under "List pagination" in `docs/contracts/api-endpoints.md`.

### Changed

- The change is additive, so the current web client keeps working. Default `pageSize` stays 50.

## [0.92.0] - 2026-10-20

### Added

- BE-025: `GET /billing/invoices`, `GET /billing/claims` and `GET /admin/users` are paged. They take
  `page` (default 1) and `pageSize` (default 25, max 100); invoices also take `status`
  (`issued` | `paid` | `overdue`) and `sort` (`issued-desc` default, `issued-asc`); users take `q`
  (email substring) and `role`. Invalid values return 400. Responses keep their array key and add
  `total`, `hasMore` and `nextPage`, counted after tenant and own-patient scoping. Convention
  documented under "List pagination" in `docs/contracts/api-endpoints.md`.

### Changed

- The envelope change is additive, so the current web client keeps working: it reads the array key
  and receives the first 25 rows until FE-043 and FE-045 consume the paging fields.

## [0.91.3] - 2026-10-20

### Changed

- FE-042: in mock mode the billing adapter now follows the signed-in role as the API does. A patient
  sees only their own invoices, claims and invoice detail (another patient's invoice is not found),
  providers read practice-wide but cannot record a payment, and nurses are denied. Invoice status
  text is coloured in the list and detail (paid green, overdue red, issued neutral grey) with the
  label kept, using a new `color/text/success-strong` token. "Payment recorded" is now a transient
  notification shown only right after recording instead of text in the Payment boundary card.

### Fixed

- FE-042: in mock mode a recorded payment now shows as paid on the invoice detail and list after
  refetch (the mock returned objects it mutated in place). The mock e2e sign-in helper no longer
  trips on the login page "Copy email" buttons.

## [0.91.2] - 2026-10-20

### Changed

- FE-041: the record-payment dialog's method radios are styled to match Figma (16 px, brand
  accent, focus-visible outline, dimmed when disabled). Method rows are at least 44 px tall with a
  2 px gap. The Payment boundary card hugs its content instead of stretching to the Claims boundary
  card. Figma frames and the shared `Method radio` component are updated.

## [0.91.1] - 2026-10-20

### Changed

- FE-040: the marketing header logo no longer wraps or shrinks; below 360 px it shows the mark
  only while keeping the accessible name "MedConnect Pro". Marketing and app mobile-nav drawers
  show the logo on one line with a 16 px wordmark. The About page role tags now render with the
  Homepage tag colours and spacing through one shared `RoleTag` / `RoleTagList`.

## [0.91.0] - 2026-10-16

### Changed

- INFRA-017: the README, shared product screenshots, and GitHub About describe the interim Render demo. The sign-in panel shows the MFA nurse code. The verified deployed commit is `c6c79b7f8b9b84b31caa915d97a4a1c7281412f1`. See [docs/releases/render-demo-note.md](docs/releases/render-demo-note.md).
- FE-039: public sign-in no longer offers the provider button unless `NEXT_PUBLIC_OAUTH_ENABLED`
  is exactly `true`. Render, preview, and production leave the flag unset and show that provider
  sign-in is not configured. Local Fake or Google sign-in still uses the existing button when
  the flag is on.

## [0.90.0] - 2026-10-16

### Added

- FE-038: a portal patient or assigned nurse can open an existing telehealth visit from Join
  visit. Writers still create the session. If the visit is not open yet, lookup does not create
  one.

## [0.89.0] - 2026-10-16

### Added

- FE-037: `/login` lists the four synthetic demo accounts, with role labels, copy actions, and
  the MFA nurse code, only when `NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS` is exactly `true`. Render and
  local examples set the flag. Production examples leave it unset.

## [0.88.0] - 2026-10-16

### Added

- BE-024: a visit participant can resolve the one non-ended telehealth session for an appointment
  with `GET /telehealth/sessions?appointmentId=`. Patients and nurses still cannot create a
  session. Lobby entry stays FE-038.

## [0.87.0] - 2026-10-15

### Added

- DATA-005: one synthetic patient can sign in as Avery Quinn (`PATIENT`, no MFA). The Harbor
  seed links that user through `portalUserId`. The login panel still lists only the existing
  staff hints until FE-037.

## [0.86.1] - 2026-10-15

### Fixed

- INFRA-016: the marketing static site no longer sets `region`. Render rejects that field on a
  static site, so the Blueprint could not sync.

## [0.86.0] - 2026-10-14

### Added

- INFRA-016: the public marketing site is its own static export (`apps/marketing`). Sign-in
  links and canonical URLs come from public build-time origins. Render can publish it beside
  the existing app and API. This does not close M9.

### Changed

- The Next.js application root redirects to sign-in. Marketing routes are no longer served
  from `apps/web`. `/mcp-api` and host-only session cookies are unchanged.
- The Render Blueprint adds the static site, custom domains, and `WEB_ORIGIN` for
  `https://medconnectpro.app`. The temporary `onrender.com` app URL stays on `WEB_ORIGINS`
  until that name is turned off.

## [0.85.2] - 2026-10-14

### Fixed

- INFRA-015: the Render API build installs devDependencies. `NODE_ENV=production` was making
  `npm ci` skip `@nestjs/cli`, so `nest build` failed with `nest: not found`.

## [0.85.1] - 2026-10-14

### Fixed

- INFRA-015: free Render web services reject a pre-deploy command. The API start command now
  creates `medconnect_app`, applies the already-built migrations, and seeds only when
  `SEED_ON_DEPLOY=true`, then listens. If `CREATE ROLE` fails, the deploy fails.

## [0.85.0] - 2026-10-13

### Added

- INFRA-015: interim Render public demo. Preview can use `DOCUMENT_STORAGE_DRIVER=local`
  without S3. The browser can call `/mcp-api` on the web origin, with `PUBLIC_API_PREFIX`
  applied to access, refresh, and MFA cookies. Render pre-deploy derives the `medconnect_app`
  URL and can seed synthetic data. AWS Amplify, ECS, and Terraform are unchanged. This does
  not close M9.

## [0.84.1] - 2026-10-11

### Changed

- QA-005 (M17): the HTTP authorization matrix covers session-tenant SUPER_ADMIN allow and
  foreign-practice deny, same-practice other-provider telehealth join and mint denial, mint after
  end (`409` `SESSION_NOT_JOINABLE`), cross-practice payment POST `404`, and receptionist clinical
  history GET `403`. No API or UX contract change.

## [0.84.0] - 2026-10-11

### Added

- FE-036 (M17): the concurrent-session dialog lists live Nest sessions and can end other sessions
  without signing out. Logout everywhere still calls `POST /auth/logout-all`. Live rows omit IP,
  location, and browser. Mock location and IP stay labeled demo data. Not a production session
  manager.

## [0.83.0] - 2026-10-11

### Added

- BE-023 (M17): `GET /auth/sessions` lists the caller’s issued sessions (`sessionId`, timestamps,
  `isCurrent`) and `POST /auth/sessions/:id/revoke` ends another session without signing out the
  current one. Responses omit IP, location, and user-agent. Revoking the current session clears
  cookies. Unknown and other-user ids return the same `NOT_FOUND`. Selective revoke writes
  `auth.session.revoked`. List and revoke use fail-open session-user rate limits.

## [0.82.0] - 2026-10-11

### Added

- BE-022 (M17): successful `GET /patients/:id/history|conditions|vitals|medications` each write one
  tenant-scoped audit row (`history.listed`, `condition.listed`, `vital.listed`,
  `medication.listed`). The resource is the patient. Rows omit names, clinical text, vitals, and
  tokens. Denied and not-found lists do not emit those actions.

## [0.81.2] - 2026-10-10

### Fixed

- Expected 403 `FORBIDDEN` mutations (nurse/patient create, receptionist join, other
  permission-denied writes) no longer retry or console-log. Telehealth Join/End alerts surface
  Nest’s permission message instead of a generic fallback.

## [0.81.1] - 2026-10-10

### Fixed

- Live Join visit no longer retries or console-logs expected 409 `SESSION_ENDED` / conflict
  mutations. The in-page "session has already ended" alert is unchanged.

## [0.81.0] - 2026-10-10

### Added

- BE-021 / FE-035 (M16 Live Telehealth): Nest re-checks appointment eligibility on get, join, and
  media-token; mint requires `in_session`; create/join rate limits; OpenAPI documents 502
  `MEDIA_UNAVAILABLE`.
- Pre-join camera and microphone check on the waiting room. Leave call tears down Daily (or mock
  placeholders) without ending the visit; End session still calls Nest `POST .../end` for roles
  with `write:appointments`.

### Changed

- Breaking (telehealth mint): `POST /telehealth/sessions/:id/media-token` requires `in_session`.
  Mint while `waiting` returns 409 `SESSION_NOT_JOINABLE`.
- Ended, `SESSION_ENDED`, and `SESSION_NOT_JOINABLE` sessions show a terminal unavailable state
  instead of reopening Join. Live lobby and appointment entry filter the 15-minute join window
  (UX only; Nest remains authoritative).

## [0.80.0] - 2026-10-10

### Added

- FE-034: 429 `RATE_LIMITED` responses map to a typed web `RateLimitedError` with
  `details.retryAfterSeconds`. `/login` and the mock MFA form announce "Too many attempts. Try
  again in N seconds." (generic "Try again later." without retry seconds) in the existing alert.
- `/login?reason=rate_limited` banner, plus a mock-mode trigger (`rate.limited@example.test`) for
  demos and Playwright.

### Changed

- Breaking (redirect contract): a throttled `GET /auth/oauth/:provider/callback` now redirects to
  `/login?reason=rate_limited` (with `Retry-After`) instead of `/login?reason=oauth_failed`. A
  limiter-store outage still lands on `oauth_failed` (ADR-015 amendment).

### Fixed

- The web query client no longer retries 401, 403, or 429 responses. A rate-limited login or MFA
  attempt was being resent once automatically, spending extra rate-limit budget. Handled 429s are
  no longer logged as mutation errors.

## [0.79.1] - 2026-10-10

### Security

- API security headers on every response (BE-020, ADR-015): `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, `Content-Security-Policy:
  frame-ancestors 'none'`, and HSTS when `APP_ENV` is not `local`.
- `Cache-Control: no-store` on every `/auth/*` response (including OAuth) and on
  `POST /telehealth/sessions/:id/media-token`.

## [0.79.0] - 2026-10-10

### Added

- BE-019: ADR-015 rate-limit policies. `POST /auth/login` (5 per 15 min per IP + normalized email,
  20 per 15 min per IP), `POST /auth/mfa/verify` (5 per 10 min per MFA session + IP),
  `POST /auth/refresh` (30 per 5 min per IP), and OAuth start, callback, and Fake authorize (20 per
  5 min per IP) fail closed. `POST /telehealth/sessions/:id/media-token`,
  `GET /patients/:id/documents/:documentId/content`, and `POST /billing/payments` limit per session
  user and fail open.
- Account-wide login failure limit (ADR-015 amendment): 10 failed attempts per 15 min per
  normalized email from any IP, checked before credentials so it holds across real IP rotation.
  Unknown emails count the same way (no enumeration), successes do not count, and it fails
  closed. `RateLimitStore.peek` reads a bucket without counting.
- `auth.rate_limited` security event (resource `session`, no email, IP, token, or key hash),
  written once per key per window and only when the request resolves to a known practice user.
- OpenAPI documents 429 (and 503 on fail-closed routes) on every policy route; the contract check
  asserts it.

### Changed

- A throttled `GET /auth/oauth/:provider/callback` redirects to `/login?reason=oauth_failed` with
  `Retry-After` instead of returning JSON.
- `RateLimitGuard` is now request-scoped so it runs after the request-scoped `AuthGuard`;
  session-user keys did not resolve before.

## [0.78.0] - 2026-10-10

### Added

- BE-018: opt-in rate-limit platform (ADR-015). `RateLimitStore` port with the PostgreSQL bucket
  store as default and an in-memory store for tests; global `RateLimitGuard` with
  `@RateLimit(...policies)`; HMAC-SHA-256 bucket keys so raw IPs, emails, and tokens are never
  stored or logged. No route policies yet (BE-019).
- HTTP 429 `RATE_LIMITED` with `details.retryAfterSeconds` and a `Retry-After` header; HTTP 503
  `RATE_LIMIT_UNAVAILABLE` when a fail-closed policy cannot reach the store. Fail-open policies log
  only the policy name and correlation ID.
- `TRUST_PROXY` (integer hop count, default `0`) sets Express `trust proxy`; client IP comes from
  `req.ip` only. Invalid values fail env validation at boot.
- `RATE_LIMIT_KEY_SECRET` (min 32 characters), required when `APP_ENV` is preview or production.
- OpenAPI `RateLimitedErrorEnvelope` schema and an `ApiRateLimited` response helper.

### Changed

- Error envelope `details` may be an object for code-specific data; validation errors keep the
  `[{path, message}]` array.

## [0.77.1] - 2026-10-10

### Added

- DATA-004: PostgreSQL `rate_limit_buckets` table (policy, HMAC key hash, window start, count,
  expiry) with a hex-only key check, an `expires_at` index, and DML-only grants for the runtime
  role. No tenant data and no RLS (ADR-015).
- `RateLimitBucketRepository.increment` performs one atomic upsert per hit and returns
  `{count, resetAt}`; expired rows are pruned in bounded batches on increment.
- Persistence spec covering concurrent increments, window reset, pruning, hash-only storage, and
  grants.

## [0.77.0] - 2026-10-09

### Added

- FE-033: "Continue with Google" / Fake provider button on live `/login` that starts the Nest
  demo OIDC + PKCE flow, with a redirecting state and a labeled unavailable state in mock mode.
- `/login/oauth/complete` hydrates the client session from `GET /auth/session` and returns to an
  allowlisted `/dashboard` path, or to `/login?reason=oauth_failed` on failure.
- Accessible `/login?reason=` banners for `oauth_failed`, `unauthorized`, and `signed_out`.
- Live Playwright spec for the Fake-adapter round-trip and the failure path.

### Changed

- Live `getCurrentSession` recovers an empty client store from `GET /auth/session` (cookies
  still valid after reload) instead of returning 401.
- `identity-access.oauth-oidc-pkce` is shipped with a qualified public claim: "Demo OIDC + PKCE
  (Google or Fake). Not a production IdP." M14 is shipped.

## [0.76.0] - 2026-10-09

### Added

- Demo OIDC Authorization Code + PKCE on Nest (BE-017): `GET /auth/oauth/:provider/start` and
  `/callback` for Google (`openid-client`, when configured) and a Fake adapter (`APP_ENV=local`
  only). The callback validates one-time state, PKCE S256, `nonce`, `iss`, `aud`, `exp`, and
  `email_verified`. It maps to pre-provisioned users per ADR-014 (no JIT signup, no merge on
  mismatch) and issues the same HttpOnly session as password login, with role and practice taken
  from memberships only. `returnTo` is limited to `/dashboard` paths. Any failure redirects to
  `/login?reason=oauth_failed` with no provider detail, and provider tokens are discarded.
- `GET /auth/session` (cookie or Bearer) returns the server-resolved `userId`, `email`, `role`,
  `practiceId`, and `expiresIn`.
- Audit actions `auth.oauth.succeeded|failed|linked|identity_mismatch` (visible in security events).
- Optional `OIDC_*` env keys. Hosted OAuth without config answers 503 `OAUTH_UNAVAILABLE`.
  `OIDC_DEMO_EMAIL` provisions a local demo user via `seed:mock-identity`.
- No login UI yet (FE-033). Not production OAuth or HIPAA identity.

## [0.75.1] - 2026-10-09

### Added

- External identity persistence for M14 OIDC (DATA-003): `external_identities` (unique
  `(provider, subject)` and `(user_id, provider)`) and one-time `oauth_flow_states` (state stored
  only as a hash, atomic consume, expired rows pruned on create). Identity-resolution tables with
  no RLS; runtime role `medconnect_app` has DML grants. No HTTP routes or UI yet (BE-017, FE-033).

## [0.75.0] - 2026-10-08

### Added

- Claims envelope list on Nest `GET /billing/claims` (FE-032): billing dashboard and invoice
  detail show labeled `not_submitted` / `edi837` envelopes derived from visible invoices. Not
  claim submission, X12, or denial workflow. Catalog `billing.claims` is shipped as qualified.
  Hosted Stripe/ACH and EDI 837 remain planned. Module stays partial.

## [0.74.0] - 2026-10-08

### Added

- Record demo payment on the Nest in-process adapter (FE-031): practice admins and receptionists
  can record `stripe` or `ach` against an unpaid invoice through existing `POST /billing/payments`.
  No card or bank fields. Providers stay read-only. Catalog `billing.payments` is shipped as
  qualified — not hosted Stripe or ACH origination. Claims envelopes remain FE-032.

## [0.73.0] - 2026-10-08

### Added

- Daily call-object media in the telehealth session shell (FE-030): after Nest join, live mode
  mints `POST /telehealth/sessions/:id/media-token` and joins `@daily-co/daily-js` (not Prebuilt).
  Camera, microphone, and screen share control Daily. Presence waiting until a remote participant.
  Unset `DAILY_API_KEY` (Fake adapter `unconfigured.invalid`) is labeled unavailable so CI needs
  no Daily credentials. Mock mode keeps placeholders. Catalog `telehealth.live-media` and
  `telehealth.waiting-room` are shipped as qualified — not production telehealth or HIPAA video.
  Chat and recording remain planned.

## [0.72.0] - 2026-10-07

### Added

- Telehealth Daily media token HTTP (BE-016): `POST /telehealth/sessions/:id/media-token` mints a
  short-lived Daily meeting token after the same visit-participant authorization as join. Nest
  holds `DAILY_API_KEY`; unset key uses a Fake adapter so CI needs no Daily credentials. Session
  rows persist only an opaque room name. ADR-013 records Daily custom call object (not Prebuilt,
  not Socket.IO media). Live camera UI remains FE-030; public copy still must not claim live video.

## [0.71.0] - 2026-10-07

### Added

- Security-events UI (FE-029): `/dashboard/admin` shows a distinct Security events viewer for
  Nest `GET /admin/security-events` (tenant-scoped `auth.*` rows). Mock fixture keeps mock mode
  demonstrable. Catalog `administration.security-events-http` is shipped as qualified — not a
  SIEM, HIPAA audit export, or session-policy editor.

## [0.70.0] - 2026-10-07

### Added

- Security-events HTTP (BE-015): `GET /admin/security-events` lists tenant-scoped `auth.*` rows
  for `admin:practice`. Known-user failed logins emit `auth.login.failed`; unknown emails do not
  confirm existence. Reuses `audit_events` (no new table or permission). The administration viewer
  remains FE-029.

## [0.69.0] - 2026-10-07

### Added

- Mock MFA challenge UI (FE-028): live `/login` shows a labeled mock MFA step when Nest returns
  `mfaRequired`, submits `POST /auth/mfa/verify`, and establishes the cookie session. Harbor seed
  now includes a NURSE membership for `mfa.nurse@example.test`. Catalog
  `identity-access.mfa-challenge` is shipped as qualified mock MFA, not production TOTP or WebAuthn.
  Non-MFA demo users remain one-step login.

## [0.68.0] - 2026-10-06

### Changed

- Live cookie session client (FE-027): Next.js live API calls send `credentials: 'include'` and
  stop storing Nest access/refresh tokens in web storage. Mock mode still uses `localStorage`.
  Logout ends the Nest cookie session; concurrent-session terminate chrome calls `POST /auth/logout-all`.
  Unused Next `/api/auth/*` 501 stubs removed. JSON bearer pairs remain for machine clients.

## [0.67.0] - 2026-10-06

### Added

- HttpOnly cookie session HTTP (BE-014): Nest issues `mcp_access` / `mcp_refresh` (and `mcp_mfa`
  on challenge) on mock IdP login, refresh, and MFA verify, and clears them on logout / logout-all.
  `AuthGuard` accepts the session cookie or `Authorization: Bearer`. CORS allows credentialed
  requests from the existing web origin allowlist. Hosted `SameSite=None` cookie-auth mutations
  require `X-CSRF-Token`. JSON token pairs remain for machine clients. Not production OAuth or a
  Next identity BFF. Live Next storage cutover remains FE-027.

## [0.66.2] - 2026-10-06

### Fixed

- Platform overview hero and metadata describe live dashboard overview cards instead of mock
  analytics cards, matching the shipped Nest overview API.
- README, the GitHub `1.0.0` release-notes template, and the project spec now match shipped M10
  (in-app notification inbox, role assignment, GitHub Actions quality gates).

## [0.66.1] - 2026-10-06

### Fixed

- Mock administration audit events now use a unique id per role change so changing the same
  membership twice no longer collides React list keys in the audit viewer.

## [0.66.0] - 2026-10-06

### Added

- Role assignment UI (FE-026): practice admins change a membership role from the existing
  `/dashboard/admin` user list against Nest `PATCH /admin/users/:id/roles`. Mock mode mutates
  the in-memory directory with the same last-admin and SUPER_ADMIN grant limits. Nest remains
  authoritative; omitting SUPER_ADMIN from the select is UX only. Security-events HTTP remains
  M11. Synthetic demo data only; never real PHI.

## [0.65.0] - 2026-10-05

### Added

- Role assignment HTTP (BE-013): `PATCH /admin/users/:id/roles` updates the session-practice
  membership and returns the practice-user RDO. Requires `admin:users`. PRACTICE_ADMIN cannot
  grant SUPER_ADMIN. The last PRACTICE_ADMIN of the practice cannot be removed. Unknown and
  cross-tenant ids return the same not-found response. Successful changes audit
  `membership.role_changed` without passwords, MFA secrets, or session hashes. Assignment UI
  remains FE-026. Synthetic demo data only; never real PHI.

## [0.64.0] - 2026-10-05

### Added

- In-app notification center (FE-025): dashboard Bell opens a self-scoped inbox from Nest
  `GET /notifications`, mark-read, and channel preferences. Desktop uses a header popover;
  below `lg` uses a full-screen dialog. Not push, SMS, or email carriers. Synthetic demo data
  only; never real PHI.

## [0.63.0] - 2026-10-05

### Added

- Appointment notification producers (BE-012): creating, cancelling, or deleting an appointment
  enqueues `appointment_changed` in-app (and preference-enabled email/SMS) rows for the assigned
  provider and, when linked, the patient’s portal user. `NotificationService.enqueue` audits
  `notification.enqueued` without title or body. No client `POST /notifications`, Redis, SNS, or
  SQS. Notification-center UI remains FE-025. Synthetic demo data only; never real PHI.

## [0.62.0] - 2026-10-05

### Added

- Live dashboard overview cards (FE-024): with mocks off, `/dashboard` loads Nest
  `GET /dashboard/overview` using the BE-009 bearer session. Leftover Next.js cookie BFF
  `/api/dashboard/overview` is removed. Mock fixtures and role filter stay for
  `NEXT_PUBLIC_USE_MOCKS=true`. Live payload omits `patient_satisfaction`. Synthetic demo data
  only; never real PHI.

## [0.61.0] - 2026-10-05

### Added

- Dashboard overview API (BE-011): authenticated `GET /dashboard/overview` returns role-filtered
  synthetic aggregates from the session tenant (patient count, UTC-today appointments, current
  UTC-month invoice totals; PATIENT upcoming visits and open balance). Omits
  `patient_satisfaction` and marketing census figures. Live dashboard UI wiring remains FE-024.
  Synthetic demo data only; never real PHI.

## [0.60.0] - 2026-10-04

### Added

- Bounded Harbor synthetic seed (DATA-002): `npm run seed:mock-identity` upserts ≥20 patients,
  ≥8 appointments (including two on the seed UTC day), ≥4 current-month invoices, and in-app
  inbox rows for the practice admin (3) and provider (2). Re-seed is idempotent by email, notes,
  line-item description, and inbox title. Avery/Blake loginable accounts stay. Live dashboard
  and notification-center capabilities remain planned until BE-011 / FE-025. Synthetic demo
  data only; never real PHI.

## [0.59.0] - 2026-10-04

### Added

- Production delivery and rollback (INFRA-011): after quality CI on `main`, GitHub Actions
  migrates via an in-VPC ECS `RunTask` and rolls preview then production Fargate services
  (`.github/workflows/production-deploy.yml`). Production ECS waits on the GitHub `production`
  environment. Amplify Git remains the only web publisher. Rollback is the previous task
  definition (migration revert only with explicit dispatch). Live Terraform apply and the
  GitHub environment remain operator steps. Synthetic demo data only; never real PHI.

## [0.58.0] - 2026-10-04

### Added

- Amplify PR preview delivery (INFRA-010): `amplify.yml` writes public frontend env into
  `apps/web/.env.production` and fails closed if required URLs are missing; quality CI posts
  the advertised preview URL only after `ci` succeeds (`.github/workflows/preview-status.yml`).
  Operator runbook enables Amplify-native PR previews against the shared preview API/RDS
  (all-branch env = `preview_api_url`, `main` override = `production_api_url`). Feature branches
  cannot publish production Amplify. Live console enablement remains an operator step. ECS
  rolling deploy remains INFRA-011. Synthetic demo data only; never real PHI.

## [0.57.0] - 2026-10-04

### Added

- AWS Amplify Hosting for Next.js (INFRA-009): root `amplify.yml` (npm workspace install from
  `/`, SSR artifacts `apps/web/.next`, Node 24, `npm run build:production`), quality-CI
  buildspec tests, and an operator runbook to Git-connect `main`, inject production API URLs,
  and set exact `production_web_origins`. Amplify Git owns production web publish. Live
  console connect remains an operator step. PR previews and ECS rolling deploy remain
  INFRA-010–INFRA-011. Synthetic demo data only; never real PHI.

## [0.56.0] - 2026-10-03

### Added

- NestJS API container and ECS/Fargate hosting (INFRA-008): `apps/api/Dockerfile`, preview and
  production Fargate services behind CloudFront HTTPS, Secrets Manager task injection,
  `WEB_ORIGIN`/`WEB_ORIGINS` CORS parser, and S3 document storage for hosted environments.
  Quality CI builds the image; `main` pushes to ECR. Live `terraform apply` remains an operator
  step. Amplify and ECS rolling deploy remain INFRA-009–INFRA-011. Synthetic demo data only;
  never real PHI.

## [0.55.0] - 2026-10-03

### Added

- Preview/demo and production/demo RDS PostgreSQL 18 in private subnets (INFRA-007): Terraform
  VPC, SSM bastion for migrate/seed, generated non-Compose `DATABASE_*` URLs in
  `medconnect/preview/api` and `medconnect/production/api`, encrypted remote state, and an
  operator runbook ([docs/workflows/deploy.md](docs/workflows/deploy.md)). Synthetic seed only;
  never real PHI. ECS API hosting remains INFRA-008.

### Changed

- Hosted Nest boot also rejects identical runtime/owner URLs and a runtime username other than
  `medconnect_app`.

## [0.54.0] - 2026-10-03

### Added

- Secrets classification and AWS secret retrieval (INFRA-006): distinct Secrets Manager names
  `medconnect/preview/api` and `medconnect/production/api`, GitHub OIDC IAM roles in
  [infra/terraform/](infra/terraform/), a committed-secret CI guard
  (`npm run ci:secrets`), and a short rotation runbook
  ([docs/workflows/deploy.md](docs/workflows/deploy.md)). Amplify / `NEXT_PUBLIC_*` remains
  public configuration only. The API image is still INFRA-008; the contract forbids secret
  `ENV` / `ARG`.

### Changed

- Environment catalog
  ([docs/contracts/environment-configuration.md](docs/contracts/environment-configuration.md))
  now documents hosted retrieval (ECS injection, no Nest AWS SDK, Parameter Store unused).

## [0.53.0] - 2026-10-03

### Added

- GitHub Actions CI quality gates (INFRA-005): [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
  runs lint, type-check, Vitest, production web build, API build, and `npm audit --omit=dev` on
  pull requests and `main`, with PostgreSQL 18 for API tests. No deploy jobs.

### Changed

- Local Compose Postgres from 16 to 18 (`postgres:18-alpine`), matching CI.
- Web lint toolchain so the quality gate can run: TypeScript 6.0.3, ESLint 9, Next.js 16.3.8
  (also addresses `next/og` ImageResponse), and native `eslint-config-next` flat config.

## [0.52.0] - 2026-10-03

### Added

- Environment separation contract (INFRA-004): [ADR-012](docs/decisions/ADR-012-deployment-topology.md)
  locks Amplify + ECS Fargate with `local` / `preview` / `production`, a runtime variable catalog,
  hosted `.env.preview.example` / `.env.production.example` placeholders, and Nest fail-closed
  boot when `APP_ENV` is hosted and `DATABASE_*` URLs are missing or still point at Compose.

### Changed

- Architecture environment names from development / staging / production to local / preview /
  production. CORS origin-list parsing and AWS provisioning remain later M9 tasks.

## [0.51.1] - 2026-10-02

### Changed

- Marketing chrome polish: footer nav marks the current route with `text-brand` and
  `aria-current="page"` (Sign in stays brand), Demo sign-in crop is capped at 540px, hero CTAs
  stack full-width on mobile and sit in a row from `sm` (matching Home), and Product UI slider
  controls sit on the section heading row.

## [0.51.0] - 2026-10-01

### Added

- Marketing product visuals (FE-023): a six-slide Product UI slider on Home (two slides on
  desktop/tablet, one on mobile, with a peek of the next screen), captured synthetic module
  screens on the six feature walkthroughs, a captured mock login on Demo, and shared Open Graph /
  Twitter metadata from the Dashboard crop. Copy keeps the synthetic-demo disclaimer and does not
  claim HIPAA certification or hosted production.

## [0.50.0] - 2026-09-30

### Added

- Security, About, and Demo marketing pages (FE-022) replacing the remaining FE-017 placeholders.
  Copy follows the capability matrix: implemented controls (mock identity, RBAC, tenant isolation,
  audit, RLS, document ACL), portfolio/architecture context, and demo entry through existing
  `/login`. Login-chrome visuals stay a labeled placeholder until FE-023. Optional login form
  token mapping only; mock IdP behavior is unchanged.

## [0.49.0] - 2026-09-30

### Added

- Platform feature pages (FE-021) at `/platform/patient-management`, `/platform/appointments`,
  `/platform/telehealth`, `/platform/billing`, `/platform/analytics`, and
  `/platform/administration`. Shared `FeaturePageLayout` with Figma-approved, capability-matrix
  copy, labeled walkthrough placeholders until FE-023, and related-module links. CTAs use `/demo`
  and `/platform`; sign-in remains `/login`.

## [0.48.0] - 2026-09-30

### Added

- Platform overview at `/platform` (FE-020): designed feature map with honest module status and
  sitemap links to `/platform/*` (pages may 404 until FE-021). Shared `FeaturePageLayout`
  primitives for upcoming feature pages. Copy follows the capability matrix.

## [0.47.0] - 2026-09-29

### Added

- Marketing homepage at `/` (FE-019): hero, practice modules, connected workflow, labeled product
  UI placeholder, UX and security principles, intended roles, and demo CTAs to `/platform` and
  `/demo`. Copy follows the capability matrix. Product screenshots remain placeholders until FE-023.

## [0.46.0] - 2026-09-29

### Added

- Shared design tokens mapped from the approved Figma library (FE-018): CSS variables and
  Tailwind `@theme` aliases for color, type, radius, shadow, and the 4px spacing grid. Inter is
  `--font-sans`. `Button`, `Card`, and `Input` (and marketing chrome) consume the tokens. The
  dashboard layout was not restyled.

## [0.45.0] - 2026-09-28

### Added

- Public marketing website foundation (FE-017): `(marketing)` route group with shared header,
  footer, and accessible mobile navigation, isolated from the dashboard shell and auth gate.
  Placeholder pages at `/`, `/platform`, `/security`, `/about`, and `/demo`. `/demo` links to the
  existing mock login at `/login`. Per-page document title and description. Copy describes the
  portfolio demo only (not HIPAA certification, production OAuth, live video, or hosted payments).

## [0.44.0] - 2026-09-27

### Added

- Administration UI calls Nest admin APIs when mocks are off (FE-016): user list (`GET /admin/users`)
  and audit viewer (`GET /admin/audit-events`) with the bearer from `POST /auth/login`.
  `npm run seed:mock-identity` already inserts a loginable `practice.admin@example.test` and
  provider `jordan.ellis@synthetic.example`. `npm run e2e:live` covers seeded emails plus
  `auth.login.succeeded`; `npm run e2e` stays on mocks. Roles remain presentation only; role
  assignment and security-events stay unwired.

## [0.43.0] - 2026-09-27

### Added

- Practice user directory HTTP (BE-010): tenant-scoped `GET /admin/users` joins `practice_memberships`
  and `users` for the session practice. Requires `admin:users`. `id` is the user id; `synthetic` is
  always true. Client `practiceId` is rejected on mismatch. Identity tables remain without RLS;
  application scoping is mandatory. Frontend live wiring stays FE-016.

## [0.42.0] - 2026-09-27

### Added

- Notification domain (BE-008): tenant-scoped in-app inbox and channel preferences, demo email/SMS
  adapters, and an in-process delivery bus with three-attempt exponential backoff. SNS/SQS remains
  the target; there is no AWS SDK. Authenticated users read and update only their own rows. Frontend
  wiring stays out of scope.

## [0.41.1] - 2026-09-27

### Added

- Reusable authorization and tenant-isolation HTTP matrix (QA-004): role × resource × tenant cases
  for provider, nurse, receptionist, patient, and practice admin against shipped Nest surfaces,
  plus cross-tenant not-found and client `practiceId` rejection.

## [0.41.0] - 2026-09-27

### Added

- Document access control (SEC-004): tenant-scoped `patient_documents` metadata in PostgreSQL,
  multipart upload with PDF/PNG/JPEG magic-byte and 5 MiB validation, and authorized download at
  `GET /patients/:id/documents/:documentId/content`. Bytes stay in a local filesystem adapter with
  tenant-prefixed keys until S3 SSE-KMS exists. List, upload, and download write audit events
  without filenames or payloads. Live patient profile lists and downloads seeded documents; upload
  UI stays out of scope.

## [0.40.0] - 2026-09-27

### Added

- Tenant isolation at the PostgreSQL boundary (SEC-002): row-level security on tenant-owned tables,
  non-owner runtime role `medconnect_app`, and server-set `app.current_practice_id`. Nest
  `DATABASE_URL` must not use table owner `medconnect` or RLS is bypassed. Migrations and seed use
  `DATABASE_ADMIN_URL`. Cache keys and object-storage paths remain deferred until Redis/S3 exist.

## [0.39.0] - 2026-09-27

### Added

- Administration UI (FE-009): practice user/role list and synthetic audit viewer at `/dashboard/admin`. The Settings placeholder is replaced. Live mode rejects admin queries until a later Nest connect task. Nav visibility stays UX only; role assignment and permission management stay out of scope.

## [0.38.0] - 2026-09-27

### Added

- Billing dashboard calls the Nest billing API when mocks are off (FE-015): list and detail with the bearer from `POST /auth/login`. `npm run seed:mock-identity` already inserts Avery Quinn invoices and a loginable `practice.admin@example.test`. `npm run e2e:live` covers seeded list plus UUID detail; `npm run e2e` stays on mocks. Payment and claims remain labeled boundaries; Record payment stays disabled.

## [0.37.0] - 2026-09-26

### Added

- Billing API (BE-007): `GET`/`POST /billing/invoices`, `GET /billing/invoices/:id`, `POST /billing/payments`, and `GET /billing/claims`. Invoices and payments are tenant-scoped. Payments use an in-process Stripe/ACH adapter and never store card data. Claims are labeled EDI 837 envelopes, not generated X12. Nurse practice-revenue access is denied. Frontend live billing still 404s until a later connect task.

## [0.36.0] - 2026-09-26

### Added

- Billing dashboard (FE-008): invoice list at `/dashboard/billing` and detail at `/dashboard/billing/[invoiceId]` from synthetic fixtures. Payment (Stripe/ACH) and claims (EDI 837) are labeled UI boundaries and do not process payments. Live mode rejects billing queries until BE-007. Nav visibility stays UX only; nurse visit-context billing is out of scope.

## [0.35.0] - 2026-09-26

### Added

- Telehealth lobby and session shell call the Nest telehealth session API when mocks are off (FE-014): create, get, join, and end with the bearer from `POST /auth/login`. Live Join visit uses the server session UUID. `npm run seed:mock-identity` inserts a relative-to-now telehealth appointment for `jordan.ellis@synthetic.example`. `npm run e2e:live` covers lobby, join, media placeholders, and end; `npm run e2e` stays on mocks. Daily/WebRTC is not connected.

## [0.34.1] - 2026-09-26

### Fixed

- `npm run plane:sync` inserts a `plane:` block when a task file has none, then writes `work_item_id` and `identifier` after the Plane card is created.

## [0.34.0] - 2026-09-26

### Added

- Telehealth session API (BE-006): `POST /telehealth/sessions`, `GET /telehealth/sessions/:id`, `POST /telehealth/sessions/:id/join`, and `POST /telehealth/sessions/:id/end`. Sessions are appointment-linked, tenant-scoped application visits with waiting/in-session/ended state, 15-minute join grace, and mutation audit events without PHI. Daily/WebRTC is not part of this surface.

## [0.33.0] - 2026-09-26

### Added

- Appointment-linked telehealth session shell (FE-007): lobby at `/dashboard/telehealth`, waiting room and join/leave on `/dashboard/telehealth/[sessionId]`, and camera/microphone/screen-share placeholders. Mock sessions are derived from telehealth appointments. Live mode lists joinable visits from the appointment API; join/get/leave stay unavailable until BE-006. Daily is not connected. Copy labels the surface as a synthetic demo, not a production telehealth deployment.

## [0.32.0] - 2026-09-25

### Added

- Clinical lists on the patient profile call the Nest clinical API when mocks are off (FE-013): history, conditions, vitals, and medications with the bearer from `POST /auth/login`. Documents stay off that API. `npm run seed:mock-identity` inserts synthetic clinical rows and a loginable provider `jordan.ellis@synthetic.example`. `npm run e2e:live` checks the seeded provider profile lists; `npm run e2e` stays on mocks.

## [0.31.0] - 2026-09-25

### Added

- Restricted `GET /admin/audit-events` (SEC-003): practice-admin list of tenant-scoped audit rows (actor, action, resource ids, correlation; no emails, notes, or clinical text). Mock login, logout, MFA, refresh-token reuse, authenticated denials, and patient GET/create/update now write `audit_events` alongside existing appointment and clinical mutation events.

## [0.30.0] - 2026-09-25

### Added

- Clinical record API (BE-005): `GET`/`POST /patients/:id/history`, `/conditions`, `/vitals`, and `/medications`. Tenant-scoped TypeORM persistence, provider vs nurse permission checks, portal self-read, and mutation audit events without clinical payloads. FHIR alignment is conceptual only.

### Changed

- Human API index and data contracts document the bounded clinical mapping. Documents remain unimplemented. Shared `AuditModule` records appointment and clinical writes.

## [0.29.0] - 2026-09-25

### Changed

- Plane task sync sends GitHub-flavored Markdown as structured `description_html` (headings, lists, task items, quotes, code, tables) instead of escaped source text.

## [0.28.0] - 2026-09-24

### Added

- Appointment list, calendar, and create call the Nest appointment API when mocks are off (FE-012), using the bearer from `POST /auth/login`. Availability, PATCH, and DELETE stay off that API. `npm run seed:mock-identity` already inserts a synthetic visit for the live calendar. `npm run e2e:live` checks calendar plus create against the API; `npm run e2e` stays on mocks.

## [0.27.1] - 2026-09-24

### Added

- Appointment workflow tests (QA-003): after a mock create, the new visit appears on the calendar, and a nurse who opens create directly is denied. Existing conflict, calendar view, and Nest authorization checks stay in place. Browser appointment tests still use synthetic mocks.

## [0.27.0] - 2026-09-24

### Added

- Appointment API (BE-004): `GET`/`POST /appointments`, `GET`/`PATCH`/`DELETE /appointments/:id`, and
  `GET /providers/:id/availability`, with server-side provider conflict detection, tenant and role
  checks, and mutation audit events. Frontend appointment screens stay on mocks.

## [0.26.0] - 2026-09-24

### Added

- Appointment calendar on `/dashboard/appointments` (FE-006): day, week, and month views with
  appointment selection, tablet-oriented toolbar, and loading/error states. List and create stay
  available; the Nest appointment API stays out of scope.

## [0.25.0] - 2026-09-24

### Added

- Appointment creation on `/dashboard/appointments` (FE-005): mock list and schedule form (patient, provider, time, type, state), accessible validation, and provider overlap feedback. Calendar views and the Nest appointment API stay out of scope.

## [0.24.0] - 2026-09-23

### Added

- Patient list, profile, create, and edit call the Nest patient API when mocks are off (FE-011), using the bearer from `POST /auth/login`. History, vitals, medications, and documents stay off that API. `npm run seed:mock-identity` also inserts a synthetic provider and demo patients. `npm run e2e:live` checks list plus create against the API; `npm run e2e` stays on mocks.

## [0.23.1] - 2026-09-23

### Added

- Patient workflow tests (QA-002): a provider who opens create or edit URLs directly is denied in the mock UI, and a receptionist can read the patient they just created. Existing list, create, edit, and cross-tenant checks stay in place. Browser patient tests still use synthetic mocks.

## [0.23.0] - 2026-09-23

### Added

- Patient demographics API (`GET`/`POST /patients`, `GET`/`PATCH /patients/:id`) with Zod validation, tenant scope, role and assignment checks, and generated OpenAPI (BE-003).

## [0.22.0] - 2026-09-23

### Added

- Patient create and edit forms at `/dashboard/patients/new` and `/dashboard/patients/[patientId]/edit` (FE-004), with Zod validation, accessible field errors, and server error details. Entry points require the `write:demographics` grant in the demo session.

## [0.21.0] - 2026-09-23

### Added

- `npm run plane:sync` accepts task ids or `--changed`, so a run can update one completed task or only dirty and unlinked task files.

## [0.20.0] - 2026-09-23

### Added

- Patient profile at `/dashboard/patients/[patientId]` (FE-003), with demographics for staff who can read patients and history, vitals, medications, and documents gated by clinical permissions.

## [0.19.0] - 2026-09-22

### Added

- Searchable, filterable patient list on `/dashboard/patients` (FE-002), backed by the synthetic mock patient fixtures with status filter, last-name sort, load more, and loading, empty, and error states.

## [0.18.0] - 2026-09-22

### Added

- `npm run plane:sync` creates repository tasks as Plane work items in Backlog and updates title, description, and priority on later runs without moving cards.

## [0.17.0] - 2026-09-22

### Added

- NestJS mock identity HTTP (`POST /auth/login`, refresh, logout, logout-all, and MFA verify) with
  opaque bearer sessions resolved from practice memberships.

### Changed

- OpenAPI Bearer auth describes those opaque mock access tokens. Logout requires a bearer token.
  Health and readiness stay unauthenticated.

## [0.16.0] - 2026-09-22

### Added

- Mock identity login/logout and a dashboard session gate (FE-010), with synthetic demo credentials.
- Milestone task crosswalk on the release roadmap; FE-010 and BE-009 task specs.

### Changed

- Leftover v0 MFA/register/password-reset theater is parked as out-of-milestone stubs.
- Session chrome is limited to the authenticated dashboard tree.

## [0.15.0] - 2026-09-21

### Added

- PostgreSQL tenant model (TypeORM migrations, Practice and tenant-owned tables, server-side tenant
  scope) and a database-backed `GET /ready` probe.

## [0.14.0] - 2026-09-21

### Added

- Generated OpenAPI artifact (`apps/api/openapi/openapi.json`) from NestJS Swagger 12, served at
  `/api/docs-json`, with optional Swagger UI at `/api/docs` (`SWAGGER_UI_ENABLED`).

## [0.13.0] - 2026-09-21

### Added

- NestJS 12 API workspace (`apps/api`) with global Zod validation, a consistent error envelope,
  `X-Correlation-ID`, structured request logging, and unauthenticated `/health` and `/ready`
  endpoints on port 3001.

## [0.12.2] - 2026-09-21

### Added

- Identity and access contract (roles, permission catalog, tenant resolution, resource
  authorization, session rules) and a matching frontend permission catalog for mock sessions.

### Changed

- Mock PRACTICE_ADMIN session permissions now use the canonical `action:resource` catalog instead of
  generic `read`/`admin` strings.

## [0.12.1] - 2026-09-20

### Changed

- Local development conventions: mock-first `apps/web/.env.example`, gitignored local env files,
  Node 24 `engines` / `.nvmrc`, and a cross-platform `npm run reset`.

## [0.12.0] - 2026-09-20

### Added

- npm workspaces monorepo layout with the Next.js app in `apps/web`, reserved `apps/api` and
  `packages/` directories, and ADR-009.

### Changed

- Root `package.json` is workspace-only; frontend dependencies and Next.js tooling live in
  `apps/web`. Root scripts delegate to the web workspace.
- Canonical documentation and Cursor rules stay at the repository root; frontend rule globs target
  `apps/web`.

## [0.11.0] - 2026-09-20

### Added

- Vitest + React Testing Library for unit and component tests, with Playwright Chromium E2E for dashboard navigation.
- Frontend testing conventions (ADR-008) and a dashboard-shell E2E flow.

### Changed

- Replaced Jest with Vitest as the frontend unit/component runner. Playwright is now an installed, configured E2E dependency.
- Mock concurrent-session list defaults to the current session so dashboard E2E is not blocked by the security dialog.

## [0.10.0] - 2026-09-17

### Added

- Authenticated dashboard shell with responsive, accessible navigation and route-level loading/error UI.
- Role-aware menu presentation (UX only) and isolated synthetic dashboard overview metrics.

## [0.9.2] - 2026-09-16

### Changed

- Replaced remaining Heroicons usage with Lucide equivalents and removed `@heroicons/react`.

## [0.9.1] - 2026-09-16

### Fixed

- Load `scripts/plane/.env` in the Plane sync client so `npm run plane:sync:dry` sees configured workspace variables.

## [0.9.0] - 2026-09-16

### Added

- Baseline for recorded application versions. Prior work is not reconstructed as fake history.
