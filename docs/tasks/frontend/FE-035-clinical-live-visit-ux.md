---
id: FE-035
type: task
area: frontend
feature: telehealth
status: implemented
priority: high
estimate: 5
dependencies: [SEC-008, BE-021, FE-030, FE-027]
related_adrs: [ADR-011-figma-canonical-visual-source.md, ADR-013-daily-custom-call-object.md]
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../contracts/api-endpoints.md,
    ../../product/telehealth.md,
    ../../marketing/capability-matrix.md,
    ../../workflows/design-requirements.md,
    FE-007-telehealth-session-shell.md,
    FE-014-telehealth-ui-nest-api.md,
    FE-030-daily-media-session-shell.md,
    FE-027-live-cookie-session-client.md,
    ../backend/BE-021-telehealth-eligibility-and-lifecycle.md,
    ../security/SEC-008-live-telehealth-workflow-contract.md,
  ]
design:
  required: true
  tool: figma
  file_url: "https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd"
  frame: "App / Telehealth session — 04 Connected — tablet (167:5)"
  status: approved
implementation:
  status: complete
validation:
  responsive: true
  accessibility: true
  tests_required: true
plane:
  work_item_id: d699216f-03dd-4a07-a9c2-b1aea461d480
  identifier: MEDCONNECT-102
---

# FE-035 — Clinical live-visit UX on the session shell

## Objective

Complete the clinical live-visit workflow on the shipped session shell: pre-join device and
permission guidance, leave versus end, ended/ineligible/expired states, and honest Daily
unavailable / 502 / 429 handling.

## Context

[FE-030](FE-030-daily-media-session-shell.md) ships Daily call-object media after Nest join.
`useLeaveTelehealthSession` currently calls Nest **end**, so one participant leaving closes the
visit. Ended sessions reopen the waiting room. There is no pre-join camera/mic check. Lobby
joinable filtering ignores the 15-minute window.

M16 is **Live Telehealth**. Nest eligibility is [BE-021](../backend/BE-021-telehealth-eligibility-and-lifecycle.md).
The contract is [SEC-008](../security/SEC-008-live-telehealth-workflow-contract.md).

Implements / extends `telehealth.start-session`, `telehealth.waiting-room`, and
`telehealth.live-media`. Module stays **partial** because `telehealth.chat-recording` remains
planned.

**Do not implement application UI until `design.status` is `approved` on this task.**

Shared Figma file (repeat in Dependencies when approved):
https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=167-5

## Design brief

User goals: provider and patient complete an appointment-linked visit with honest media
states; leaving the call must not end the visit; ended or ineligible visits must not reopen Join.

Sections (extend `/dashboard/telehealth/[sessionId]`, reuse FE-030 connected / waiting /
unavailable / reconnect frames in the shared file): appointment linkage; pre-join waiting room
with optional camera/mic check; in-session tiles and controls; leave versus end; terminal
ended/ineligible card with lobby link.

States: loading; waiting + device ready/denied/missing; joining; waiting-for-participant;
connected; reconnecting; failed (502); not configured; permission denied; no device; rate
limited; left-media (rejoin); ended; ineligible. Tablet first-class; stacked mobile; `md`
two-tile grid.

Accessibility: `aria-live` status, `role="alert"` errors, keyboardable controls, visible focus.
Reuse `Button`, `Card`, FE-030 tiles, and tokens. Do not invent a second telehealth IA.

Figma write tools were unavailable in this session. Visual source remains the approved FE-030
session page in the shared file; M16 states extend that chrome rather than a parallel library.

## Scope

- Design on this task (shared Figma file): pre-join device/permission; permission denied; no
  device; ended/completed; cancelled/expired/ineligible; leave versus end controls. Tablet is
  first-class. Reuse FE-030 connected, waiting-for-participant, unavailable, and reconnect frames.
- Pre-join: request camera/mic (Daily `startCamera` or equivalent on `@daily-co/daily-js` 0.81.0 —
  verify API at implement time; not Prebuilt). Guidance if denied or missing. Do not mint until
  Nest join succeeds.
- Leave = Daily `leave`/`destroy` only; remint on retry. End consultation = Nest `POST .../end`
  for roles with `write:appointments`. Hide End for `PATIENT` and `NURSE`; they Leave.
  Provider/admin/receptionist End remains.
- Ended, `SESSION_ENDED`, `SESSION_NOT_JOINABLE`, cancelled/expired: dedicated copy and lobby
  link; never reopen Join.
