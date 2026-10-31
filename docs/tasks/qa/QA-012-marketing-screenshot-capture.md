---
id: QA-012
type: task
area: qa
feature: marketing
status: implemented
priority: high
estimate: 2
dependencies: [FE-023, INFRA-017]
related_adrs: [ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../processes/prompts/milestone-close-prompt.md,
    ../../workflows/design-requirements.md,
    ../frontend/FE-023-marketing-polish-and-product-visuals.md,
    ../infrastructure/INFRA-017-demo-presentation-pack.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: e1b6e238-ee0e-4469-b937-057b9363fd11
  identifier: MEDCONNECT-141
---

# QA-012 — Repeatable marketing screenshot capture

## Objective

One command regenerates every marketing and README screenshot from the current app state, with no
TanStack Query or Next.js devtools icons in any image.

## Context

The screenshots in `apps/marketing/public/marketing/` were captured by hand (INFRA-017). Under
`next dev`, `apps/web` renders `ReactQueryDevtools` and the Next dev indicator, so manual captures
pick up both icons, as FE-023 warned. M21 needs fresh images for the homepage hero and slider. The
milestone-close prompt has a screenshot-refresh step but no tool for it.

## Scope

- A Playwright capture spec in `apps/web/e2e/capture/` with its own `playwright.capture.config.ts`.
  Its `webServer` runs the existing `build:mocks` and `start:mocks` scripts (production build, mock
  data). The normal `e2e:mocks` run does not include it.
- Root script `npm run screenshots:marketing`.
- Output to `apps/marketing/public/marketing/`:
  - `login.png` at 1440×1200;
  - `dashboard`, `patients`, `appointments`, `telehealth`, `billing` and `admin` at 1440×900;
  - `og.png` at 1200×630, cropped from the dashboard.
- Where a screen needs it, the spec signs in through the mock flow with the right role. It waits
  for network idle and loaded fonts, and disables animations.
- One refresh of all images. Update the README embeds, the `marketing-product-visuals.ts` alt text
  if a screen changed, and the related marketing tests.
- The milestone-close prompt's "Screenshot refresh" points at the script.

## Out of Scope

- Visual regression or pixel diffing.
- Figma image fills (FE-052 and FE-053 update them when their frames change).
- Live-mode captures.

## Requirements

- Before each capture, assert that `.tsqd-parent-container` and `nextjs-portal` are absent.
- Synthetic data only. No real names, emails or tokens in any image.
- Fixed viewport, device scale factor 1, light colour scheme.
- No new dependency (Playwright is already installed).

## Acceptance Criteria

- [x] `npm run screenshots:marketing` writes all 8 images at the stated sizes.
- [x] No image shows the TanStack or Next.js devtools icon (asserted in the spec and checked by eye).
- [x] The images show the current app UI: the FE-050 logo link appears on `login.png`. The FE-049
      status indicator does not appear, because it is hidden in mock mode by design.
- [x] `npm run e2e:mocks` does not run the capture spec.
- [x] The milestone-close prompt documents the command.

## Dependencies

- Related: FE-023, INFRA-017. Blocks: FE-052 (hero and slider images).

## Validation

Run the script and open every PNG. Then run `npm run test:marketing` and `npm run lint:web`.

## Risks / considerations

- `build:mocks` takes a few minutes, so the script is for occasional use, not CI.
- Next.js in this repo is newer than training data. Check `node_modules/next/dist/docs/` for how
  the dev indicator behaves in production builds.

## Completion

- Implementation: `apps/web/playwright.capture.config.ts` runs `build:mocks` then `start:mocks`
  on port 3100 with `reuseExistingServer: false`, so it can never attach to a dev server. It sets
  mock delay 0, error rate 0, `NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=true` and
  `NEXT_PUBLIC_MARKETING_URL` at build time. `apps/web/e2e/capture/marketing-screenshots.spec.ts`
  captures `login` at 1440×1200, then signs in once as practice admin (every screen allows it) and
  captures six screens at 1440×900 plus the `og` 1200×630 top-left dashboard crop. Before each
  shot it waits for network idle and `document.fonts.ready`, and asserts that
  `.tsqd-parent-container` and `nextjs-portal` are absent. `playwright.config.ts` ignores
  `**/capture/**`. Scripts: root and `medconnect-web` `screenshots:marketing`. Docs:
  milestone-close prompt "Screenshot refresh" step 2 and `frontend-testing.md` E2E.
  Version 0.99.1 -> 0.99.2.
- Refresh (2026-10-28): all 8 PNGs were rewritten. `dashboard`, `patients`, `admin` and `og`
  came out byte-identical. `login` (FE-050 logo header), `appointments` (no "today" highlight
  outside the mock anchor week), `billing` and `telehealth` changed slightly. Alt text, README
  embeds and marketing tests needed no change.
- Deviations: AC3 was amended before implementation. The FE-049 indicator is hidden in mock mode,
  and live captures are out of scope.
- Notes: Figma proof frames and `designs/marketing/*.pen` were not regenerated (ADR-011). FE-052
  owns hero and slider images. The appointments calendar opens on the mock anchor week
  (Oct 11–17, 2026) with an empty morning view, which FE-052 may want to change.
