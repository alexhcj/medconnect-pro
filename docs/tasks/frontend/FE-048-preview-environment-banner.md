---
id: FE-048
type: task
area: frontend
feature: deployment
status: implemented
priority: low
estimate: 1
dependencies: [INFRA-019]
related_adrs: [ADR-011-figma-canonical-visual-source.md]
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../contracts/environment-configuration.md,
    ../../workflows/delivery-lanes.md,
  ]
design:
  required: true
  tool: figma
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd"
  frame: "FE-048 Preview banner (page 274:2; component set PreviewBanner 274:59)"
  status: approved
implementation:
  status: complete
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: 0556f581-ed3f-4b5e-8aef-d534769abb7e
  identifier: MEDCONNECT-134
---

# FE-048 — Preview environment banner

## Objective

Label PR previews of the application and marketing site so a reviewer never mistakes mock data
for the interviewer demo.

## Context

ADR-019 builds web previews on mock data. The login page and dashboard look the same as the demo,
so a reviewer can draw wrong conclusions about live behaviour.

## Scope

- A thin, non-dismissable banner. Approved copy: web "PR preview · mock data · not the live
  demo"; marketing "PR preview · not the live demo" (marketing previews have no mock data).
  Amber warning tokens, decorative Info icon, centred, in normal flow above the header.
- Shown only when a provider-neutral build variable is set (for example
  `NEXT_PUBLIC_DEPLOY_CONTEXT=pr-preview`, set by INFRA-019's preview build). Absent everywhere
  else, including the demo and local dev.
- Both `apps/web` (all routes, above the app shell and login) and `apps/marketing`.
- Marketing previews do not get the variable today (INFRA-019 sets it for web only). Add a
  marketing preview build step that sets `NEXT_PUBLIC_DEPLOY_CONTEXT=pr-preview` when
  `IS_PULL_REQUEST=true` (`render.yaml`, `scripts/infra/`), with a spec test, and add the
  marketing row to `environment-configuration.md`.
- Add the variable to `environment-configuration.md` and the `.env.*.example` files.

## Out of Scope

- Showing the PR number or commit
- Any change to mock data or the demo account panel

## Requirements

- Design tokens only; text contrast at least 4.5:1; does not cover the header or trap focus; on
  320 px it wraps and does not cause horizontal scroll.
- Rendered as a landmark-free `role="status"` or plain text, not an alert.

## Acceptance criteria

- [x] With the variable set, the banner shows on `/login`, a dashboard route, and marketing `/`
- [x] Without it, no banner and no extra DOM on any route
- [x] Vitest covers both states in each app
- [x] Contrast and 320 px checks recorded in Completion

## Dependencies

- Blocked by: INFRA-019 (sets the variable), design approval in the shared Figma file
- Figma: https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=274-2 (approved; page
  "FE-048 Preview banner", component set `PreviewBanner`)

## Validation

Run each app with and without the variable. Check the INFRA-019 preview after merge.

## Risks / considerations

- Optional for the milestone. If cut, rely on the PR comment (INFRA-020) to say "mock data".

## Implementation notes

New visible UI on previews only: PATCH bump.

## Completion

- Implementation: `apps/web/src/components/ui/preview-banner.tsx` and `src/lib/deploy-context.ts`
  (banner in the root layout; `--preview-banner-h` on `<html>` offsets the fixed dashboard
  sidebar in `components/dashboard/sidebar.tsx`); `apps/marketing/src/components/marketing/preview-banner.tsx`
  and `src/lib/marketing/deploy-context.ts` (root layout); `scripts/infra/render-marketing.mjs`
  with the `render.yaml` build command and `buildFilter`; contract row and `.env.*.example`
  notes. Version 0.97.2.
- Tests: Vitest `preview-banner.test.tsx` in each app (set, unset, other value; no DOM when off);
  `render-marketing.spec.mjs` and a marketing Blueprint guard in `render-previews.spec.mjs` via
  `npm run test:render-previews` (21 tests). `test:web` 556 passed, `test:marketing` passed;
  lint and type-check clean for both apps (existing lint warnings only).
- Contrast: `#78350f` on `#fffbeb` is 8.75:1 (computed from token values; rendered colours
  `rgb(120, 53, 15)` on `rgb(255, 251, 235)` confirmed in the browser).
- 320 px: web `/login` wraps to two lines (57 px) and marketing `/` stays one line (37 px); no
  horizontal scroll in either (`scrollWidth` 320). The banner is not focusable and has no controls.
- Browser checks (local dev, banner env on, then off): web `/login` at 320 px, signed-in
  `/dashboard` at 1024 px, and marketing `/` at 320 px show the banner; with the variable unset no
  banner or text appears in either app. Not yet checked: a real Render preview.
- PR:
- Notes: Deviation from the Figma frames: on web the banner is `sticky top-0 z-50` (not plain
  flow) and the dashboard sidebar starts below it, because the fixed `lg` sidebar covered the left
  256 px of the banner and client navigation scrolled it out of view. Marketing stays in plain
  flow (its header is not fixed). The Figma frames still show plain flow; update them if you want
  them to match. The first labelled PR preview must confirm Render exposes `IS_PULL_REQUEST` at
  static-site build time (INFRA-019 only verified the web service); if it does not, marketing
  previews show no banner.
