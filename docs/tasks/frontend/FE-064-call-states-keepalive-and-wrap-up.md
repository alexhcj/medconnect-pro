---
id: FE-064
type: task
area: frontend
feature: telehealth
status: implemented
priority: high
estimate: 3
dependencies: [SEC-013, BE-027, FE-063, FE-036]
related_adrs: [ADR-011-figma-canonical-visual-source.md, ADR-013-daily-custom-call-object.md]
related_docs:
  [
    ../../contracts/identity-and-access.md,
    ../../contracts/data-contracts.md,
    ../../architecture/security-architecture.md,
    ../../product/telehealth.md,
    ../security/SEC-013-telehealth-2-visit-experience-contract.md,
    ../backend/BE-027-telehealth-keepalive-and-host-rule.md,
    FE-036-live-concurrent-session-chrome.md,
  ]
design:
  required: true
  tool: figma
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=499-1948"
  frame: "Page 'FE-064 Call states, keep-alive and wrap-up' (541:456), moved from the working-copies page 2026-11-10; approved by the user 2026-11-10: section Call states and wrap-up (499:1948) — TH-08 call states 499:1949 (incl. closing soon, waiting for provider, device access lost), TH-05 reconnecting mobile 499:2191, TH-09 provider wrap-up 499:2260, TH-09 patient visit ended 499:2401; section Session keep-alive (499:2913) — live notice 503:510, after-call idle warning 503:606."
  status: approved
implementation:
  status: in_progress
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: 80b9e300-5938-441c-ad8a-f877de29c055
  identifier: MEDCONNECT-163
---

# FE-064 — Call states, session keep-alive and wrap-up

## Objective

Handle every call state with a clear next step, keep a participant signed in during a live visit
with the heartbeat, mark background polls as passive, warn before the room closes, and end with a
provider wrap-up and a patient "visit ended" screen.

## Context

[BE-027](../backend/BE-027-telehealth-keepalive-and-host-rule.md) adds the heartbeat, the passive
marker and `mediaExpiresAt`. The concurrent-session dialog polls `GET /auth/sessions` every 2
minutes (`apps/web/src/lib/hooks/use-session.ts:91`, `apps/web/src/lib/api/session-real.ts:251`).
The session extension modal and warning banner already exist
(`apps/web/src/components/session/session-extension-modal.tsx`, `session-warning-banner.tsx`) and
have no Figma frame.

## Scope

- **Passive poll.** `checkConcurrentSessions` sends `X-MCP-Activity: passive`. No other request is
  marked.
- **Heartbeat loop.** While joined to Daily (connected or reconnecting) and the Nest session is
  `in_session`, send `POST .../heartbeat` about every 60 seconds, also when the tab is hidden.
  Stop on Leave call, End visit, 404 or 409. On 429 back off to the next interval. Show the live
  notice "You'll stay signed in while you're in a live visit." once per visit.
- **Room-expiry notice.** 5 minutes before `mediaExpiresAt`: "This visit closes in 5 minutes, at
  <time>." (US time format, FE-057). No extension.
