# Release Workflow

1. Validate tasks and acceptance criteria.
2. Confirm `CHANGELOG.md` matches shipped changes and `package.json` version. `1.0.0` requires
   explicit human approval; later releases follow [versioning.md](versioning.md).
3. Run lint.
4. Type-check.
5. Unit/integration/API tests.
6. E2E critical workflows.
7. Build frontend/backend.
8. Dependency/security scan.
9. Review migration and rollback implications.
10. Verify environment configuration.
11. Verify synthetic demo data.
12. Deploy to development/staging.
13. Smoke test.
14. Production approval only when the project is actually being deployed to production.
