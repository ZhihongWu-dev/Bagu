# Bagu Analytics CloudBase Function

This directory contains the deployable CloudBase HTTP function for Bagu's anonymous product analytics.

## Runtime

- Node.js 18 or newer
- HTTP function listening on port `9000`
- `@cloudbase/js-sdk` 3.x using the function's current environment identity
- `ws` 8.x, required by the SDK's Node adapter

## Required setup

Create these CloudBase database collections in a development environment:

- `analytics_installations`
- `analytics_events`
- `analytics_deletion_receipts`

Set `ANALYTICS_ADMIN_TOKEN` to a long random server-side secret. Optionally set `ANALYTICS_ALLOWED_ORIGIN` for the web preview origin. Never put the admin token or Tencent Cloud secret keys in the Expo app. Before production use, protect the admin routes with CloudBase administrator authentication, MFA, and gateway access rules in addition to this token.

When deployed inside CloudBase, the SDK reads the current environment automatically. For local database integration only, set `CLOUDBASE_ENV_ID` plus temporary Tencent Cloud credentials in the process environment; never commit them.

Bind the HTTP function at the root of a CloudBase HTTPS access route. Configure the resulting base URL in the Expo build as:

```text
EXPO_PUBLIC_ANALYTICS_BASE_URL=https://your-cloudbase-domain/analytics
```

The client URL is public by design. Each anonymous installation receives a random write token that can only upload events or delete that installation's raw events. The aggregate endpoint requires the separate admin token.

## Endpoints

- `POST /v1/installations`
- `POST /v1/events`
- `DELETE /v1/installations/current`
- `GET /v1/admin/summary`
- `POST /v1/admin/cleanup`
- `GET /health`

Run `npm test` before deployment. Configure a daily scheduled request to `/v1/admin/cleanup` with the admin token, or replace it with a CloudBase timer function using the same repository cleanup operation.
