# Security Headers Runtime Verification

## Goal
Verify that deployed runtime environments return required security headers.

## Script
- Command: `npm run security:headers-runtime`
- Script file: `scripts/check-security-headers-runtime.mjs`

## Required headers checked
- `content-security-policy`
- `referrer-policy`
- `x-content-type-options`
- `x-frame-options`
- `permissions-policy`
- `cross-origin-opener-policy`
- `cross-origin-resource-policy`

## Optional warning
- `strict-transport-security` is reported as a warning when missing.

## CI automation
- Workflow: `.github/workflows/security-headers-runtime.yml`
- Trigger:
  - manual dispatch
  - every 12 hours
- Requires repository secret:
  - `SECURITY_HEADERS_CHECK_URL` (example: `https://window-shoppr.com`)

## Local usage
```bash
SECURITY_HEADERS_CHECK_URL=https://window-shoppr.com SECURITY_HEADERS_CHECK_STRICT=true npm run security:headers-runtime
```
