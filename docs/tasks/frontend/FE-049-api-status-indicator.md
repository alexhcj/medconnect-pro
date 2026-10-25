---
id: FE-049
type: task
area: frontend
feature: auth
status: pending
priority: medium
estimate: 5
dependencies: [INFRA-015, INFRA-016]
related_adrs: [ADR-017-interim-render-demo.md]
related_docs:
  [
    ../../workflows/deploy-render.md,
    ../../contracts/environment-configuration.md,
    ../../architecture/frontend-architecture.md,
    FE-048-preview-environment-banner.md,
    QA-006-live-demo-smoke.md,
  ]
design:
  required: true
  tool: figma
  file_url: ""
  frame: ""
  status: not_started
implementation:
  status: not_started
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: bea19977-28d3-4bd7-979d-7047628e5003
  identifier: MEDCONNECT-138
---

# FE-049 — API status indicator

## Objective

A visitor who reaches sign-in while the free-tier API is asleep sees a live API status indicator
and a sign-in that completes without manual retries.

## Context

The interviewer path is marketing → sign-in CTA → `/login` → submit. Render Free web services
sleep after about 15 minutes idle and take 45–60 s to wake (ADR-017). The first submit after idle
fails through the `/mcp-api` proxy with 502 and the form shows "Unable to sign in. Try again.",
and nothing has woken the API by the time the user retries. That reads as a broken demo. A
`GET /health` (public, no database) wakes the service.

## Scope

1. **Wake ping.** A shared helper sends a no-cors, `keepalive` `GET {api origin}/health` with no
   cookies. It is deduplicated for 60 s per tab, with a `localStorage` cooldown across tabs.
   - Marketing: fires only on a trusted gesture (`event.isTrusted`) on the sign-in CTAs (hover,
     focus, click). Not on page load.
   - Web `/login`: pings on first field focus, not on mount, through the same-origin `/mcp-api`
     proxy.
   - Skipped when `navigator.webdriver` is set.
   - Check whether `/login` is already `noindex` and disallowed in robots; add what is missing.
   - No server-side rate limiting (the web service sleeps too). Accept some bot wakes and watch
     Render instance-hours (about 750/month shared pool; verify on Render pricing) for a month.
   - Marketing has no API origin variable today: add a public one (name chosen in the plan),
     documented in `docs/contracts/environment-configuration.md` and the marketing `.env.*`
     examples.
2. **API status indicator** (web `/login` only; not the rest of the app, not marketing).
   - A fixed bottom-right pill or circle in the style of TanStack/Next devtools that expands into
     a small card with live API status. It is a real `<button>` toggling the card on click or
     Enter, with `aria-expanded`; Esc closes. Hover preview is an extra on fine-pointer devices
     only.
   - States: checking, waking, ready, unreachable. Colour is never the only signal: icon plus
     text label (amber waking, green ready, red unreachable).
   - **Waking** and **unreachable** auto-expand to the card. Waking shows elapsed seconds and
     "usually about a minute"; no fake percentage or promised countdown. Unreachable appears after
     a cap of about 90 s and offers a manual retry.
   - **Ready** collapses to a small green dot; the user can reopen it.
   - Polls `/health` with backoff only while waking, and stops on 200. A collapsed, healthy dot
     never polls (polling a healthy API would keep it awake and defeat spin-down). A later sleep
     is detected by a failed submit, which restarts the cycle.
   - Copy is demo-framed ("free tier sleeps when idle"), with no uptime claims. Status changes are
     announced once via `role="status"`.
   - Mobile: at 320 px it must not cover the form or submit button; add bottom padding or render
     as a bottom sheet at small widths.
   - Hidden in mock mode and PR previews. No top banner, so `--preview-banner-h` (FE-048) is
     untouched.
3. **Form.** One short line, "Server is waking up, see the status indicator", linked with
   `aria-describedby`. Submit stays enabled. A submit while waking is queued and completes
   automatically when the API answers, including the MFA branch. It is cancellable, never
   double-submits and does not bypass the rate limiter. A new `ServiceWakingError` in
   `apps/web/src/lib/api/http.ts` covers 502/503/504, network errors and timeouts. 401 and 429
   handling is unchanged. A 5xx with a valid error envelope is not a wake.
4. **Attention cue.** When a submit is queued, a brief highlight pulse on the indicator, with a
   shake only under `prefers-reduced-motion: no-preference`; otherwise a static highlight.

## Out of Scope

- A paid plan, a keep-alive cron or uptime pinger.
- API changes (`/health` already exists and is public).
- Waking Postgres.
- CSP/CORS changes unless the no-cors ping proves to need them.
- A marketing-side indicator or banner.
- Uptime claims.

## Requirements

- The ping is an unauthenticated `GET` to the API origin only: no credentials, cookies or PHI.
- Design tokens only; WCAG 2.2 AA; text contrast at least 4.5:1; keyboard and touch operable;
  no focus trap.
- Real `<button>` with an accessible name; hover alone is never the only way to open the card.
- Layouts hold at 320 px, 768 px and desktop without horizontal scroll.

## Acceptance criteria

- [ ] A trusted gesture on a marketing CTA sends exactly one `/health` with no cookies;
      synthetic/untrusted events and `navigator.webdriver` send none
- [ ] `/login` pings on first field focus (not on mount), deduplicated
- [ ] With a stubbed asleep API, the indicator auto-expands to the waking state with elapsed
      seconds and the form shows the hint, not "Unable to sign in. Try again."
- [ ] Polling runs only while waking and stops on 200; a collapsed healthy dot never polls
- [ ] The indicator works by keyboard (Enter toggles, Esc closes) and by touch; hover preview
      applies on fine pointers only
- [ ] A queued submit completes automatically, including the MFA path; cancel works; the cap
      shows the unreachable fallback with a retry
- [ ] A queued submit triggers a pulse (shake only under `no-preference`, static highlight
      otherwise)
- [ ] 401 and 429 messages are unchanged; a 5xx with a valid error envelope is not a wake
- [ ] Mock mode and PR previews show no indicator and send no ping
- [ ] At 320 px the indicator does not overlap the form or submit button
- [ ] Axe clean; status announced once; reduced motion respected
- [ ] Unit tests: ping helper (dedupe, cooldown), gesture and webdriver gating, error mapping,
      indicator state machine, queued submit; Playwright mock-mode spec; one QA-006 live smoke
      case
- [ ] Public marketing API-origin variable documented in `environment-configuration.md` and the
      `.env.*` examples

## Dependencies

- Depends on: INFRA-015, INFRA-016 (the free-tier spin-down this task works around)
- Related: FE-048 (preview detection via `isPrPreview()`), QA-006, FE-039, ADR-017
- Design: required before implementation. Figma states: dot, pill, expanded card, waking, ready,
  unreachable, each at mobile and desktop. Figma URL to be added here when approved.
- Product registry: no `docs/product/` row changes expected; check for a sign-in row on ship.

## Validation

Run lint, type-check and tests for `web` and `marketing`, plus `npm run e2e:mocks`. Do a real
Render sleep test: let the API sleep, then time marketing → login → submit.

## Risks / considerations

- Render's wake behaviour per request type needs a real sleep test (risk, not a blocker).
- The no-cors response is opaque; fine, the ping only needs to cause the wake.
- Bots can still wake the API by hitting it directly; the shared instance-hours pool could
  starve the web service.
- Polling must stay under the auth and global rate limits.

## Implementation notes

New visible UI and a public env variable: MINOR bump at ship time.

## Completion

Pending.
