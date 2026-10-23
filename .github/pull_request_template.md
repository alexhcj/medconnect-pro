## Task

- Task ID (title starts with it, e.g. `FE-048 …`):
- Plane identifier (e.g. `MEDCONNECT-133`):
- Lane ([delivery-lanes.md](../docs/workflows/delivery-lanes.md)): docs / marketing / web UI / API-data-security / infra-CI / full stack

## Preview

- [ ] Preview needed (marketing or web UI): added the `render-preview` label
- [ ] No preview needed (docs, API, infra)

Web previews run on mock data, not the live API.

## Versioning (ADR-007)

- [ ] No bump (docs only, plan only, or no shipped change)
- [ ] PATCH
- [ ] MINOR
- Version: `x.y.z` → `x.y.z`

## Checklist

- [ ] `ci` is green
- [ ] Task file, roadmap crosswalk, `AGENTS.md` "Current:" line and master task list updated
- [ ] `CHANGELOG.md` entry added when the version changed
- [ ] `docs/product/` and the capability matrix updated if a user-facing capability changed
- [ ] No secrets and no real PHI
