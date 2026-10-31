---
id: INFRA-022
type: task
area: infrastructure
feature: development-foundation
status: implemented
priority: medium
estimate: 2
dependencies: []
related_adrs: []
related_docs:
  [
    ../../architecture/frontend-architecture.md,
    ../../architecture/backend-architecture.md,
    ../../architecture/api-architecture.md,
    ../../architecture/data-architecture.md,
    ../../architecture/security-architecture.md,
    ../../architecture/infrastructure-architecture.md,
    ../../README.md,
    ../../../README.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: false
plane:
  work_item_id: 2f374432-026c-4214-a585-63a23fa452ff
  identifier: MEDCONNECT-155
---

# INFRA-022 — Architecture overview, request lifecycle and ADR index

## Objective

Give a reviewer three entry points into the system: a one-page overview, one request traced end to
end, and an index of every architectural decision with its main tradeoff.

## Context

An audit on 2026-10-31 at 0.103.3 found that `docs/architecture/` has six area docs (frontend,
backend, API, data, security, infrastructure) but no system overview and no end-to-end data-flow
doc, and that `docs/decisions/` holds ADR-001 to ADR-019 with no index or tradeoff summary.
`README.md` and `docs/README.md` link the folders and a hand-picked subset of ADRs. FE-055 shipped
the public marketing `/architecture` page; this task is the repository-side counterpart.

## Scope

1. `docs/architecture/README.md`: system overview with one mermaid diagram covering the marketing
   site, web app, Nest API, PostgreSQL with RLS, the demo OIDC adapter (Google / Fake), Daily,
   Render (current) vs AWS (planned), and mock vs live mode. A short summary and link for each of
   the six area docs.
2. `docs/architecture/request-lifecycle.md`: one request traced end to end: browser → HttpOnly
   cookie session → Nest guards (identity → tenant → role → permission → resource) → service →
   TypeORM with RLS as `medconnect_app` → audit event → response DTO → TanStack Query. Include the
   mock-mode path (`NEXT_PUBLIC_USE_MOCKS`) and one write example (document upload or role change).
3. `docs/decisions/README.md`: ADR index for ADR-001 to ADR-019 with status, a one-line decision
   and the main tradeoff for each.
4. Link the three docs from `README.md` and `docs/README.md`.

## Out of Scope

- Editing any ADR.
- Duplicating implementation detail or OpenAPI schemas; link to sources instead.
- A "Key decisions / tradeoffs" section on the marketing `/architecture` page
  (`marketing-architecture-copy.ts`). That may be proposed as a separate change; it would need
  approval, a `docs/marketing/capability-matrix.md` "Architecture page" note and a version bump.
- Fixing stale statements found in area docs (list them as follow-ups instead).

## Requirements

- Every claim links to its source: an ADR, area doc, contract or code path.
- No claim that the demo is HIPAA compliant or certified; planned items (AWS, production MFA,
  OIDC as the production login) are labelled planned.
- ADR status in the index matches each ADR's own `## Status` section verbatim.
- If an area doc, ADR and code disagree, name the conflict in Completion; do not silently resolve it.

## Acceptance Criteria

- [x] `docs/architecture/README.md` exists with one mermaid diagram showing all elements in Scope 1
      and links to all six area docs
- [x] `docs/architecture/request-lifecycle.md` covers the live read path, the mock path and one
      write path, each step linked to its source
- [x] `docs/decisions/README.md` lists ADR-001 to ADR-019 with status, decision and tradeoff
- [x] `README.md` and `docs/README.md` link all three docs
- [x] `npm run docs:marketing-sync` passes
- [x] No ADR decision changed and no version bump (ADR-019 status line updated with user approval, see Notes)

## Dependencies

- None. Related: FE-055 (marketing `/architecture` page), INFRA-017 (README presentation pack).

## Validation

Render the mermaid diagram in GitHub (or a mermaid preview). Run `npm run docs:marketing-sync`.
Confirm `git diff --stat` touches no `docs/decisions/ADR-*` file and no `package.json` version.

## Risks / Considerations

- Overview docs drift from code; link rather than copy to keep them cheap to maintain.
- Area docs may already be stale in places; record findings as follow-ups.
- Docs only: no version bump unless the optional marketing change is approved and shipped with it.

## Completion

- Implementation: Added `docs/architecture/README.md` (system map: marketing, web with mock and
  `/mcp-api` proxy, Nest, PostgreSQL + RLS, Google/Fake OIDC, Daily, Render current vs AWS planned;
  current-vs-planned table; summary of the six area docs), `docs/architecture/request-lifecycle.md`
  (live patient-list read with sequence diagram, role-change write with audit, API-only document
  upload note, mock path) and `docs/decisions/README.md` (ADR-001 to ADR-019 with status, decision,
  tradeoff, groups). Linked from `README.md` (Architecture section and docs table) and
  `docs/README.md` (architecture and decisions entries). No version bump (docs only, ADR-007).
- Tests: `tests_required` is false. `npm run docs:marketing-sync` passed. Both mermaid diagrams
  parsed and rendered with mermaid 11.4.1. A relative-link check found no broken links in the three
  new docs. No `package.json` change; the only ADR change is the approved ADR-019 status line.
- PR:
- Notes: Role change is the write example because document upload has no web caller
  (`medical-api.ts` lists documents only). Conflicts found: (1) ADR-019 `## Status` said "until those ship…" although INFRA-019 and INFRA-020
  had shipped; fixed with user approval (status now says both have shipped; decision unchanged).
  (2) `api-architecture.md` Flow listed DTO validation before authorization, but Nest runs guards
  first; fixed with user approval (guards, interceptors, validation, controller, service) and linked
  to the lifecycle doc. (3) ADR-003 (target) and ADR-014 (demo
  implementation) do not mark each other superseded; the index explains the relation.
  Also found: `data-architecture.md` "Supporting stores" (Redis, S3, KMS) does not label them
  planned; `docs/README.md` links a missing `sitemap.md` (pre-existing).
