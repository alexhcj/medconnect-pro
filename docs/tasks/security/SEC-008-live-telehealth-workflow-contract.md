---
id: SEC-008
type: task
area: security
feature: telehealth
status: implemented
priority: high
estimate: 2
dependencies: [BE-016, FE-030, SEC-007, BE-019]
related_adrs: [ADR-013-daily-custom-call-object.md, ADR-015-rate-limiting-and-api-protection.md]
related_docs:
  [
    ../../architecture/security-architecture.md,
    ../../contracts/data-contracts.md,
    ../../contracts/api-endpoints.md,
    ../../contracts/identity-and-access.md,
    ../../decisions/ADR-015-rate-limiting-and-api-protection.md,
    ../../roadmap/release-roadmap.md,
    ../../product/telehealth.md,
    ../backend/BE-016-telehealth-daily-media-token-http.md,
    ../frontend/FE-030-daily-media-session-shell.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: false
plane:
  work_item_id: 1e06ce80-76e3-4681-9f0a-b29c01b131ca
  identifier: MEDCONNECT-100
---

# SEC-008 — Live telehealth workflow and access contract

## Objective

Record the M16 live-telehealth decisions before code: appointment eligibility on join and
media-token, join-before-mint, leave versus end, 502 `MEDIA_UNAVAILABLE`, and additive create/join
rate limits. Docs only.

## Context

M5 and M12 already ship appointment-linked sessions and Daily media tokens
([BE-006](../backend/BE-006-telehealth-session-api.md),
[BE-016](../backend/BE-016-telehealth-daily-media-token-http.md),
[FE-030](../frontend/FE-030-daily-media-session-shell.md)). Contracts still describe minting from
any non-ended session, defer `POST .../leave`, and omit OpenAPI 502. Join and mint do not re-check
appointment cancel/complete. [ADR-013](../../decisions/ADR-013-daily-custom-call-object.md) stays
accepted; this task does not introduce ADR-016.

M16 is **Live Telehealth**. Backend enforcement is [BE-021](../backend/BE-021-telehealth-eligibility-and-lifecycle.md).
Frontend UX is [FE-035](../frontend/FE-035-clinical-live-visit-ux.md).

## Scope

- [data-contracts.md](../../contracts/data-contracts.md): eligibility on get/join/mint; lazy-end
  when cancelled, completed, or past grace; media-token requires `in_session`; leave is
  client/Daily only.
- [api-endpoints.md](../../contracts/api-endpoints.md): no Nest `/leave`; document 502
  `MEDIA_UNAVAILABLE` on media-token; leave versus end.
- [identity-and-access.md](../../contracts/identity-and-access.md): join/mint re-apply visit
  eligibility; create/join rate-limit rows.
- [security-architecture.md](../../architecture/security-architecture.md): credential and audit
  rules (no tokens, no `DAILY_API_KEY`, no PHI); lazy-end on ineligible appointments.
- [ADR-015](../../decisions/ADR-015-rate-limiting-and-api-protection.md) additive policy rows:
  `POST /telehealth/sessions` 20 / 5 min and `POST /telehealth/sessions/:id/join` 30 / 5 min,
  session user, fail open. Keep media-token 30 / 5 min.
- M16 banners in [release-roadmap.md](../../roadmap/release-roadmap.md),
  [product-roadmap.md](../../roadmap/product-roadmap.md),
  [frontend-roadmap.md](../../roadmap/frontend-roadmap.md),
  [backend-roadmap.md](../../roadmap/backend-roadmap.md),
  [post-mvp-baseline.md](../../roadmap/post-mvp-baseline.md),
  [00-master-task-list.md](../00-master-task-list.md), and [AGENTS.md](../../../AGENTS.md).
  Maturity remaining telehealth is chat / recording / Socket.IO **after** M16, not instead of it.

## Out of Scope

- Any application code, migration, or dependency change
- Nest `POST .../leave`, session list API, new `telehealth:*` permissions
- Chat, recording, transcription, Socket.IO
- New ADR (ADR-013 and ADR-015 remain the decisions)
- AWS / hosted `DAILY_API_KEY` injection (M9)

## Requirements

- Server-side eligibility and join-before-mint are authoritative. Frontend checks stay UX only.
- Leave does not change Nest session state. End (`write:appointments`) persists `ended` and
  best-effort deletes the Daily room.
- Meeting tokens and `DAILY_API_KEY` are never written to audit rows, logs, Git, or docs.
- Do not claim HIPAA compliance or production telehealth.

## Acceptance Criteria

- [x] Contract matches the M16 lifecycle: create → waiting; join → `in_session`; mint requires
      `in_session`; leave is Daily-only; end / ineligible / past grace → `ended`
- [x] 502 `MEDIA_UNAVAILABLE` is documented for media-token
- [x] Credential and logging rules restated (no tokens, no `DAILY_API_KEY`, no PHI)
- [x] ADR-015 policy table includes create and join fail-open rows; media-token unchanged
- [x] Roadmaps name M16 without claiming chat/recording as this milestone
- [x] No application code changed; no secrets or PHI in docs

## Dependencies

- Shipped: BE-016, FE-030, SEC-007, BE-019
- Blocks: BE-021, FE-035

## Validation

- Doc review against the lifecycle table and existing `apps/api` telehealth routes

## Risks / Considerations

- Docs-only: no version bump (ADR-007).
- Join-before-mint is a breaking contract change for clients that minted from `waiting`; the
  shipped web client already joins first.

## Implementation notes

Writing this spec is not a version bump. Shipping the docs is not a version bump.

## Completion

Shipped as docs only: telehealth eligibility on get/join/mint, join-before-mint, leave versus end
(no Nest `/leave`), 502 `MEDIA_UNAVAILABLE`, and ADR-015 create/join fail-open rows in
data-contracts, api-endpoints, identity-and-access, security-architecture, and ADR-015. M16
banners on roadmaps, master task list, and AGENTS.md. No version bump (ADR-007).