- **Call states** from TH-08: waiting for participant (provider), waiting for provider (patient),
  reconnecting, poor network with a camera-off fallback, participant left (Wait / End visit for
  the host only), device access lost (Retry devices), live media not configured (shipped copy:
  "Live media is not configured in this environment" / "This demo environment does not have live
  Daily media configured."), ended.
- **Wrap-up (provider, 1440).** Summary: duration, "Seen in this call" (from the client's Daily
  participant list, labeled as such), ended time, connection quality; Follow-up card with "Book
  follow-up" linking to the existing new-appointment form prefilled with patient and provider. The
  page uses the standard dashboard shell.
- **Visit ended (patient, 390).** Confirmation, follow-up appointment card only when a real next
  appointment exists, "Back to appointments".
- **After the call** the normal idle rule applies; the existing extension modal shows the warning.
  Its copy may get "You've been inactive since the call ended." only if that matches the shipped
  component's structure; add its first Figma frame from the working copy.

## Out of Scope

- Visit note, SOAP, sign and lock (M24); patient instructions, care plans, ratings, audit links
- Admission and "waiting in lobby" server state (M23)
- Changing idle or absolute durations

## Requirements

- Status changes announced politely; the room-expiry notice doesn't steal focus; the after-call
  modal traps and returns focus.
- The heartbeat sends no body and no device data.

## Acceptance Criteria

- [x] Frames approved on the task page before code
- [x] Inventory poll carries the passive header; nothing else does (unit test on the API client)
- [x] Heartbeat starts and stops on the right events, keeps running in a hidden tab, and backs off
      on 429 (fake timers)
- [ ] A 25-minute live visit with the tab hidden can still End visit (local stack, recorded)
- [x] All TH-08 states render with the right actions per role
- [ ] Wrap-up and visit-ended screens match the frames; "Book follow-up" opens the prefilled form
      (behavior verified by unit and mock e2e tests; the visual comparison with the frames is not done)
- [x] Room-expiry notice at T-5 minutes
- [x] CHANGELOG and version (ADR-007)

## Dependencies

- Contract: [SEC-013](../security/SEC-013-telehealth-2-visit-experience-contract.md)
- Needs: [BE-027](../backend/BE-027-telehealth-keepalive-and-host-rule.md), [FE-063](FE-063-call-stage-and-controls.md)
- Figma: https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd/MedConnect-Pro-Design-System?node-id=499-1948

## Validation

- `npm run test -w apps/web` (heartbeat hook, passive header, state mapping)
- Mock Playwright specs for states and wrap-up; one local live run with a hidden tab

## Completion

Implemented at 1.5.0 (MINOR). Two criteria stay open: the 25-minute hidden-tab run on the local stack, and the
visual comparison of wrap-up and visit-ended with the Figma frames.

- **Passive poll:** `PASSIVE_HEADER_NAME` in `apps/web/src/lib/api/http.ts`, applied only in
  `checkConcurrentSessions` (`session-real.ts`). Test: `session-real.test.ts`.
- **Heartbeat and token refresh:** `lib/telehealth/use-visit-keepalive.ts` (60 s timer chain; stops on cleanup,
  404, 409; 429 waits). Deviation from the plan: the 15-minute access token lapses regardless of the heartbeat
  (`apps/api/src/identity/session-policy.ts`), so the hook also calls `/auth/refresh` through
  `sessionAPI.extendSession` while less than 12 minutes remain. `live-visit-flag.ts` keeps the expiry banner and
  modal quiet during a live visit. The identity contract line "Do not add a keep-alive other than the in-visit
  heartbeat" now names this refresh as the one accompanying client behavior (amended, user approved 2026-11-10).
- **Call states:** pure mapper `lib/telehealth/call-state.ts`; `deviceLost` from Daily `camera-error`;
  `CallStage` gains status actions and non-modal notices (`use-call-notices.ts`: keep-alive notice once per visit,
  closing notice at `mediaExpiresAt` minus 5 minutes).
- **Wrap-up and visit ended:** `visit-wrap-up.tsx`, `visit-ended.tsx`; the shell shows them for a session that was
  live (`joinedAt` set), and End visit no longer redirects to the lobby. "Seen in this call" and connection quality
  come from `call-summary.ts` (in memory, this browser only) and are hidden after a reload. Patient ids for the
  follow-up link come from the appointment list, not the session type.
- **Follow-up prefill:** `appointments/new` reads `providerId`; `AppointmentForm` applies it only if the provider is
  in the loaded list.
- Not changed: the after-call extension modal copy and structure (its Figma frame is a restyle; see Plan Q1).

## Risks / Considerations

- With polls passive, demo presenters see the extension modal after 15 idle minutes outside a
  visit. That is the intended behavior.
- Browsers throttle timers in hidden tabs; a 60 s interval stays well inside the 15 min idle limit.
