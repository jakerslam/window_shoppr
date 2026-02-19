# Security Scanning Baseline

## CI security gates
Security is enforced in `quality-checks.yml` via job `security`:
- `npm run security:check`
- `npm run security:audit-deps`

## Checks included
- Secret scanning (pattern-based): AWS keys, GitHub tokens, Slack tokens, private keys, long inline token-like assignments.
- Static security checks: `eval`, `new Function`, `document.write`.
- Dependency vulnerability scan: `npm audit --audit-level=high --omit=dev`.

## Local run
```bash
npm run security:check
npm run security:audit-deps
```

## Failure policy
Any finding fails CI and blocks merge until remediated or explicitly redesigned.
