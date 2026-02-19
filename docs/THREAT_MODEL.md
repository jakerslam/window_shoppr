# Threat Model

## Assets
- user accounts and session state
- moderation queues and admin commands
- affiliate links and payout attribution

## Trust Boundaries
- browser client vs backend APIs
- agent/admin privileged command boundary
- third-party affiliate/network endpoints

## Threats
- account/session abuse
- moderation command misuse
- submission spam and malicious content
- supply-chain compromise

## Mitigations
- RBAC + high-risk action safeguards
- CSRF/origin/rate-limit controls
- immutable audit trail for privileged commands
- CI security and dependency scans

## Open Risks
- upload malware scanning pending upload feature activation
- backend token/cookie migration finalization

## Review Owner
- Security owner: TBD (assign before launch)
