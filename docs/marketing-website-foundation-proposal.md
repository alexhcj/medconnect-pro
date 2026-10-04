# Marketing Website Foundation — planning brief

This file is **planning input** for [FE-017](../tasks/frontend/FE-017-marketing-website-foundation.md),
not a task spec and not a second source of truth. FE-017 is implemented. Later M8 contracts
[FE-018](../tasks/frontend/FE-018-design-system-and-visual-language.md) through
[FE-023](../tasks/frontend/FE-023-marketing-polish-and-product-visuals.md) are also implemented.
Canonical marketing
docs are [requirements.md](marketing/requirements.md), [sitemap.md](marketing/sitemap.md),
[docs/product/](product/README.md), and
[capability-matrix.md](marketing/capability-matrix.md). Current product claims must follow
[post-mvp-baseline.md](roadmap/post-mvp-baseline.md).
Deployment/preview is a later milestone, not M8.

Use this brief only as historical FE-017 planning input. M8 implementation contracts
FE-018–FE-023 are shipped.

---

# Cursor Plan Mode Requirements — Marketing Website Foundation

## Objective

Generate an implementation plan for the **Marketing Website Foundation** milestone for `medconnect-pro`.

The goal is to establish the structural foundation for the public-facing marketing website without implementing the complete marketing site or all feature pages yet.

This milestone should prepare the project for the subsequent marketing design and page implementation work.

---

## Planning Rules

Before creating the plan:

1. Read the current project documentation and Cursor rules.
2. Inspect the current roadmap and milestone/task structure.
3. Inspect the completed MVP milestone and its latest milestone-audit/reconciliation results.
4. Inspect the current Next.js App Router structure and existing route groups.
5. Inspect existing shared UI components, layout components, styling, design tokens, utilities, and providers.
6. Inspect the current frontend/backend integration boundaries.
7. Identify what already exists and can be reused.
8. Do not assume that something is missing merely because it appears in the original roadmap.
9. Do not redesign or replace existing architecture unless the current implementation creates a concrete conflict with the marketing requirements.
10. Do not modify code or documentation while in Plan Mode.
11. Do not generate implementation code.
12. Clearly distinguish:

* already implemented infrastructure;
* reusable existing functionality;
* required additions;
* architectural decisions that need confirmation;
* items intentionally deferred to later marketing tasks.

---

# Product Context

`medconnect-pro` is a portfolio/demo healthcare SaaS application intended to demonstrate production-oriented frontend, backend, architecture, security, UX, and engineering practices.

The marketing website should present the application as a coherent healthcare platform while remaining accurate about implementation status.

The site must not imply that the project is a certified HIPAA-compliant production healthcare system.

Use qualified language where appropriate, such as:

* security-focused architecture;
* privacy-by-design principles;
* healthcare-oriented workflows;
* synthetic/demo data;
* portfolio/demo implementation.

Do not introduce unsupported compliance claims.

---

# Marketing Website Direction

The marketing website should communicate:

* what MedConnect is;
* which healthcare workflows it supports;
* who the platform is intended for;
* how the major modules work together;
* the product's UX/design philosophy;
* security/privacy-oriented engineering principles;
* how the application can be explored through the demo.

The visual direction should feel like a modern healthcare SaaS product rather than a generic startup landing page.

Priorities:

* clarity;
* trust;
* restrained visual language;
* professional healthcare aesthetic;
* strong information hierarchy;
* accessibility;
* responsive behavior;
* realistic product UI previews;
* consistency with the application design system.

The marketing experience should be visually spacious.

The authenticated dashboard/application can remain information-dense and workflow-oriented.

Marketing and application UI should share foundational design tokens/primitives where appropriate, but they should not be forced into one identical layout system.

---

# Proposed Marketing Sitemap

Treat the following as the current proposed information architecture, but validate it against the existing repository and MVP audit before finalizing the plan.

## Initial marketing scope

* `/` — Home
* `/platform` — Platform overview
* `/security` — Security / privacy-oriented architecture
* `/about` — About the project
* `/demo` — Product/demo entry point

## Future detailed platform pages

* `/platform/patient-management`
* `/platform/appointments`
* `/platform/telehealth`
* `/platform/billing`
* `/platform/analytics`
* `/platform/administration`

Do not implement all detailed feature pages in this milestone.

The foundation should make those pages easy to add later without restructuring the marketing architecture.

---

# Proposed Route Architecture

Evaluate whether the existing App Router supports a structure similar to:

