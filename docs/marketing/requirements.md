# Marketing website requirements

What the public marketing site communicates. Implementation contracts are
[FE-018](../tasks/frontend/FE-018-design-system-and-visual-language.md) through
[FE-023](../tasks/frontend/FE-023-marketing-polish-and-product-visuals.md). Route map:
[sitemap.md](sitemap.md). Honest feature status: [capability-matrix.md](capability-matrix.md).
Product claims must follow [post-mvp-baseline.md](../roadmap/post-mvp-baseline.md) and
[00-project-spec.md](../00-project-spec.md).

[marketing-website-foundation-proposal.md](../marketing-website-foundation-proposal.md) remains
planning input for shipped [FE-017](../tasks/frontend/FE-017-marketing-website-foundation.md). It
is not the contract for remaining M8 work.

## Purpose

The marketing website presents MedConnect Pro as a coherent healthcare-oriented practice platform
while remaining accurate about implementation status. It supports portfolio, interview, and
potential-client conversations. It is not a certified production healthcare system.

## What the site must communicate

- What MedConnect Pro is (portfolio/demo SaaS, synthetic data only).
- Which practice workflows it supports and how modules connect.
- Who it is for (practice roles in the demo: practice admin, provider, nurse, receptionist,
  patient; plus super-admin as a platform role).
- UX direction: professional healthcare SaaS, restrained visual language, trust, clarity.
- Security- and privacy-oriented engineering patterns used in the demo.
- How a visitor enters the existing mock demo (`/demo` → `/login`).

## Visual direction

- Modern healthcare SaaS, not a generic startup landing page.
- Marketing is visually spacious; the authenticated dashboard stays information-dense.
- Shared design tokens and primitives with the application; not a second layout system
  ([ADR-011](../decisions/ADR-011-figma-canonical-visual-source.md)).
- Product UI is the primary marketing visual. AI concepts may bootstrap; final assets come from
  the real application (FE-023).

## Claim rules

Use qualified language: security-focused architecture, privacy-by-design principles,
healthcare-oriented workflows, synthetic/demo data, portfolio/demo implementation.

Do not claim HIPAA certification or compliance, production OAuth / OIDC, live video / Daily /
WebRTC, hosted payments, or that the public demo is a production deployment.

## Page intents

| Page | Purpose |
| --- | --- |
| Home | Communicate product value and introduce core modules |
| Platform | Show the complete feature map |
| Patient Management | Patient records, profiles, vitals, documents, search |
| Scheduling | Calendar, appointments, provider availability |
| Telehealth | Virtual sessions and related workflows (session shell) |
| Billing | Claims, payments, and billing workflows (honest boundaries) |
| Analytics | Dashboard metrics, charts, notifications (honest status) |
| Administration | Users, roles, permissions, practice settings (honest status) |
| Security | Implemented security controls and design principles |
| About | Project, architecture, and portfolio context |
| Demo | Safe demo entry or walkthroughs |
| Sign In | Enter the application via existing `/login` (not a marketing route) |

## Feature-page structure

Reusable structure for `/platform/*` pages (FE-021):

1. Hero — what the module does and who benefits
2. Key capabilities
3. Product walkthrough — screenshots, interactive preview, or short demo
4. Workflow — how the module fits the platform
5. Related modules
6. CTA — explore the demo or return to `/platform`

## Accessibility and responsive behavior

WCAG 2.1 AA-oriented: semantic landmarks, keyboard navigation, visible focus, contrast, heading
hierarchy, accessible mobile navigation. Desktop, tablet, and mobile. Marketing must not inherit
the dashboard shell or session gate.

## Out of scope for marketing copy

Do not invent product functionality to make the site appear complete. Deployment, preview
environments, and CI/CD are a later milestone, not M8.
