---
id: analytics
type: capability-module
name: Analytics
area: dashboard
marketing_path: /platform/analytics
status: partial
claim: "Live dashboard overview cards from Nest GET /dashboard/overview. Mock fixtures when mocks are on. Synthetic demo aggregates only; not a warehouse or HIPAA analytics product."
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
    status: shipped
    demo: live Nest overview cards on the authenticated dashboard; fixture cards when NEXT_PUBLIC_USE_MOCKS=true
    public: qualified
    planned_next: extra chart widgets remain unscheduled
    related_tasks: [FE-001, FE-024]
  - id: analytics.overview-api
    name: Live dashboard analytics API
    status: shipped
    demo: Nest GET /dashboard/overview aggregates the session tenant; UI consumes it in live mode
    public: no
    related_tasks: [DATA-002, BE-011, FE-024]
---

# Analytics

Live dashboard overview cards in the authenticated app from Nest `GET /dashboard/overview`
([BE-011](../tasks/backend/BE-011-dashboard-overview-api.md),
[FE-024](../tasks/frontend/FE-024-live-dashboard-overview.md)). Mock mode still renders fixture
cards. Synthetic demo aggregates only. Do not claim a warehouse, HIPAA analytics, live video, or
payments.

| ID | Name | Status | Demo | Public |
| --- | --- | --- | --- | --- |
| `analytics.mock-overview-cards` | Dashboard overview cards | shipped | live Nest cards; fixtures when mocks on | qualified |
| `analytics.overview-api` | Live dashboard analytics API | shipped | Nest GET + live UI | no |
