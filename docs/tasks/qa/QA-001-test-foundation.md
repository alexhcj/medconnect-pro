---
id: QA-001
type: task
area: qa
feature: test-foundation
status: planned
priority: high
estimate: 2
dependencies: [BE-001]
related_adrs: [ADR-008-frontend-testing-stack.md]
related_docs: [frontend-architecture.md,backend-architecture.md,../workflows/frontend-testing.md]
plane:
  work_item_id: null
  identifier: null
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
- [ ] Backend/Nest unit, integration, and API test runner (deferred until BE-001)

## Implementation notes

Keep tests deterministic and isolated. Frontend stack is Vitest + Playwright (ADR-008). Do not
introduce Jest. Backend test infrastructure waits on the NestJS platform.

## Completion

- Implementation: Frontend Vitest/Playwright configs, scripts, and conventions. Backend remaining.
- Tests: FE-001 unit/component coverage plus dashboard shell E2E on Chromium.
- PR:
- Notes: Overall task stays open until BE-001 enables Nest/API tests.
