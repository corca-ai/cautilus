# Cautilus User-Facing Specs

`Cautilus` helps repos discover, evaluate, and improve behavior promises as prompts, agents, and app behavior change.

These specs are the user-facing source of truth for what the product promises.
Some claim pages already include executable evidence through the repo-local Cautilus specdown adapter.
Other proof remains visible as explicit evidence gaps until `claim`, `eval`, or `optimize` work produces honest evidence.

Maintainer view: [Maintainer-Facing Specs](../maintainer/index.spec.md).
Full claim-spec report entry: [Cautilus Claim Specs](../index.spec.md).

## Claims

- U1: [Claim Discovery](claim-discovery.spec.md)
- U2: [Evaluation](evaluation.spec.md)
- U3: [Optimization](optimization.spec.md)
- U4: [Doctor And Readiness](doctor-readiness.spec.md)
- U5: [Product And Host Ownership](ownership.spec.md)
- U6: [Reviewable Artifacts](reviewable-artifacts.spec.md)
- U7: [Proof Debt](proof-debt.spec.md)

Read this index first when judging the product story.
Each U-claim page states a user promise, the subclaims that make it concrete, and either attached evidence or an explicit evidence gap.

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
| ["doctor","--repo-root","."] | specdown_available |
