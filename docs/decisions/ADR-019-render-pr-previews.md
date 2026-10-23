# ADR-019 — Render pull-request previews

## Status

Proposed

## Decision

The interim Render demo ([ADR-017](ADR-017-interim-render-demo.md),
[ADR-018](ADR-018-render-marketing-static-site.md)) gets per-PR previews for the two frontends
only. This does not replace the AWS preview topology in
[ADR-012](ADR-012-deployment-topology.md) / INFRA-010 and does not close M9.

| Service | PR preview | Data source |
| --- | --- | --- |
| `medconnect-marketing` (static) | Yes, manual | None. Static export. |
| `medconnect-web` | Yes, manual | Frontend mocks (`NEXT_PUBLIC_USE_MOCKS=true`). No API upstream. |
| `medconnect-api` | No | — |
| `medconnect-postgres` | No | — |

- **Mechanism:** Render service previews (`previews.generation: manual` on the two services), not
  Render preview environments. A preview starts only when the PR has the `render-preview` label
  or `[render preview]` in its title. Render deletes it when the PR closes or merges.
- **Mock mode:** a web preview build uses the existing mock layer, with a zero simulated error
  rate. The preview start has no `API_BASE_URL`, so `/mcp-api` answers 503 instead of reaching
  the interviewer API. Previews never read or write the interviewer database.
- **Detection:** the build and start commands select preview behaviour from Render's
  `IS_PULL_REQUEST`. Application code reads only provider-neutral variables (for example
  `NEXT_PUBLIC_USE_MOCKS`), so AWS, Railway or another host only change the deploy config.
- **Deploy gate:** `main` deploys of all three services wait for the GitHub `ci` check
  (`autoDeployTrigger: checksPass`).
- **Plans:** no paid resource. Static previews are free. Web previews use the base service's Free
  plan and share the workspace's free instance hours.

## Rationale

- ADR-018 forbids Render previews against the shared demo database. The demo API is the only API
  on Render and already uses `APP_ENV=preview`, so a "live" web preview would write into the
  interviewer data.
- A separate preview API needs a second database. Render allows one Free Postgres per workspace,
  so that costs money. The owner has not approved a paid plan yet.
- Most PRs that need a human review are visual (marketing pages, Figma parity, layout). The mock
  layer already backs Vitest and Playwright (`e2e:mocks`), so the UI renders fully without a
  backend.
- Live integration stays covered by CI (API tests against a throwaway Postgres) and local
  `e2e:live`.

## Consequences

- A web preview shows mock data, not the live seed. Reviewers must not treat it as an API test.
  The preview UI labels itself (FE-048).
- API, migration and contract changes get no hosted preview. Their review evidence is CI plus
  local live checks. Production merge still deploys only after `ci` passes.
- **Upgrade path (later, paid):** add one shared preview API and one paid preview Postgres,
  separate from the interviewer database, and switch web previews to that API. That matches
  ADR-012's shared-preview shape and needs no application change. It needs its own ADR update.
- ADR-018's line "Do not enable Render preview environments against the shared demo database"
  stays in force. This ADR adds service previews that do not touch that database.
- The Amplify-only text in `.github/workflows/preview-status.yml` and the workflow docs is
  updated to cover the active host.