```text
app/
├── (marketing)/
│   ├── page.tsx
│   ├── platform/
│   │   └── page.tsx
│   ├── security/
│   │   └── page.tsx
│   ├── about/
│   │   └── page.tsx
│   └── demo/
│       └── page.tsx
│
├── (auth)/
│   └── ...
│
└── (dashboard)/
    └── ...
```

Do not blindly adopt this structure.

First determine whether:

* an equivalent route group already exists;
* the current application layout structure conflicts with it;
* metadata/providers need special handling;
* authentication/dashboard layouts must remain isolated;
* existing middleware behavior needs consideration.

The marketing layout should not inherit authenticated dashboard-specific UI.

---

# Marketing Layout Foundation

Determine the appropriate shared marketing layout architecture.

The plan should consider:

* marketing header/navigation;
* responsive/mobile navigation;
* footer;
* page container;
* typography hierarchy;
* spacing system;
* CTA patterns;
* marketing-specific layout primitives;
* global metadata;
* SEO foundations;
* accessibility requirements;
* responsive breakpoints;
* reusable page sections.

Do not prematurely create a large design-system abstraction.

Prefer a small set of reusable components that have clear reuse cases.

---

# Shared Marketing Components

Evaluate and propose a component structure similar in concept to:

```text
components/
└── marketing/
    ├── layout/
    │   ├── MarketingHeader
    │   ├── MarketingFooter
    │   └── MobileNavigation
    │
    ├── sections/
    │   ├── Hero
    │   ├── FeatureGrid
    │   ├── ProductPreview
    │   ├── Workflow
    │   ├── Security
    │   └── CTA
    │
    └── feature/
        └── FeaturePageLayout
```

This is only a structural reference.

Inspect the existing component architecture first and determine:

* what should be reused;
* what should be created;
* what belongs in shared UI;
* what should remain marketing-specific;
* whether an existing component already provides the required behavior.

Avoid duplicate versions of existing primitives.

---

# Homepage Foundation

The foundation should support a homepage with the following conceptual sections:

1. Hero / primary value proposition
2. Platform/module overview
3. Connected healthcare workflow
4. Product UI previews
5. Healthcare UX/design principles
6. Security/privacy-oriented principles
7. Intended practice roles
8. Demo CTA / final conversion section

Do not fully implement these sections unless required by existing project structure.

For this milestone, determine the reusable structural primitives and layout patterns required to support them.

---

# Platform Page Foundation

The `/platform` page should eventually provide a high-level overview of the product modules.

Major conceptual areas:

* Patient Management
* Appointments & Scheduling
* Telehealth
* Billing
* Analytics
* Administration

The architecture should make it possible to later add dedicated feature pages without duplicating layout logic.

Consider whether a reusable feature-page structure should support:

```text
Hero
↓
Capabilities
↓
Product Preview
↓
Workflow
↓
Related Modules
↓
CTA
```

Do not implement detailed feature content in this milestone unless the current repository requires minimal examples to validate the architecture.

---

# Design-System Relationship

Inspect the current UI/design system implementation.

Determine how the marketing layer should consume:

* typography;
* spacing;
* colors;
* borders;
* radii;
* shadows;
* icons;
* buttons;
* form primitives;
* responsive breakpoints;
* existing UI components.

The plan must avoid creating a second independent design system.

However, identify cases where marketing-specific composition/layout components are justified.

The future approved design should be able to become the visual source of truth for implementation.

---

# Figma / Pencil Compatibility

The project will later use design exploration and approved design artifacts.

The implementation plan should therefore make the marketing architecture easy to map to:

* Figma frames;
* Figma components;
* design tokens;
* responsive variants;
* reusable page sections.

Figma should be treated as the eventual canonical approved design source.

Pencil may be used for exploration/prototyping but should not create a second independent implementation architecture.

Do not add Figma/Pencil-specific runtime dependencies unless there is an actual implementation requirement.

---

# SEO / Metadata Foundation

Evaluate the current Next.js metadata implementation and identify the minimum foundation needed for marketing pages.

Consider:

* page titles;
* descriptions;
* Open Graph metadata;
* Twitter/social metadata if appropriate;
* canonical URLs;
* sitemap;
* robots;
* semantic HTML;
* heading hierarchy.

Do not over-engineer SEO at this stage.

The plan should distinguish foundation work from later content/SEO optimization.

---

# Accessibility

The foundation must support WCAG 2.1 AA-oriented implementation.

At minimum, account for:

