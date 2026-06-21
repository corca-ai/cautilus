# Cautilus Promise Ledger

<!-- GENERATED — do not edit by hand. Source: the typed Specdown trace graph in specdown.json. Regenerate: npm run specdown:ledger. -->

This page is generated from the typed Specdown trace graph in `specdown.json`.
Each promise's governing cross-cutting rules and implementing contracts are derived from the `governed-by::` and `implemented-by::` edges on its leaf spec, so this map cannot drift from the edges that `specdown trace -strict` enforces.

## Promise Map

| Promise | Governed by (rules) | Implemented by (contracts) |
| --- | --- | --- |
| [Readiness](../promises/doctor-readiness.spec.md) | [Evidence Gaps](../rules/evidence-gaps.spec.md), [Vocabulary Consistency](../rules/vocabulary-consistency.spec.md), [Agent-Human Resumability](../rules/agent-human-resumability.spec.md), [Host-Owned Execution](../rules/host-owned-execution.spec.md) | [Readiness And Runtime Status](../contracts/readiness-runtime-status.spec.md), [Adapter And Host Ownership](../contracts/adapter-host-ownership.spec.md) |
| [Claim Discovery](../promises/claim-discovery.spec.md) | [Reviewable Artifacts](../rules/reviewable-artifacts.spec.md), [Evidence Gaps](../rules/evidence-gaps.spec.md), [Agent-Human Resumability](../rules/agent-human-resumability.spec.md), [Host-Owned Execution](../rules/host-owned-execution.spec.md) | [Claim Discovery Workflow](../contracts/claim-discovery-workflow.spec.md), [Evidence State And Review Artifacts](../contracts/evidence-state-artifacts.spec.md), [Binary And Skill Boundary](../contracts/binary-skill-boundary.spec.md) |
| [Behavior Evaluation](../promises/evaluation.spec.md) | [Reviewable Artifacts](../rules/reviewable-artifacts.spec.md), [Packet Freshness](../rules/packet-freshness.spec.md), [Cost And Proof Freshness](../rules/cost-and-proof-freshness.spec.md), [Host-Owned Execution](../rules/host-owned-execution.spec.md) | [Evaluation Surfaces And Runners](../contracts/evaluation-surfaces-runners.spec.md), [Reporting And Review Variants](../contracts/reporting-review-variants.spec.md), [Live Invocation Runtime](../contracts/live-invocation-runtime.spec.md) |
| [Bounded Improvement](../promises/improvement.spec.md) | [Reviewable Artifacts](../rules/reviewable-artifacts.spec.md), [Evidence Gaps](../rules/evidence-gaps.spec.md), [Cost And Proof Freshness](../rules/cost-and-proof-freshness.spec.md), [Host-Owned Execution](../rules/host-owned-execution.spec.md) | [Improvement Loop](../contracts/improvement-loop.spec.md), [Scenario History And Proposal Normalization](../contracts/scenario-history-normalization.spec.md), [Active Run And Workspace Lifecycle](../contracts/active-run-workspace.spec.md) |
| [Reviewable Artifacts](../promises/reviewable-artifacts.spec.md) | [Reviewable Artifacts](../rules/reviewable-artifacts.spec.md), [Packet Freshness](../rules/packet-freshness.spec.md) | [Evidence State And Review Artifacts](../contracts/evidence-state-artifacts.spec.md), [Reporting And Review Variants](../contracts/reporting-review-variants.spec.md), [Active Run And Workspace Lifecycle](../contracts/active-run-workspace.spec.md) |
| [Host Ownership](../promises/ownership.spec.md) | [Host-Owned Execution](../rules/host-owned-execution.spec.md), [Vocabulary Consistency](../rules/vocabulary-consistency.spec.md), [Agent-Human Resumability](../rules/agent-human-resumability.spec.md) | [Adapter And Host Ownership](../contracts/adapter-host-ownership.spec.md), [Live Invocation Runtime](../contracts/live-invocation-runtime.spec.md), [Binary And Skill Boundary](../contracts/binary-skill-boundary.spec.md) |
| [A Testable Agent](../promises/a-testable-agent.spec.md) | — | — |

## Cross-Cutting Rule Coverage

Reverse view: which promises each cross-cutting rule governs (derived from the same `governed-by::` edges).

| Cross-cutting rule | Governs promises |
| --- | --- |
| [Agent-Human Resumability](../rules/agent-human-resumability.spec.md) | Readiness, Claim Discovery, Host Ownership |
| [Cost And Proof Freshness](../rules/cost-and-proof-freshness.spec.md) | Behavior Evaluation, Bounded Improvement |
| [Evidence Gaps](../rules/evidence-gaps.spec.md) | Readiness, Claim Discovery, Bounded Improvement |
| [Host-Owned Execution](../rules/host-owned-execution.spec.md) | Readiness, Claim Discovery, Behavior Evaluation, Bounded Improvement, Host Ownership |
| [Packet Freshness](../rules/packet-freshness.spec.md) | Behavior Evaluation, Reviewable Artifacts |
| [Reviewable Artifacts](../rules/reviewable-artifacts.spec.md) | Claim Discovery, Behavior Evaluation, Bounded Improvement, Reviewable Artifacts |
| [Vocabulary Consistency](../rules/vocabulary-consistency.spec.md) | Readiness, Host Ownership |

