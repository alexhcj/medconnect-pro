# ADR-003 — Authentication

## Status

Accepted

## Decision

Target OAuth 2.0 + OpenID Connect using Authorization Code + PKCE, with MFA and refresh-token
rotation/session controls.

## Rationale

This reflects modern SaaS identity architecture and avoids treating a custom password/JWT flow as
the complete identity solution.

## Demo mode

The frontend may use a mock identity provider/session for demonstration, but mock authentication
must not be described as production identity infrastructure.
