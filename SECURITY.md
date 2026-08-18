# Security Policy

## Reporting A Vulnerability

Do not include credentials, personal data, exploit details, or unredacted user
content in a public issue.

Use GitHub Private Vulnerability Reporting for this repository when it is
available. Otherwise contact
[@ZhihongWu-dev](https://github.com/ZhihongWu-dev) through the profile first to
agree on a private reporting channel. Provide the affected component, expected
and observed behavior, reproduction conditions, and the minimum redacted logs
needed to investigate.

No response-time or remediation-time commitment is made while Bagu is in active
pre-release development.

## Secrets And User Data

- Never commit `.env` files, CloudBase credentials, provider keys, signing
  material, cookies, access tokens, resumes, analytics exports, or manual
  annotation data.
- Only `EXPO_PUBLIC_` values safe to expose in a shipped client may be placed in
  the Expo environment. Server secrets belong in the deployment platform's
  secret store.
- Use synthetic or deliberately redacted fixtures in tests.
- Revoke and rotate a credential immediately if it is exposed. Removing it in
  a later commit does not remove it from Git history.
