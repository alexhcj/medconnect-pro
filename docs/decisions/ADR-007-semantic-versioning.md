# ADR-007 — Semantic Versioning

## Status

Accepted

## Decision

The MedConnect Pro application version follows [Semantic Versioning 2.0.0](https://semver.org/).
`package.json` `version` is the canonical source of truth. `package-lock.json` must stay in lockstep
with that value.

Version bumps are performed by the implementing agent (or a human) as part of completing a
shippable change. There is no CI release bot, GitHub Action, or `semantic-release` pipeline.

## 0.x policy

While `MAJOR` is `0`, the public demo API is not treated as stable:

- PATCH for backward-compatible bug fixes and internal refactors with no API/UX contract change.
- MINOR for new capabilities, new public UI/API surfaces, **and** breaking
  contract/auth/security-model changes.
- MAJOR is never applied automatically. `1.0.0` happens only when a human explicitly requests that
  first stable demo release.

After `1.0.0`, standard SemVer applies: breaking → MAJOR, compatible features → MINOR, compatible
fixes → PATCH.

## Scope

This version is the **application/demo artifact**, not HTTP API URL versioning (for example `/v1`).
Breaking API contracts still require a MINOR bump on 0.x (MAJOR after 1.0.0) and must update
`docs/contracts/` in the same change.

## Rationale

The product is a healthcare SaaS demonstration still in initial development. Mapping breaking
changes to MINOR on 0.x avoids premature `1.0.0` while still recording every completed slice.
Agent-owned bumps match the documentation-first, Cursor-driven workflow and avoid introducing
release automation the repository does not yet operate.
