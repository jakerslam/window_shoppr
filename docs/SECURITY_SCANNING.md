# Security Scanning Baseline

## CI security gates
Security is enforced in `quality-checks.yml` via job `security`:
- `npm run security:check`
- `npm run security:audit-deps`

Runtime verification is enforced via workflow `security-headers-runtime.yml`:
- `npm run security:headers-runtime`

## Checks included
- Secret scanning (pattern-based): AWS keys, GitHub tokens, Slack tokens, private keys, long inline token-like assignments.
- Static security checks: `eval`, `new Function`, `document.write`.
- Dependency vulnerability scan: `npm audit --audit-level=high --omit=dev`.
- Runtime security headers verification against deployed environment.

## Local run
```bash
npm run security:check
npm run security:audit-deps
npm run security:headers-runtime
```

## Failure policy
Any finding fails CI and blocks merge until remediated or explicitly redesigned.
