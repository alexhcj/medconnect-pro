---
id: analytics
type: capability-module
name: Analytics
area: dashboard
marketing_path: /platform/analytics
status: partial
claim: "Mock dashboard overview cards only. No live Nest GET /dashboard/overview."
related_tasks: [FE-001, DATA-002, BE-011, FE-024]
related_docs:
  - ../01-product-requirements.md
  - ../marketing/capability-matrix.md
  - ../roadmap/post-mvp-baseline.md
  - ../roadmap/frontend-roadmap.md
  - ../roadmap/release-roadmap.md
capabilities:
  - id: analytics.mock-overview-cards
    name: Dashboard overview cards
    status: partial
    demo: mock overview cards on the authenticated dashboard
    public: qualified
    planned_next: live Nest GET /dashboard/overview (M10 FE-024)
    related_tasks: [FE-001, FE-024]
  - id: analytics.overview-api
    name: Live dashboard analytics API
    status: planned
    demo: route does not exist
    public: no
    planned_next: M10 BE-011 (seed DATA-002)
    related_tasks: [DATA-002, BE-011, FE-024]
---

# Analytics

Mock dashboard overview cards only. Treat the missing Nest overview route as **M10**
([BE-011](../tasks/backend/BE-011-dashboard-overview-api.md),
[FE-024](../tasks/frontend/FE-024-live-dashboard-overview.md)), not as a silent M0–M7 failure.
Do not present live practice analytics as shipped until those tasks complete.

| ID | Name | Status | Demo | Public |
| --- | --- | --- | --- | --- |
| `analytics.mock-overview-cards` | Dashboard overview cards | partial | mock cards | qualified |
| `analytics.overview-api` | Live dashboard analytics API | planned | no Nest route | no |
