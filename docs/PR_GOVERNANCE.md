# PR Governance Policy

This policy defines merge controls for `main`.

## Required Repository Settings (GitHub)
Apply these in **Settings -> Branches -> Branch protection rules** for `main`.

### Protection rules
- Require a pull request before merging: **enabled**
- Required approvals: **1** (minimum)
- Dismiss stale pull request approvals when new commits are pushed: **enabled**
- Require review from Code Owners: **enabled**
- Require approval of the most recent reviewable push: **enabled**
- Require status checks to pass before merging: **enabled**
- Require branches to be up to date before merging: **enabled**
- Include administrators: **enabled**
- Allow force pushes: **disabled**
- Allow deletions: **disabled**

## Required Status Checks
Mark these jobs as required from `Quality Checks` workflow:
- `lint`
- `typecheck`
- `unit`
- `integration`
- `coverage`
- `build`
- `e2e`

Optional but recommended required check:
- `audit` from `Accessibility Audit`

## Ownership and Review Policy
- `CODEOWNERS` is authoritative for ownership mapping.
- At least one code owner approval is required for files covered by ownership rules.
- PRs that touch auth, agent ingestion, analytics, or workflow config require owner review.

## PR Submission Standard
Every PR must:
- use `.github/pull_request_template.md`
- reference the active SRS requirement id
- include local validation evidence (commands + results)
- include rollback notes for non-trivial behavior changes

## Enforcement Notes
Some controls (branch protection, required checks) are GitHub settings and cannot be fully enforced by source files alone. This document is the source of truth for those settings.
