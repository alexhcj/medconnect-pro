---
id: QA-010
type: task
area: qa
feature: deployment
status: implemented
priority: medium
estimate: 1
dependencies: [INFRA-019, INFRA-020]
related_adrs: [ADR-005-synthetic-demo-data.md]
related_docs:
  [
    ../../workflows/delivery-lanes.md,
    ../../workflows/deploy-render.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: false
plane:
  work_item_id: c1af3f26-8611-4ec5-a6c1-48c1dda4ab65
  identifier: MEDCONNECT-135
---

# QA-010 — Preview lanes pilot

## Objective

Run one real PR through each lane and record evidence that previews work and stay isolated from
the interviewer demo.

## Scope

Three small PRs (real fixes from `info.md` where possible):

1. Docs lane: a docs-only change. Expect `ci`, no preview.
2. Marketing lane: a marketing change with the `render-preview` label. Expect a static preview.
3. Web lane: an `apps/web` change with the label. Expect a mock-mode web preview.

For each: preview URL (or none), `ci` result, merge, `main` deploy after `ci`, smoke of the
changed surface.

## Out of Scope

- Load or cost testing; live-API preview (not built)

## Acceptance criteria

- [x] Each lane behaves as `delivery-lanes.md` says (docs PR #6, marketing PR #9, web PRs #8 and #10; one deviation, a web preview built for a marketing-lane version bump, is tracked in INFRA-023; see Completion)
- [x] Web preview: demo-account sign-in works on mocks; `/mcp-api/health` returns 503
  - [x] `/mcp-api/health` returns 503 (PR #8 preview, 2026-10-26; see Completion)
  - [x] demo-account sign-in works on mocks (PR #10 preview, all four demo accounts, owner, 2026-10-31)
- [x] Interviewer API logs show no requests from preview hosts during the pilot (owner, 2026-10-31)
- [x] Free instance hours used by previews during the pilot are recorded (upper bound from preview lifetimes, 2026-10-31; see Completion)
- [x] Any mismatch becomes a doc fix or a new task, listed in Completion (INFRA-023)

## Dependencies

- Blocked by: INFRA-019, INFRA-020. FE-048 is optional.

## Validation

PR links, Render deploy history, and API log excerpts (no secrets) in Completion.

## Implementation notes

Test and docs only. No version bump.

## Completion

- Implementation: complete (2026-10-31). All three lanes ran on real PRs instead of three
  dedicated small PRs: docs #6, marketing #9 (and #10), web #8 and #10. PR #10 is the large M21
  milestone PR, not a small fix.
- Tests: manual only. Evidence below was read on 2026-10-31 from GitHub PR, deployment and Actions
  data and Render deploy history (read-only, workspace `alex_hcj`), plus the `/release-check` live
  smoke.
- PRs: docs lane [#6](https://github.com/alexhcj/medconnect-pro/pull/6), marketing lane
  [#9](https://github.com/alexhcj/medconnect-pro/pull/9), web lane
  [#8](https://github.com/alexhcj/medconnect-pro/pull/8) and
  [#10](https://github.com/alexhcj/medconnect-pro/pull/10).
- Notes:
  - **Docs lane (done, 2026-10-26):** PR #6 changed only task files and a roadmap line. `ci` and
    `api-image` passed, no label and no Render preview was created, it merged as `4a27dbf` at
    07:54:42 UTC, and `ci` on `main` passed at 07:57:50. No deploy was created for
    `medconnect-api`, `-web` or `-marketing` (latest on all three: `e1c4c1a`, FE-049), as
    `delivery-lanes.md` says for the docs lane. Source: GitHub PR and Actions data, Render deploy
    history (read-only, workspace `alex_hcj`). A `ci` run is still required: the docs lane has no
    path filter.
  - **Marketing lane (done, 2026-10-27):** PR #9 (`docs/marketing-sync-0.99.1`, touches
    `apps/marketing`) got the `render-preview` label at 06:31:39 UTC. The static preview
    `https://medconnect-marketing-pr-9.onrender.com` went live at 06:32:47 and rebuilt at 07:13:18.
    It merged as `1b9b02d` at 07:19:20 and the preview went inactive at 07:19:23. `ci` on `main`
    passed; the `medconnect-marketing` deploy `dep-dbg534jbc2fs739rrbsg` started at 07:24:02, after
    `ci` (`checksPass`), and was live at 07:24:52. PR #10 also built
    `https://medconnect-marketing-pr-10.onrender.com` (11:58:10 and 14:13:20 on 2026-10-31).
    Smoke of the changed surface: the 320 px review of the preview URL itself was not recorded at
    the time. On 2026-10-31 the live marketing site at `40d83e3` (PR #10, which contains PR #9) was
    checked at 320 px: `/`, `/about`, `/architecture`, `/security` and `/demo` have a scroll width of
    320 (no horizontal scroll), the sign-in link is `https://medconnectpro.app/login`, and the
    response sets no cookie.
    Deviation: PR #9 also built a web preview (`medconnect-web-pr-9`), because the root
    `package.json` version bump matches the web build filter; `delivery-lanes.md` lists only the
    marketing static site for this lane. Tracked in INFRA-023.
  - **Web lane (done, 2026-10-31):** PR [#8](https://github.com/alexhcj/medconnect-pro/pull/8) (FE-050,
    `apps/web`) built a preview at `https://medconnect-web-pr-8.onrender.com`. Evidence recorded
    2026-10-26 (owner): `GET /mcp-api/health` on that preview returns 503 with
    `{"error":{"code":"SERVICE_UNAVAILABLE","message":"API proxy is not configured"}}`, as
    expected for a preview with no `API_BASE_URL`. Demo-account sign-in on mocks works for all four
    accounts on the PR #10 (M21) web preview `https://medconnect-web-pr-10.onrender.com` (owner,
    2026-10-31). PR #10 merged as `40d83e3` at 15:32:55; `ci` on `main` ran 15:32:57 to 15:39:00
    and passed; the `medconnect-web` deploy `dep-dbj0n63bc2fs73cuk2ng` started at 15:39:04 and was
    live at 15:42:01. PR #8's `main` deploy (`dep-dbfob4ajnfac73cmssi0`, 16:53:37) also followed
    `ci`. Live smoke at `40d83e3` (2026-10-31): `/` redirects to `/login`, `/login` lists the demo
    accounts, API `/health` returns `{"status":"ok"}`, `/ready` returns ready, `/api/docs` returns
    404.
  - **Isolation evidence (done):** the owner confirmed on 2026-10-31 that the interviewer API logs
    show no requests from preview hosts during the pilot.
  - **Free instance hours (recorded as an upper bound, 2026-10-31):** only web previews use instance
    hours; static marketing previews do not. From the GitHub deployment records, the pilot's web
    previews existed for: PR #8 0 h 37 min (16:12:22 to 16:49:17, 2026-10-26), PR #9 0 h 48 min
    (06:31:44 to 07:19:22, 2026-10-27), PR #10 3 h 37 min (11:56:22 to 15:32:57, 2026-10-31):
    about 5.0 h in total. A free service sleeps after 15 minutes idle, so the billed figure is at
    most that. The Render API does not expose instance hours, and the dashboard figures do not
    reconcile (see mismatches); reading the dashboard difference against the baseline below moves
    to INFRA-023.
  - **Baselines before the marketing and web PRs (2026-10-26, owner, Render dashboard):**
    - Monthly included usage, whole workspace: free instance hours 253.37 / 750, pipeline minutes
      38 / 500, bandwidth 416 MB / 5 GB, services 9 / 25, custom domains 4 / 2. The workspace also
      holds four unrelated `safira-*` services, which count toward the same hours pool. After the
      pilot, re-read the same card and record the difference.
    - Latest live deploy of each service is `e1c4c1a` (FE-049): `medconnect-api`
      `dep-dbfe2lp5efls73bt0h40`, `medconnect-web` `dep-dbfe2lp5efls73bt0hd0`,
      `medconnect-marketing` `dep-dbfe2lp5efls73bt0hi0`. The marketing and web lane PRs are
      compared against these.
    - Guard tests passed: `test:render-previews` 22, `test:preview-delivery` 4.
  - **Mismatches (criterion 5)**, each with its doc fix or task:
    - Hours do not reconcile: the billing page lists 292.45 hours each for `medconnect-api` and
      `medconnect-web`, above the 253.37 workspace figure. Probably different counting (wall clock
      vs billed); not explained yet. Task:
      [INFRA-023](../infrastructure/INFRA-023-render-usage-and-preview-filter-follow-ups.md).
    - Custom domains are 4 against 2 included. `deploy-render.md` puts extra names at about $0.25
      per month each, so "no paid resources" may not hold. Task: INFRA-023.
    - A marketing-lane PR that bumps the root version also builds a web preview, because
      `package.json` and `package-lock.json` are in both build filters. Task: INFRA-023.
    - Service previews copy base-service settings at creation, so the `NEXT_PUBLIC_MARKETING_URL`
      entry added to `render.yaml` in PR #8 did not reach its preview (no logo link, no back link
      even after setting the var and rebuilding). Doc fix: `deploy-render.md` "PR previews";
      preview-to-preview links stay unwired (low priority, Render docs silent on `fromService`
      across previews; INFRA-023 records it as a known limitation).
    - The PR template is pasted verbatim by GitHub and was left unfilled. Doc fix: the `/open-pr`
      skill, the "PR body" section in `delivery-lanes.md`, the template and `CLAUDE.md` (this
      branch).
  - **Related checks:** INFRA-020 criterion 1 has a one-week window (2026-10-26 to 2026-11-02);
    the marketing and web merges add `main` pushes to compare against Render deploys. The empty
    commit `1eb0f5c` on `main` matches no build filter, so it is not evidence for the marketing or
    web lanes.
  - Criteria 2 and 3 are ticked on owner evidence (2026-10-31). Criteria 1, 4 and 5 are ticked on
    the 2026-10-31 evidence above; criterion 4 is an upper bound, and the dashboard reading moves
    to INFRA-023.
