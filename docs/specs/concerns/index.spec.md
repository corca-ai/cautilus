# Shared Concerns

This view shows rules that apply across several Cautilus workflows.
Each shared concern has a named page, user-facing attachments, and maintainer evidence routes.
Read this view when checking reviewability, evidence visibility, ownership, vocabulary, packet freshness, or resumability across workflows.

Promise ledger: [Promise Ledger](../model/promise-ledger.spec.md).
Evidence state: [Evidence State](../proof/index.spec.md).

## Shared Concern View

| shared concern | why it exists | user-facing page | maintainer evidence status |
| --- | --- | --- | --- |
| [Reviewable Artifacts](reviewable-artifacts.spec.md) | another person or agent must be able to reopen workflow output | [Reviewable Artifacts](../user/reviewable-artifacts.spec.md) | mapped through evidence-state, reporting, active-run, and optimization routes |
| [Evidence Gaps](evidence-gaps.spec.md) | a candidate or reviewed promise must not become satisfied without valid evidence | [Evidence Gaps](../user/evidence-gaps.spec.md) | mapped through evidence-state and every maintainer page's `Evidence Gaps` section |
| [Host-Owned Execution](host-owned-execution.spec.md) | host repos own runtime-specific behavior while Cautilus owns generic packets and boundaries | [Host Ownership](../user/ownership.spec.md) | mapped through adapter-host, live-invocation, and binary-skill routes |
| [Vocabulary Consistency](vocabulary-consistency.spec.md) | one concept should keep one name across prose, packets, tests, and Cautilus Agent guidance | user index and individual workflow pages | policy exists; dedicated proof is incomplete |
| [Packet Freshness](packet-freshness.spec.md) | readable views must show current packets instead of stale or copied state | reviewable artifacts and evidence gaps pages | mapped through evidence-state and reporting routes |
| [Cost And Proof Freshness](cost-and-proof-freshness.spec.md) | expensive eval and optimize evidence should be shown honestly without pretending it reran | evaluation and optimization pages | mapped through evaluation, optimization, and scenario-history routes |
| [Agent-Human Resumability](agent-human-resumability.spec.md) | users and agents need durable packets, next actions, and source refs instead of chat memory | readiness, claim discovery, host ownership | mapped through binary/skill boundary, active-run, and reporting routes |

## Maintainer View

Maintainer-side shared-concern evidence is mapped through maintainer evidence routes.
The policy is recorded in [Maintainer Shared Concern Policy](../maintainer/concerns-policy.spec.md).
