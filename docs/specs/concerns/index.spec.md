# Cross-Cutting Concerns

This lens asks a different question of the same Cautilus promise model:
which concerns constrain several workflows, and where are those constraints visible in user-facing prose, maintainer proof routes, packets, and tests?

Cross-cutting concerns are not primary workflow stories and not a third audience.
They are concern-first projections over the [canonical promise model](../model/index.spec.md).
Canonical ledger: [Promise Ledger](../model/promise-ledger.spec.md).
Proof view: [Proof View](../proof/index.spec.md).

## Current Concern Lens

| concern | why it exists | user-facing projection | maintainer projection status |
| --- | --- | --- | --- |
| [Reviewable Artifacts](reviewable-artifacts.spec.md) | another person or agent must be able to reopen workflow output | [Reviewable Artifacts](../user/reviewable-artifacts.spec.md) | mapped through evidence-state, reporting, active-run, and optimization routes |
| [Evidence Gaps](evidence-gaps.spec.md) | a candidate or reviewed promise must not become satisfied without valid evidence | [Evidence Gaps](../user/evidence-gaps.spec.md) | mapped through evidence-state and every maintainer page's `Evidence Gaps` section |
| [Host-Owned Execution](host-owned-execution.spec.md) | host repos own runtime-specific behavior while Cautilus owns generic packets and boundaries | [Host Ownership](../user/ownership.spec.md) | mapped through adapter-host, live-invocation, and binary-skill routes |
| [Vocabulary Consistency](vocabulary-consistency.spec.md) | one concept should keep one name across prose, packets, tests, and Cautilus Agent guidance | user index and individual workflow pages | policy exists; dedicated proof is incomplete |
| [Packet Freshness](packet-freshness.spec.md) | readable views must project current packets instead of stale or copied state | reviewable artifacts and evidence gaps pages | mapped through evidence-state and reporting routes |
| [Cost And Proof Freshness](cost-and-proof-freshness.spec.md) | expensive eval and optimize proof should be projected honestly without pretending it reran | evaluation and optimization pages | mapped through evaluation, optimization, and scenario-history routes |
| [Agent-Human Resumability](agent-human-resumability.spec.md) | users and agents need durable packets, next actions, and source refs instead of chat memory | readiness, claim discovery, host ownership | mapped through binary/skill boundary, active-run, and reporting routes |

## Known Structure Gap

Maintainer-facing concern pages are not split out yet.
Until that happens, maintainer-side concern proof lives inside maintainer contract pages.
The concrete expected-failing check is tracked as `gap.maintainer-concern-pages` in [Proof Gaps](../proof/gaps.spec.md).
