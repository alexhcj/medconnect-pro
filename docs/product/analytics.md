---
id: analytics
type: capability-module
name: Analytics
area: dashboard
marketing_path: /platform/analytics
status: partial
claim: "Mock dashboard overview cards only. No live Nest GET /dashboard/overview."
related_tasks: [FE-001]
related_docs:
  - ../01-product-requirements.md
  - ../marketing/capability-matrix.md
  - ../roadmap/post-mvp-baseline.md
  - ../roadmap/frontend-roadmap.md
capabilities:
  - id: analytics.mock-overview-cards
    name: Dashboard overview cards
    status: partial
    demo: mock overview cards on the authenticated dashboard
    public: qualified
    planned_next: live Nest GET /dashboard/overview (frontend Slice 2)
    related_tasks: [FE-001]
  - id: analytics.overview-api
    name: Live dashboard analytics API
    status: planned
    demo: route does not exist
    public: no
    related_tasks: []
---

# Analytics

Mock dashboard overview cards only. Treat the missing Nest overview route as deferred Slice 2,
not as a silent M0–M7 failure. Do not present live practice analytics as shipped.

| ID | Name | Status | Demo | Public |
| --- | --- | --- | --- | --- |
| `analytics.mock-overview-cards` | Dashboard overview cards | partial | mock cards | qualified |
| `analytics.overview-api` | Live dashboard analytics API | planned | no Nest route | no |
