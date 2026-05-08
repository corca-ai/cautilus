# Cost And Proof Freshness Concern

Concern ID: `concern.cost-and-proof-freshness`.

Expensive Cautilus eval and optimize proof should be projected honestly.
Reader-facing reports should distinguish selected evidence, prepared evidence, stale evidence, and newly executed proof.

## Projections

- User-facing attachments: [Behavior Evaluation](../user/evaluation.spec.md), [Bounded Optimization](../user/optimization.spec.md)
- Maintainer routes: [Evaluation Surfaces And Runners](../maintainer/evaluation-surfaces-runners.spec.md), [Optimization Loop](../maintainer/optimization-loop.spec.md), [Scenario History And Proposal Normalization](../maintainer/scenario-history-normalization.spec.md)

## Current Proof

Evaluation and optimization user pages intentionally project selected evidence instead of rerunning costly loops during every report check.
Maintainer pages still call out held-out and end-to-end proof gaps where proof should not be overstated.
The missing checked-in held-out optimize cycle is tracked as `gap.optimize-held-out-cycle` in [Proof Gaps](../proof/gaps.spec.md).
