---
id: SEC-013
type: task
area: security
feature: telehealth
status: implemented
priority: high
estimate: 2
dependencies: [SEC-008, BE-021, FE-035, BE-023, FE-036, BE-024, FE-038]
related_adrs:
  [
    ADR-002-tenant-isolation.md,
    ADR-005-synthetic-demo-data.md,
    ADR-011-figma-canonical-visual-source.md,
    ADR-013-daily-custom-call-object.md,
    ADR-015-rate-limiting-and-api-protection.md,
    ADR-016-super-admin-session-tenant-scope.md,
  ]
related_docs:
  [
    ../../contracts/data-contracts.md,
    ../../contracts/api-endpoints.md,
    ../../contracts/identity-and-access.md,
    ../../contracts/environment-configuration.md,
    ../../architecture/security-architecture.md,
    ../../product/telehealth.md,
    ../../marketing/capability-matrix.md,
    ../../roadmap/release-roadmap.md,
    SEC-008-live-telehealth-workflow-contract.md,
    ../backend/BE-021-telehealth-eligibility-and-lifecycle.md,
    ../frontend/FE-035-clinical-live-visit-ux.md,
    ../backend/BE-023-concurrent-session-inventory-http.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: false
plane:
  work_item_id: f0554cef-3c1c-477f-b8f3-7b39c9e003bb
  identifier: MEDCONNECT-158
---

# SEC-013 — Telehealth 2.0 visit-experience contract (M22)

## Objective

Record the M22 **Telehealth 2.0 — Visit experience** decisions before code: one leave/end
vocabulary with a host rule for End visit, activity semantics for the idle timeout during a live
visit, server-sourced participant identity in the call, staff display identity, the device and
background-effect data rules, the demo persona camera boundary, the room-expiry notice, and claim
wording. Docs only.

## Context

M16 shipped the live visit ([SEC-008](SEC-008-live-telehealth-workflow-contract.md),
[BE-021](../backend/BE-021-telehealth-eligibility-and-lifecycle.md),
[FE-035](../frontend/FE-035-clinical-live-visit-ux.md)); M18 added participant entry
([BE-024](../backend/BE-024-telehealth-open-session-lookup.md),
[FE-038](../frontend/FE-038-telehealth-participant-entry.md)). M22 rebuilds the visit UI (green
room, full-screen call stage, call states, wrap-up, demo persona camera). Findings from the
baseline at 1.0.1:

1. **Idle timeout is refreshed by background polling.** Every authenticated request sets
   `lastActivityAt` (`apps/api/src/identity/auth.service.ts:196`). The dashboard always mounts the
   concurrent-session dialog (`apps/web/src/components/auth/dashboard-auth-gate.tsx:44`,
   `apps/web/src/components/providers/session-provider.tsx:23`), which polls `GET /auth/sessions`
   every 2 minutes while the tab is visible (`apps/web/src/lib/hooks/use-session.ts:91`). So the
   15-minute idle timeout never fires on a visible dashboard tab, and the contract line "Do not add
   an activity keep-alive" ([identity-and-access.md](../../contracts/identity-and-access.md)) is
   already contradicted by an implicit one. When the tab is hidden (TanStack stops polling), a
   15-minute-plus visit can expire the session and "End visit" fails.
2. **Anyone with `write:appointments` can end a live clinical visit**, including RECEPTIONIST
   (`apps/api/src/telehealth/telehealth-session.controller.ts:125`,
   `apps/web/src/lib/auth/telehealth-access.ts:18`, covered by
   `apps/api/test/telehealth.http.spec.ts:223`).
3. **Provider names are emails.** `providerName` is `appointment.provider?.email`
   (`apps/api/src/telehealth/telehealth-session.service.ts:300`,
   `apps/api/src/scheduling/appointment.service.ts:339`); users have no name columns and the seeded
   nurse has no name.
4. **The call UI assumes one remote participant** and takes names from client fallbacks
   (`apps/web/src/lib/telehealth/media-participant.ts`). A three-way visit (provider, patient,
   assigned nurse) needs server-sourced identity per tile.
5. **Rooms close at appointment end + 15 minutes** with `eject_at_room_exp: true`
   (`apps/api/src/telehealth/daily-rest-adapter.ts:23`). Overrunning visits are ejected without
   warning.

Design: Figma page `Telehealth 2.0 · working copies` (node 499:983) in
https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd. The AI drafts page (364:7200) is reference
only. Per-task frames are approved on the FE tasks, not here.

## Scope

1. **Leave and end vocabulary** ([data-contracts.md](../../contracts/data-contracts.md),
   [api-endpoints.md](../../contracts/api-endpoints.md)). **Leave call** is client/Daily only,
   reversible, available to every participant (unchanged from SEC-008). **End visit** is
   `POST /telehealth/sessions/:id/end`. UI copy uses exactly these two labels; red is reserved for
   End visit.
2. **Host rule for end** ([identity-and-access.md](../../contracts/identity-and-access.md)). End
   requires `write:appointments` **and** the caller is the appointment's provider or a
   PRACTICE_ADMIN (SUPER_ADMIN within the session practice, ADR-016). RECEPTIONIST keeps create and
   get but no longer ends. Other callers get the existing forbidden envelope; unknown and
   cross-tenant ids keep the same not-found. No new permission string: this is a resource-ownership
   check (step 4 of the authorization chain). Lazy-end is unchanged.
3. **Activity semantics and in-visit keep-alive**
   ([identity-and-access.md](../../contracts/identity-and-access.md), "Idle, absolute, and
   concurrent policy"). Replace "Do not add an activity keep-alive" with:
   - Idle timeout means **no user-initiated request** for 15 minutes. Background polls (today
     `GET /auth/sessions` from the concurrent-session dialog) are passive and must not refresh
     `lastActivityAt`. The client marks them with a request header; the server skips the touch
     for marked requests. A client that omits the header only keeps its own session alive; the
     control targets an unattended screen, not a hostile client, and the absolute cap still holds.
   - One explicit keep-alive: `POST /telehealth/sessions/:id/heartbeat`. Allowed only for a visit
     participant (the same rule as join) of a session in `in_session` whose appointment is still
     eligible. It refreshes `lastActivityAt` and nothing else; it never moves
     `absoluteExpiresAt`. The client sends it about once a minute while joined to Daily and stops
     on leave, end or rejection. Ended, ineligible or past-grace sessions reject it with the
     existing conflict codes, so a keep-alive is bounded by the join window. No audit row per
     heartbeat.
   - After the call the normal 15-minute idle rule applies; the existing extension modal handles
     the warning.
4. **Session response additions** ([data-contracts.md](../../contracts/data-contracts.md), additive):
   - `participants`: `{userId, displayName, role}` for the appointment provider, the portal
     patient and each assigned nurse. Server-sourced. Tiles resolve name and role by matching the
     Daily participant `user_id` (set by Nest in the meeting token) to this list, never from a
     client-chosen Daily `user_name`.
   - `mediaExpiresAt`: when the Daily room and token expire (appointment end + 15 minutes), so the
     client can warn 5 minutes before. No room extension in M22.
   - `viewerCanEnd`: UX hint computed by the server from the host rule. Enforcement stays on
     `POST .../end`.
5. **Minimum necessary toward Daily.** Meeting tokens keep `user_id` only. Do not send names,
   email, role or appointment details to Daily (`user_name`, room names, app messages). Room names
   stay opaque (`mcp-<sessionId>`).
6. **Staff display identity** ([data-contracts.md](../../contracts/data-contracts.md)). A
   practice membership carries `displayName`, an optional `credential` (for example "MD", "RN")
   and an optional demo `personaKey`. Appointment and telehealth responses show `displayName`
   where they show `providerName` today; staff email is not shown in patient-facing UI. Seeded
   staff get synthetic names; the demo visit reason becomes "Blood pressure follow-up" (ADR-005).
   The visit title is the appointment reason, never the diagnosis list (front-desk roles see
   titles).
7. **Device, network and effect data stay in the browser**
   ([security-architecture.md](../../architecture/security-architecture.md)). Device labels,
   device ids, network statistics and the background choice are not sent to Nest, logged or
   audited. The browser may remember the last-used device ids in local storage as a convenience.
   Device enumeration is UX, not a security control.
8. **Background effects.** None, Blur and a fixed set of built-in images (Clinic exam room, Nurse
   station, Home living room) in all environments. Images are first-party static assets; no
   upload and no URL input. Processing is Daily's in-browser processor on the local camera track.
   The web app sets no Content-Security-Policy today; any future CSP must allow Daily's processor
   assets.
9. **Demo persona camera boundary**
   ([environment-configuration.md](../../contracts/environment-configuration.md)). Available only
   when `NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=true` (no new variable; hosted production leaves it unset).
   The camera source is an illustrated persona drawn on a canvas and sent as a custom video track.
   The persona is the signed-in membership's `personaKey`; it is never chosen freely and never
   changes the displayed name. It is never applied to anyone else's video. Always labeled
   "Demo · synthetic camera". No face tracking, overlays, AI generation, or gender mapping.
10. **Claim wording.** "Encrypted connection" and "This visit is not recorded". Never "secure",
    "private", "end-to-end" or "HIPAA". Daily media is encrypted in transit to Daily's
    infrastructure; it is not end-to-end encrypted.
11. **Layout decision.** The M22 call page is full screen with a dark stage. This supersedes the
    FE-030 desktop frame note "Not a full-bleed Prebuilt theater" (App / Telehealth session page,
    frame 169:60). New Figma variables `color/stage/*` map to `tokens.css` in the call-stage task
    (ADR-011).
12. **Rate limit** ([ADR-015](../../decisions/ADR-015-rate-limiting-and-api-protection.md), additive
    row, needs approval to edit the ADR): `POST /telehealth/sessions/:id/heartbeat` 10 per 5 min,
    session user, fail open.
13. **Milestone setup.** Add M22 to [release-roadmap.md](../../roadmap/release-roadmap.md),
    [product-roadmap.md](../../roadmap/product-roadmap.md), the frontend and backend roadmaps,
    [00-master-task-list.md](../00-master-task-list.md) and [AGENTS.md](../../../AGENTS.md). Add
    `planned` capability rows to [telehealth.md](../../product/telehealth.md): prejoin-devices,
    call-controls, in-visit-keepalive, demo-persona. No marketing claims until shipped.

## Out of Scope

- Any application code, migration, or dependency change
- M23 items, recorded in a later contract task: admission and lobby, lock, remove, owner tokens,
  ephemeral chat, Daily webhooks, clinical side panel, identity and location check
- Consent gate (M24), recording, transcription, captions, persisted chat, Socket.IO, Redis
- Edits to ADR-013 (not needed for M22)
- Daily HIPAA add-on, BAA, AWS

## Requirements

- Authorization stays server-side. `viewerCanEnd`, hidden buttons and client role checks are UX
  only.
- The keep-alive never extends the absolute session cap and only works inside an eligible,
  `in_session` visit.
- No meeting tokens, `DAILY_API_KEY`, device data or PHI in audit rows, logs, Git or docs.
- Participant names shown in the call come from Nest, keyed by the token `user_id`.
- Do not claim HIPAA compliance or production telehealth.

## Acceptance Criteria

- [x] Contracts name Leave call and End visit, and End visit has the host rule (receptionist
      cannot end) without a new permission string
- [x] Identity contract defines user-initiated activity, passive background polls, and the
      in-visit heartbeat with its bounds; the "no keep-alive" line is replaced
- [x] Session response adds `participants`, `mediaExpiresAt` and `viewerCanEnd`; tile identity is
      bound to the token `user_id`
- [x] Data contract adds membership `displayName`, `credential`, `personaKey`; the provider email
      is no longer shown as a name
- [x] Device/network/effect data rule, background-effect rule and demo persona boundary are in the
      security architecture
- [x] ADR-015 has the heartbeat row (after approval)
- [x] Roadmaps, master task list and AGENTS.md show M22; telehealth.md has `planned` rows only
- [x] No application code changed; no secrets or PHI in docs

## Dependencies

- Shipped: SEC-008, BE-021, FE-035, BE-023, FE-036, BE-024, FE-038
- Blocks: the M22 data, backend, frontend and QA tasks (staff display identity, keep-alive and
  host rule, green room, call stage, call states and wrap-up, demo persona camera, verification)
- Figma: https://www.figma.com/design/ZJf1d3ur89UPiY7S2yiCKd (page `Telehealth 2.0 · working
  copies`)

## Validation

- Doc review against the routes in `apps/api/src/telehealth/telehealth-session.controller.ts`,
  `auth.service.ts` activity handling, and the working-copy frames

## Risks / Considerations

- The host rule changes shipped behavior: `telehealth.http.spec.ts:223` (receptionist ends) and
  the web `END_VISIT_ROLES` set must change in the backend task, with a changelog entry.
- Making polls passive means idle sign-out starts working on visible tabs. That is the intended
  HIPAA-oriented automatic-logoff pattern, but demo presenters will see the extension modal after
  15 idle minutes outside a visit.
- The passive marker is client-cooperative by design; document that in the security architecture.
- Docs-only: no version bump (ADR-007). The implementing tasks bump the minor version (1.1.0 at
  M22 close).

## Implementation notes

Writing this spec is not a version bump. Shipping the docs is not a version bump.

## Completion

Shipped as docs only (2026-11-04): leave/end vocabulary and the host-only end rule; activity
semantics (passive background polls, one in-visit heartbeat bounded by the join window); session
`participants`, `mediaExpiresAt`, `viewerCanEnd`; membership `displayName`, `credential`,
`personaKey`; minimum necessary toward Daily; device, background-effect and demo persona rules;
claim wording. Updated data-contracts, api-endpoints, identity-and-access, security-architecture,
environment-configuration, ADR-015 (heartbeat row and amendment, user approved 2026-11-04),
release, product, frontend and backend roadmaps, the master task list, AGENTS.md, and
`docs/product/telehealth.md` (`planned` rows only). No version bump (ADR-007).
