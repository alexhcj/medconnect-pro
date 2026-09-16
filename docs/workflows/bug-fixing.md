# Bug Fixing Workflow

1. Reproduce.
2. Determine affected boundary.
3. Identify regression or incorrect assumption.
4. Create/locate task.
5. Add a regression test where practical.
6. Fix the smallest correct layer.
7. Validate adjacent workflows.
8. Check security/accessibility implications.
9. Update documentation if the fix reveals a contract or architectural issue.
10. Apply a PATCH version bump and changelog entry per [versioning.md](versioning.md) after the
    fix is verified (MINOR if the fix ships a breaking contract change on 0.x).
11. Close task only after verification.
