---
id: FE-030
type: task
area: frontend
feature: telehealth
status: implemented
priority: high
estimate: 5
dependencies: [FE-014, FE-027, BE-016]
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
    FE-027-live-cookie-session-client.md,
    ../backend/BE-016-telehealth-daily-media-token-http.md,
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
  work_item_id: a05bd2e7-29b7-4efb-9d7b-41cc488880e0
  identifier: MEDCONNECT-86
---

# FE-030 — Daily media in the telehealth session shell

## Objective

Connect the shipped session shell to Nest `POST /telehealth/sessions/:id/media-token` and
`@daily-co/daily-js` call-object media so live camera, microphone, and screen share replace
placeholder tiles.

## Context

[FE-007](FE-007-telehealth-session-shell.md) and [FE-014](FE-014-telehealth-ui-nest-api.md) ship
the lobby, waiting-room copy, and Nest create/join/end. Live e2e currently asserts no `video`
or `iframe`. `@daily-co/daily-js` is already in `apps/web` and unused.

Media tokens are [BE-016](../backend/BE-016-telehealth-daily-media-token-http.md). Live fetches
must use the cookie client from [FE-027](FE-027-live-cookie-session-client.md). Do not store
meeting tokens in `localStorage`.

Implements / extends `telehealth.live-media` and `telehealth.waiting-room`.

**Do not implement application UI until `design.status` is `approved` on this task.**

Shared Figma file (repeat in Dependencies when approved):
https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd

## Scope

- Design on this task (shared Figma file): in-session live tiles, waiting-for-participant,
  media-unavailable, error/reconnect. Tablet is first-class.
- Live: after Nest join, `POST .../media-token` via `apiFetch` (`credentials: 'include'`). Never
  persist the meeting token.
- Daily **call object** in the existing session chrome — not Daily Prebuilt, not a new route.
  Camera / microphone / screen share toggle Daily, not local React placeholder flags.
- Waiting room: after Nest `in_session`, stay in waiting UI until a remote Daily participant
  (or local media-unavailable).
- States: media joining, connected, reconnecting, failed, not configured. End session leaves
  Daily then Nest `POST .../end`.
- Mock mode keeps [media-placeholders.tsx](../../../apps/web/src/components/telehealth/media-placeholders.tsx).
  Update [telehealth-live.spec.ts](../../../apps/web/e2e/telehealth-live.spec.ts) so live no
  longer requires zero `video` elements.
- When shipped: [telehealth.md](../../product/telehealth.md)
  (`telehealth.live-media` and `telehealth.waiting-room` → shipped / `public: qualified`);
  [capability-matrix.md](../../marketing/capability-matrix.md);
  [marketing-feature-pages-copy.ts](../../../apps/web/src/components/marketing/marketing-feature-pages-copy.ts);
  README telehealth row. Module stays **partial** because `telehealth.chat-recording` remains
  planned. Do not claim production telehealth or HIPAA video.

## Out of Scope

- Chat, recording, transcription
- Socket.IO
- Daily Prebuilt iframe
- Rewriting mock mode onto Daily
- PATIENT portal login as a product
- M9 hosting / Amplify Daily secrets
- Recreating FE-007 / FE-014 / BE-006

## Requirements

### UI / design

- Extend `/dashboard/telehealth/[sessionId]`; do not invent a second telehealth information
  architecture
- States: joining, connected, waiting-for-participant, reconnecting, failed, not configured
- Accessible media controls (`aria-pressed`), visible focus, live region for connection state
- Errors use `role="alert"`
- Repeat the approved Figma URL in Dependencies when design is approved

### Technical

- Frontend checks remain UX only; Nest is authoritative
- No client `practiceId` authorization
- Mock Playwright stays on `NEXT_PUBLIC_USE_MOCKS=true`
- CI `e2e:live` must pass without `DAILY_API_KEY` (labeled unavailable is success)
- Reuse [telehealth-session-shell.tsx](../../../apps/web/src/components/telehealth/telehealth-session-shell.tsx),
  [waiting-room.tsx](../../../apps/web/src/components/telehealth/waiting-room.tsx),
  [telehealth-api.ts](../../../apps/web/src/lib/api/telehealth-api.ts),
  [use-telehealth.ts](../../../apps/web/src/lib/hooks/use-telehealth.ts)

## Acceptance Criteria

- [x] `design.status` is `approved` with `file_url` and `frame` before implementation
- [x] Live join shows real Daily media when `DAILY_API_KEY` is configured; labeled unavailable
      when it is not
- [x] Camera, microphone, and screen share control Daily
- [x] Waiting room is presence-based after Nest join
- [x] Mock Playwright still uses placeholders; mock tests do not call Daily
- [x] One `e2e:live` path: lobby → join → media-token → connected **or** labeled unavailable →
      end. Daily credentials are not required in CI
- [x] Tablet viewport remains covered
- [x] Catalog: `telehealth.live-media` shipped (qualified); `telehealth.waiting-room` shipped
      (qualified). Marketing copy no longer says live video is absent while the demo shows it

## Dependencies

- FE-014, FE-027 (shipped), BE-016
- Design brief via [design-brief-prompt.md](../../processes/prompts/design-brief-prompt.md) on
  **this** task

Figma (shared library; approved page **App / Telehealth session**, primary frame
**04 Connected — tablet** (`167:5`)):
https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd?node-id=167-5

## Validation

- Vitest with mocked Daily call object (join, controls, waiting, unavailable, end)
- Mock Playwright telehealth flow unchanged except where copy must stay honest
- `npm run e2e:live` telehealth spec as above (token + UI state, not a captured camera feed)
- Lint and type-check
- Manual two-browser check when a key exists (provider + assigned MFA nurse), tablet included

## Risks / Considerations

- Design is approved; remaining work is implementation.
- Playwright cannot reliably exercise getUserMedia; do not require a captured camera feed.
- Marketing no longer says live video is absent while the demo shows Daily media.
- Do not present Daily as a production telehealth deployment or HIPAA-certified video.

## Implementation notes

Suggested order: after BE-016 and `design.status: approved`. Figma may run in parallel with
BE-016. Do not add Socket.IO for signaling.

Writing this spec is not a version bump. Design-metadata approval is not a version bump.
Shipping this slice is **MINOR**.

## Completion

- Implementation: Daily call-object media on `/dashboard/telehealth/[sessionId]` after Nest
  `POST .../media-token`. Fake `unconfigured.invalid` rooms show labeled unavailable. Mock mode
  keeps placeholders. End leaves Daily then Nest `POST .../end`.
- Tests: Vitest for media-token client, unconfigured host, Daily hook (join/controls/waiting/
  unavailable/end), Daily UI states, mock shell placeholders. Live e2e asserts unavailable or
  Connected without requiring a camera feed.
- PR:
- Notes: Version 0.72.0 → 0.73.0 (MINOR). Catalog `telehealth.live-media` and
  `telehealth.waiting-room` shipped as qualified. Module stays partial (`telehealth.chat-recording`
  planned). Plane MEDCONNECT-86 is a human update. Manual two-browser check still needs a local
  `DAILY_API_KEY`.
