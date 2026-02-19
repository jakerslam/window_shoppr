# Supply-Chain Hardening

- Lockfile is required (`package-lock.json`).
- Dependency audit runs in CI (`npm audit --audit-level=high --omit=dev`).
- Secret/static security scan runs in CI before build.
- Update cadence:
  - security updates: within 72h
  - routine dependency review: weekly
