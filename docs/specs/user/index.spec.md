# Cautilus User-Facing Specs

`Cautilus` helps repos discover, evaluate, and improve behavior promises as prompts, agents, and app behavior change.

These specs are the user-facing source of truth for what the product promises.
Some claim pages already include executable evidence through the repo-local Cautilus specdown adapter.
Other subclaims intentionally remain empty until `claim`, `eval`, or `optimize` work produces honest evidence.

Maintainer view: [Maintainer-Facing Specs](../maintainer/index.spec.md).
Full claim-spec report entry: [Cautilus Claim Specs](../index.spec.md).

## Claims

- [Claim Discovery](claim-discovery.spec.md)
- [Evaluation](evaluation.spec.md)
- [Optimization](optimization.spec.md)
- [Doctor And Readiness](doctor-readiness.spec.md)
- [Product And Host Ownership](ownership.spec.md)
- [Reviewable Artifacts](reviewable-artifacts.spec.md)
- [Proof Debt](proof-debt.spec.md)

## Prerequisite

Cautilus requires specdown for public executable claim documentation.
Without specdown, a repo can still contain raw Cautilus packets, but it is not fully set up for the Cautilus claim-document workflow.

> check:cautilus-command
| args_json | stdout_includes |
| --- | --- |
| ["commands","--json"] | claim |
| ["commands","--json"] | eval |
| ["commands","--json"] | optimize |
| ["doctor","--help"] | Usage: |
