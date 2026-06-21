---
type: rule
---

# Cost And Proof Freshness

Expensive Cautilus eval and improve evidence should be shown honestly.
Reader-facing reports should distinguish selected evidence, prepared evidence, stale evidence, and newly executed proof.

Key: `rule.cost-and-proof-freshness`.

## Where To Check This

- User-facing attachments: [Behavior Evaluation](../user/evaluation.spec.md), [Bounded Improvement](../user/improvement.spec.md)
- Maintainer evidence routes: [Evaluation Surfaces And Runners](../contracts/evaluation-surfaces-runners.spec.md), [Improvement Loop](../contracts/improvement-loop.spec.md), [Scenario History And Proposal Normalization](../contracts/scenario-history-normalization.spec.md)

## Evidence State

The held-out improve cycle is now proven live on the dev/skill surface: `npm run proof:improve:live` runs a real bounded improve loop that recovers a held-out scenario it was never tuned on, with the operator-witnessed capture under `fixtures/eval/dev/skill/improve/live/` replayed deterministically and projected by [Bounded Improvement](../user/improvement.spec.md).
