# Product And Host Ownership

Cautilus owns the common evaluation workflow; the host repo owns the behavior being evaluated.

## User Promise

Cautilus standardizes claim, eval, optimize, readiness, and evidence packets without secretly taking over a repo's app, prompts, runners, credentials, or policy.

## Subclaims

- Host repos own prompts, model choices, credentials, runtime wiring, and acceptance policy.
- Cautilus-owned packets make the workflow reviewable across repos.
- Adapter-owned commands keep host behavior explicit instead of hiding it inside product logic.
- The same product workflow can be reused across repos because repo-specific behavior lives in adapters and fixtures.

## Evidence

Evidence is pending.
This page should later link adapter contract checks and at least one consumer-repo proof that Cautilus can evaluate a host-owned runner without importing host-specific logic into the product.
