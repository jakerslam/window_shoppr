# Release Strategy Hardening

## Environments
- Local: developer validation (`lint`, `test`, `build`).
- Staging: pre-release deploy + smoke checks.
- Production: gated deployment after staging success.

## Release workflow
1. Merge to `main` with required CI checks green.
2. Trigger staging release workflow (`workflow_dispatch`).
3. Run smoke checks against generated artifact.
4. Promote same commit to production release.
5. If regression detected, roll back to previous stable commit and re-run smoke checks.

## Checklist
See `/docs/RELEASE_CHECKLIST.md` and complete every item before production promotion.

## Rollback policy
- Rollback trigger: any SEV-1/SEV-2 release regression.
- Rollback action: redeploy last known good commit.
- Verification: run `npm run release:smoke` on rollback artifact.

## Automation hooks
- CI job: `release-smoke`
- Script: `/scripts/release-smoke.mjs`