* semantic landmarks;
* keyboard navigation;
* visible focus states;
* sufficient contrast;
* accessible navigation;
* heading hierarchy;
* meaningful link/button semantics;
* responsive behavior;
* reduced-motion considerations where relevant;
* mobile navigation accessibility.

Do not treat accessibility as a later cleanup task.

---

# Responsive Strategy

The marketing architecture should support:

* desktop;
* tablet;
* mobile.

The plan should identify which layout patterns require explicit responsive behavior.

Do not create separate mobile/desktop implementations unless technically justified.

---

# Existing Application Boundaries

Preserve the separation between:

```text
Marketing
Auth
Authenticated application/dashboard
API/backend
```

The marketing website should not require authentication.

The marketing layer should not introduce unnecessary coupling to dashboard state.

If the demo page links into the authenticated application, identify the appropriate existing authentication/demo mechanism instead of inventing a new one.

---

# Content / Capability Accuracy

Inspect the current implementation and documentation before proposing marketing claims.

Identify any features that are:

* implemented;
* partially implemented;
* planned;
* conceptual only.

The marketing architecture should allow content to distinguish these states where necessary.

Do not invent feature functionality merely to make the marketing website appear complete.

---

# Architecture Decisions Required in the Plan

The final plan must explicitly address:

1. Where the marketing route group should live.
2. Whether a dedicated marketing layout is required.
3. How marketing components should integrate with the existing component architecture.
4. Which existing UI primitives can be reused.
5. Which new marketing-specific primitives/components are justified.
6. How marketing styling/design tokens should relate to the existing design system.
7. How marketing pages should coexist with `(auth)` and `(dashboard)` route groups.
8. What metadata/SEO foundation already exists and what is missing.
9. Whether sitemap/robots infrastructure already exists.
10. What should be implemented in this foundation milestone versus deferred.
11. Any risks or architectural conflicts discovered during repository inspection.

---

# Testing / Validation Expectations

The plan should identify appropriate validation for the foundation.

Consider:

* route rendering;
* responsive behavior;
* navigation behavior;
* accessibility;
* lint/typecheck;
* existing test strategy;
* production build;
* metadata validation.

Do not automatically introduce a new testing framework.

Use the project's existing testing strategy and identify gaps only where necessary.

---

# Documentation Expectations

Determine which existing documentation should be updated after implementation.

Potential documentation areas include:

* marketing sitemap;
* route structure;
* frontend architecture;
* design system;
* roadmap/task documentation;
* README;
* architecture documentation.

Do not create duplicate documentation if an existing source-of-truth document should be extended instead.

---

# Task/Milestone Relationship

This is a foundation milestone.

The implementation plan should clearly distinguish between:

### This milestone

Marketing architecture/foundation.

### Later milestones/tasks

* Figma/Pencil design exploration;
* approved visual design;
* homepage implementation;
* platform overview;
* detailed feature pages;
* security page;
* about page;
* demo page;
* marketing responsive/accessibility refinement;
* screenshots/product-preview assets;
* deployment/production presentation.

Do not silently expand this task into implementation of the entire marketing website.

---

# Expected Plan Output

Produce a structured implementation plan containing:

## 1. Current-state findings

Summarize the relevant existing architecture discovered in the repository.

## 2. MVP/roadmap alignment

Identify whether the proposed marketing foundation conflicts with the current roadmap or completed MVP.

Clearly distinguish real gaps from intentionally deferred work.

## 3. Architecture proposal

Describe the recommended route/layout/component architecture.

## 4. Files to add

List proposed new files and explain their responsibilities.

## 5. Files to modify

List existing files that should change and why.

Do not propose modifications without inspecting the file first.

## 6. Reusable existing components

Identify existing components that should be reused rather than duplicated.

## 7. Deferred work

Explicitly list work that should NOT be included in this milestone.

## 8. Validation strategy

Describe how the implementation should be validated.

## 9. Documentation impact

Identify documentation that should be updated.

## 10. Risks / decisions

Identify architectural uncertainties that should be resolved before implementation.

## 11. Recommended implementation order

Provide a dependency-aware implementation sequence.

---

## Important Constraint

This is **Plan Mode only**.

Do not modify files.

Do not implement the marketing website.

Do not generate production code.

Do not create the Figma/Pencil designs yet.

Do not invent missing requirements.

The purpose of this plan is to establish a clean, reusable marketing foundation that can subsequently receive an approved Figma/Pencil design and then be implemented incrementally.
