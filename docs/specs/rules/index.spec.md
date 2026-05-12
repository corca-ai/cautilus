# Cross-Cutting Rules

Read this when you need the rules that apply across several Cautilus workflow steps.
These pages define reviewability, evidence visibility, ownership, vocabulary, freshness, cost, and resumability expectations so they do not get buried inside one workflow story.

Promise ledger: [Promise Ledger](../ledger/promise-ledger.spec.md).
Evidence state: [Evidence State](../evidence/index.spec.md).

## Cross-Cutting Rule View

| cross-cutting rule | why it exists | user-facing page | contract evidence status |
| --- | --- | --- | --- |
| [Reviewable Artifacts](reviewable-artifacts.spec.md) | another person or agent must be able to reopen workflow output | [Reviewable Artifacts](../user/reviewable-artifacts.spec.md) | mapped through evidence-state, reporting, active-run, and improvement routes |
| [Evidence Gaps](evidence-gaps.spec.md) | a candidate or reviewed promise must not become satisfied without valid evidence | [Evidence Gaps](../user/evidence-gaps.spec.md) | mapped through evidence-state and every maintainer page's `Evidence Gaps` section |
| [Host-Owned Execution](host-owned-execution.spec.md) | host repos own runtime-specific behavior while Cautilus owns generic packets and boundaries | [Host Ownership](../user/ownership.spec.md) | mapped through adapter-host, live-invocation, and binary-skill routes |
| [Vocabulary Consistency](vocabulary-consistency.spec.md) | one concept should keep one name across prose, packets, tests, and Cautilus Agent guidance | user index and individual workflow pages | policy exists; dedicated proof is incomplete |
| [Packet Freshness](packet-freshness.spec.md) | readable views must show current packets instead of stale or copied state | reviewable artifacts and evidence gaps pages | mapped through evidence-state and reporting routes |
| [Cost And Proof Freshness](cost-and-proof-freshness.spec.md) | expensive eval and improve evidence should be shown honestly without pretending it reran | evaluation and improvement pages | mapped through evaluation, improvement, and scenario-history routes |
| [Agent-Human Resumability](agent-human-resumability.spec.md) | users and agents need durable packets, next actions, and source-bound review feedback that can become reusable learning evidence instead of chat memory | readiness, claim discovery, host ownership | mapped through evidence-state, binary/skill boundary, active-run, and reporting routes |

## Contracts

Rule evidence is mapped through contract evidence routes.
The policy is recorded in [Contract Cross-Cutting Rule Policy](../contracts/rules-policy.spec.md).
