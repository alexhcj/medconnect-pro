### Flow

Requirements
      ↓
Architecture
      ↓
ADR
      ↓
Implementation Task
      ↓
AI implementation plan
      ↓
Human review
      ↓
Small code generation
      ↓
Tests
      ↓
Diff review
      ↓
Version bump (see docs/workflows/versioning.md)
      ↓
Commit

### Example

You say:

Implement Patient List vertical slice.

Cursor should read:

Technical Implementation Tasks
Frontend Architecture
Backend Architecture
Patient types
Auth/RBAC
existing API patterns

Then you ask:

Don't modify files yet. Analyze the existing repository and propose the implementation plan.

Then:

Implement only step 1: backend Patient entity + migration.

Then test.

Then:

Implement GET /patients.

Then test.

Then:

Implement React Query hook.

Then:

Implement UI.