---
id: analytics
type: capability-module
name: Analytics
area: dashboard
marketing_path: /platform/analytics
status: partial
claim: "Mock dashboard overview cards in the app. Nest GET /dashboard/overview exists; UI wiring is FE-024."
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
    status: shipped
    demo: Nest GET /dashboard/overview aggregates the session tenant
    public: no
    planned_next: M10 FE-024 live dashboard cards
    related_tasks: [DATA-002, BE-011, FE-024]
---

# Analytics

Mock dashboard overview cards in the authenticated app. Nest `GET /dashboard/overview` exists
([BE-011](../tasks/backend/BE-011-dashboard-overview-api.md)). Do not present live dashboard cards
as shipped until [FE-024](../tasks/frontend/FE-024-live-dashboard-overview.md).

| ID | Name | Status | Demo | Public |
| --- | --- | --- | --- | --- |
| `analytics.mock-overview-cards` | Dashboard overview cards | partial | mock cards | qualified |
| `analytics.overview-api` | Live dashboard analytics API | shipped | Nest GET exists; UI still mock | no |
