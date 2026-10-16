# Render demo note

Interim public demo for interviews. This is not a `1.0.0` release and it does not close M9 or M18.

## Verified deploy

- Application version: 0.91.0
- Commit: `c6c79b7f8b9b84b31caa915d97a4a1c7281412f1`
- Application: https://medconnectpro.app
- Marketing site: https://marketing.medconnectpro.app
- API health: https://api.medconnectpro.app/health

Checked on 2026-10-16. `/login` shows the four synthetic demo accounts and states that provider sign-in is not configured. The provider button is absent.

## Limits

- Free web services sleep after about 15 minutes without traffic. The first request can be slow.
- The Free Postgres database expires on 2026-11-13.
- Uploaded documents disappear when the free API service sleeps, restarts, or redeploys.
- Daily video works only when the operator has set `DAILY_API_KEY`. Otherwise the session shell says media is unavailable.
- Provider sign-in is not configured on the public demo.
- All records are synthetic. This demo is not HIPAA certified.

Demo accounts and the MFA nurse code `135790` are the existing synthetic fixtures, listed in the repository README.
