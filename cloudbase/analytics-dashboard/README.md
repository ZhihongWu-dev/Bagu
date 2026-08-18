# Bagu Private Analytics Dashboard

This static dashboard reads only the aggregate admin endpoint. It does not expose installation IDs or raw event timelines, and it keeps the admin token only in page memory.

Host it behind administrator authentication and MFA. Configure the API function's `ANALYTICS_ALLOWED_ORIGIN` to this dashboard origin. Do not publish the dashboard as a public site and do not embed the admin token in these files.
