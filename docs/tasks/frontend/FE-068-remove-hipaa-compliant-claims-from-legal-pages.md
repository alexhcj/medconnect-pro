---
id: FE-068
type: task
area: frontend
feature: security
status: shipped
priority: high
estimate: 1
dependencies: []
related_adrs: [ADR-005-synthetic-demo-data.md]
related_docs:
  [
    ../../marketing/capability-matrix.md,
    ../../product/security.md,
    ../qa/QA-014-m22-verification-and-close-audit.md,
  ]
implementation:
  status: complete
validation:
  responsive: false
  accessibility: false
  tests_required: true
plane:
  work_item_id: b5d1d404-d130-4070-80c2-599ea424cbc0
  identifier: MEDCONNECT-168
---

# FE-068 — Remove "HIPAA compliant" claims from the legal pages

## Objective

Make the web app's Terms of Service and Privacy Policy pages stop claiming HIPAA compliance, production
encryption or signed business associate agreements that this synthetic demo does not have.

## Context

The QA-014 wording sweep (2026-11-10) found these claims in `apps/web/src/app`:

- `terms-of-service/page.tsx`: a "HIPAA Compliant" heading (line 68), "AES-256 encryption and secure
  infrastructure" (74), "secure databases with row-level security, and regular security audits" (126), "VPC
  with private subnets" (159).
- `privacy-policy/page.tsx`: "With HIPAA-compliant service providers who assist in our operations" (226),
  "Virtual Private Cloud (VPC) with private subnets and network isolation" (287), "All third-party vendors who
  have access to PHI on our behalf have signed HIPAA-compliant Business..." (403), and "Healthcare SaaS Platform
  - HIPAA Compliant" (524).

The project rules say the demo is synthetic, is not HIPAA compliant or certified, and must not claim to be
([project-context.md](../../../.claude/rules/project-context.md), [security.md](../../../.claude/rules/security.md),
the "Not allowed" list in the [capability matrix](../../marketing/capability-matrix.md)). AWS production is paused,
so VPC, private subnet and AES-256 statements also describe infrastructure that is not deployed.

## Scope

- Audit both pages (and any other legal or policy page under `apps/web/src/app`) for compliance, encryption,
  certification, BAA and infrastructure claims, and list each one in Completion with its decision.
- Reword or remove each claim so it matches the capability matrix: a synthetic demo, demonstrated engineering
  patterns, no real patient data, no HIPAA compliance or certification claim.
- Keep the page structure and legal-page links; change copy only.
- Add a test that fails when these pages contain "HIPAA compliant", "HIPAA-compliant" or "HIPAA certified".

## Out of Scope

- Writing real legal terms or a real privacy policy.
- Marketing site pages (the sweep found none there).
- Changing infrastructure or security behaviour.

## Requirements

- Synthetic-demo wording only; no claim the demo is suitable for real patient data.
- Do not put "secure", "private" or "end-to-end" in claims about the product (SEC-013 wording rule applies to
  telehealth; keep the same discipline here).

## Acceptance Criteria

- [x] Every listed claim is reworded or removed, with the decision recorded in Completion
- [x] The two pages say plainly that this is a synthetic demo with no real patient data
- [x] A unit test asserts none of the forbidden phrases appear on either page
- [x] `docs/marketing/capability-matrix.md` still holds (no new claim; only the synced-release line changed)
- [x] CHANGELOG and version (ADR-007)

## Dependencies

- None. Found by QA-014.

## Validation

`npm run lint:web`, `npm run type-check:web`, `npm run test:web`, and a read of both pages in the browser.

## Risks / Considerations

- These pages may be linked from sign-up and the footer; check that the links still work after rewording.
- Legal-page wording is a project-owner decision; propose copy, do not invent policy terms.

## Versioning

After 1.0.0: copy fix → PATCH.

## Roadmap

Standalone, found by the QA-014 wording sweep. Not part of M22.

## Completion

Implemented 2026-11-13 at 1.6.4. Lint, type-check and the new spec pass. Both pages were read in the browser pane (all Terms sections open, all eight privacy tabs): no forbidden phrase, no console errors. The only "Covered Entity" is the negation "is not a Covered Entity".

Decisions (T = terms-of-service, P = privacy-policy):

| Claim | Decision |
| --- | --- |
| T intro "HIPAA acknowledgment"; P overview and notice "in compliance with HIPAA" | Reworded: synthetic demo, no compliance or certification claim |
| T "HIPAA Compliant" card, "Full compliance"; P subtitle "HIPAA Compliant" | Replaced with "Synthetic demo" / "MedConnect Pro demo - synthetic data only" |
| T "AES-256" (card, safeguards, encryption list); P TDE card | Removed; production encryption listed as planned, not deployed |
| T and P TLS 1.3 and "Certificate pinning" | Removed (security rules forbid presenting pinning as a feature) |
| T "VPC with private subnets", "AWS S3 with SSE-KMS"; P VPC and SSE-KMS cards | Removed; AWS production is paused |
| T "row-level security, regular security audits" | Kept RLS (true, shipped); dropped audits |
| T "enterprise-grade", multi-factor and access reviews; P penetration testing, background checks, monitoring | Removed or restated as the labelled mock MFA and planned items |
| T "99.9% uptime" | Replaced with no uptime commitment |
| P "HIPAA-compliant service providers", BAAs signed | Replaced: no BAAs, no real patient data shared |
| P "Covered Entity", Privacy/Security Rule compliance, breach notification commitments | Replaced with a demo notice, modelled patterns and a no-real-data statement |
| P JWT card | Replaced with mock IdP sessions and HttpOnly cookies |
| P HHS OCR complaint details (Q3) | Removed |
| P/T contact block, footer name and address (Q2) | Left unchanged by decision |

Files: both pages, `apps/web/src/app/legal-pages-wording.test.tsx` (source scan for forbidden phrases plus render
checks for the synthetic-demo notice). Page structure, section ids and tabs are unchanged. No other legal pages exist
under `apps/web/src/app`; no links to these routes exist in the app. Capability matrix and `docs/product/` rows are
unchanged. The negated wording uses "does not claim HIPAA compliance" so the forbidden-phrase test stays literal.