- Lobby and appointment entry: filter with start/end join window (UX only; Nest is authoritative).
- Map 502 `MEDIA_UNAVAILABLE` and 429 `RATE_LIMITED` to existing alert patterns; retry remints.
- `aria-live` status, keyboardable controls, `md` grid plus a usable mobile stack.
- Mock mode keeps placeholders.
- When shipped: [telehealth.md](../../product/telehealth.md) demo text for start-session /
  waiting-room / live-media (still qualified);
  [capability-matrix.md](../../marketing/capability-matrix.md) in lockstep. Do not add an
  unqualified “live video visits” public claim.

## Out of Scope

- Chat, recording, transcription
- Socket.IO, new routes, Nest `/leave`
- Daily Prebuilt iframe
- Rewriting mock mode onto Daily
- Two-browser CI that requires a real camera
- Recreating FE-007 / FE-014 / FE-030 / BE-006 / BE-016
- Dashboard, login, or appointment-create redesign

## Requirements

### UI / design

- Extend `/dashboard/telehealth/[sessionId]`; do not invent a second telehealth information
  architecture
- States: pre-join, permission denied, no device, waiting, joining, connected,
  waiting-for-participant, reconnecting, failed, not configured, ended, ineligible
- Accessible media controls, visible focus, live region for connection and visit status
- Errors use `role="alert"`
- Repeat the approved Figma URL in Dependencies when design is approved

### Technical

- Frontend checks remain UX only; Nest is authoritative
- Meeting token stays in memory only; never `localStorage` / `sessionStorage` / console
- Mock Playwright stays on `NEXT_PUBLIC_USE_MOCKS=true`
- CI `e2e:live` must pass without `DAILY_API_KEY` (labeled unavailable is success)
- Reuse [telehealth-session-shell.tsx](../../../apps/web/src/components/telehealth/telehealth-session-shell.tsx),
  [waiting-room.tsx](../../../apps/web/src/components/telehealth/waiting-room.tsx),
  [daily-media-session.tsx](../../../apps/web/src/components/telehealth/daily-media-session.tsx),
  [use-daily-media-session.ts](../../../apps/web/src/lib/hooks/use-daily-media-session.ts),
  [use-telehealth.ts](../../../apps/web/src/lib/hooks/use-telehealth.ts)

## Acceptance Criteria

- [x] `design.status` is `approved` with `file_url` and `frame` before implementation
- [x] Authorized provider and patient can create/join/mint (live) or use placeholders (mock) from
      an in-window telehealth appointment
- [x] Leave does not call Nest end; End does; ended UI is terminal
- [x] Ineligible, cancelled, expired, and ended show a non-joinable state
- [x] Unconfigured Daily remains labeled unavailable (not a fake successful call)
- [x] Permission denied, missing device, 502, and reconnecting are distinct, announced, and
      retryable where valid
- [x] Meeting token stays in memory only; not logged
- [x] Vitest + Playwright mock; `e2e:live` still passes without `DAILY_API_KEY`
- [x] Catalog demo text updated; module stays partial (`telehealth.chat-recording` planned)

## Dependencies

- SEC-008, BE-021, FE-030, FE-027
- Design brief via [design-brief-prompt.md](../../processes/prompts/design-brief-prompt.md) on
  **this** task

Figma (shared library; approved page **App / Telehealth session**, primary frame
**04 Connected — tablet** (`167:5`)):
https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=167-5

## Validation

- Vitest: leave versus end, ended/ineligible UI, 502, unconfigured, permission-denied (mocked Daily)
- Mock Playwright: complete/exit path
- `npm run e2e:live` still accepts Connected **or** not configured
- Lint and type-check
- Optional manual two-browser check when a key exists (not a CI gate)

## Risks / Considerations

- Design is a blocker for UI code.
- Playwright cannot reliably exercise getUserMedia; do not require a captured camera feed.
- Do not present Daily as a production telehealth deployment or HIPAA-certified video.
- Shipping this slice is **MINOR** if not already bumped by BE-021 in the same change.

## Implementation notes

Suggested order: after BE-021 and `design.status: approved`. Figma may run in parallel with
BE-021.

Writing this spec is not a version bump. Design-metadata approval is not a version bump.

## Completion

Shipped with BE-021 in 0.81.0 (MINOR). Pre-join camera/mic check, Leave call versus End session,
terminal ended/ineligible UI, 502/429 copy, and lobby join-window filter. Catalog
`telehealth.start-session` / `waiting-room` / `live-media` demo text updated and stays qualified.
Module remains partial (`telehealth.chat-recording` planned). Figma write tools were unavailable;
visual source remains the approved FE-030 connected tablet frame (`167:5`).
