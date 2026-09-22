---
id: QA-001
type: task
area: qa
feature: test-foundation
status: implemented
priority: high
estimate: 2
dependencies: [BE-001]
related_adrs: [ADR-008-frontend-testing-stack.md]
related_docs: [frontend-architecture.md,backend-architecture.md,../workflows/frontend-testing.md]
plane:
  work_item_id: 8760d286-04f0-46c1-b7fa-6a5a0f4d91dd
  identifier: MEDCONNECT-33
---

# QA-001 — Test foundation

## Objective

Establish deterministic test conventions for frontend/backend.

## Scope

Unit, integration, API and E2E configuration.

## Technical constraints

- Follow the project architecture.
- Preserve tenant and authorization boundaries.
- Use synthetic demo data only.
- Follow accessibility and responsive requirements.
- Do not introduce unnecessary dependencies.

## Acceptance criteria

- [x] Frontend test commands work (Vitest + Playwright)
- [x] Synthetic fixtures exist
- [x] Frontend critical-path test conventions documented
- [x] No real PHI in fixtures
- [x] Backend/Nest unit, integration, and API test runner

## Implementation notes

Keep tests deterministic and isolated. Frontend stack is Vitest + Playwright (ADR-008). Do not
introduce Jest. Backend tests use Vitest in `apps/api` (Nest 12 default).

## Completion

- Implementation: Frontend Vitest/Playwright configs, scripts, and conventions. Nest/Vitest runner
  in `apps/api` (`npm run test:api`) from BE-001.
- Tests: FE-001 unit/component coverage plus dashboard shell E2E on Chromium. API platform HTTP
  tests in `apps/api/test`.
- PR:
- Notes: Frontend and backend test runners are in place. Domain/API contract coverage continues in
  BE-002 and QA-002+.
