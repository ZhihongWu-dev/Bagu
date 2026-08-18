# Bagu CloudBase Components

This directory contains the opt-in anonymous product analytics backend:

- `analytics-api`: CloudBase HTTP function and aggregate API
- `analytics-dashboard`: private, aggregate-only administrator dashboard
- `resume-analysis-api`: optional, separately consented resume parsing boundary

## Activation order

1. Create a development CloudBase environment and the three collections listed in `analytics-api/README.md`.
2. Deploy `analytics-api` as an HTTP function and confirm `/health` returns `200`.
3. Protect the dashboard and admin routes with administrator authentication, MFA, gateway rules, and a server-side `ANALYTICS_ADMIN_TOKEN`.
4. Set `EXPO_PUBLIC_ANALYTICS_BASE_URL` only for development builds, test consent/upload/withdrawal/deletion, then enable it for production builds.
5. Schedule the 90-day cleanup endpoint daily and verify its result.

Until step 4 is complete, the Expo app remains fully offline and does not create an analytics identity or upload analytics events.
