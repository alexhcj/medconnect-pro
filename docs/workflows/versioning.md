# Versioning Workflow

Application versioning follows [ADR-007](../decisions/ADR-007-semantic-versioning.md) and
[Semantic Versioning 2.0.0](https://semver.org/). `package.json` `version` is canonical.

This version is the **application/demo artifact**, not HTTP API URL versioning (for example `/v1`).
Breaking API contracts still bump MINOR while `MAJOR` is `0` (MAJOR after `1.0.0`) and must update
[`docs/contracts/`](../contracts/) in the same change.

## Flow

```text
Completed change
  → classify patch | minor | (major only if >=1.0.0 or explicit 1.0.0)
  → bump package.json + lockfile
  → add CHANGELOG entry
  → mention version in the PR/completion notes
```

1. Confirm the change is complete and shippable (not plan-only, WIP, formatting-only, or docs that
   do not ship a product change).
2. Classify impact. If mixed, use the highest mapped bump.
3. Increment `package.json` and the root `version` in `package-lock.json`, or run
   `npm version <patch|minor|major> --no-git-tag-version`.
4. Prepend a Keep a Changelog section in `CHANGELOG.md`: `## [x.y.z] - YYYY-MM-DD` with Added /
   Changed / Fixed / Breaking as applicable.
5. Record old → new version and the rationale in completion notes or the PR.
6. Do not create git tags or commits unless explicitly requested.

## Classification

| Change | While `MAJOR == 0` | After `1.0.0` |
| --- | --- | --- |
| Backward-compatible bug fix, internal refactor with no API/UX contract change | PATCH | PATCH |
| New capability, new public UI/API surface, or breaking contract/auth/security-model change | MINOR | MINOR for compatible features; MAJOR for breaking |
| First stable demo release | Never automatic — only when a human asks to ship `1.0.0` | then strict SemVer |

## Ownership

The implementing agent (or a human) performs the bump. There is no CI release bot.
