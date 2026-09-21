# Postman

Postman is the primary interactive API client for MedConnect Pro. It **consumes** generated OpenAPI;
it is not a competing API definition.

A paid Postman plan or cloud workspace is not required. Import files from this repository locally.

Canonical workflow: [docs/workflows/api-contract-workflow.md](../docs/workflows/api-contract-workflow.md).

```text
postman/
├── collections/     Exported collections (after OpenAPI exists)
├── environments/    Committed templates; no tokens
└── README.md
```

## Collection naming

Import the generated spec as **MedConnect Pro API**.

Do not hand-author a full collection of domain routes from
[`docs/contracts/api-endpoints.md`](../docs/contracts/api-endpoints.md). Those routes are not
implemented yet. `collections/` stays empty until `apps/api/openapi/openapi.json` exists (BE-002).
Health and readiness can be called against `{{baseUrl}}` without a collection.

## Environments

| File | `baseUrl` |
| --- | --- |
| `environments/local.postman_environment.json` | `http://localhost:3001` |
| `environments/demo.postman_environment.json` | `https://api.example.invalid` (replace when a demo host exists) |

Variables:

- `baseUrl` — origin only, no trailing slash
- `accessToken` — empty in Git; set locally for authenticated calls

Copy a template to `*.local.json` (gitignored) if you store a personal token.

## Import (when OpenAPI exists)

1. Generate `apps/api/openapi/openapi.json` (BE-002).
2. Postman → Import → that file.
3. Select the local or demo environment.
4. Collection auth: Bearer Token = `{{accessToken}}`.
5. After later contract changes, import again. Postman does not auto-sync with Git.

## Security

- Never commit access tokens, passwords, or API keys
- Never include real patient data in examples or tests
- Do not disable backend auth to simplify Postman
- This demo is not HIPAA certified
