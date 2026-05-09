# Evidence Map

This page maps Cautilus promises and shared concerns to the current durable evidence routes.
Completeness is handled by [Proof Gaps](gaps.spec.md).
The human name comes first; compact keys are included for packets and checks.

## Evidence Routes

| evidence route | key | supports | where to inspect | state |
| --- | --- | --- | --- | --- |
| Readiness CLI | `evidence.readiness-cli` | [Readiness](../model/readiness.spec.md), [Vocabulary Consistency](../concerns/vocabulary-consistency.spec.md) | [Readiness](../user/doctor-readiness.spec.md), [Readiness And Runtime Status](../maintainer/readiness-runtime-status.spec.md) | current |
| Claim Discovery Fixtures | `evidence.claim-discovery-fixtures` | [Claim Discovery](../model/claim-discovery.spec.md), [Reviewable Artifacts](../concerns/reviewable-artifacts.spec.md), [Evidence Gaps](../concerns/evidence-gaps.spec.md) | [Claim Discovery](../user/claim-discovery.spec.md), [Claim Discovery Workflow](../maintainer/claim-discovery-workflow.spec.md) | open gap |
| Evaluation Selected Evidence | `evidence.evaluation-selected` | [Behavior Evaluation](../model/evaluation.spec.md), [Packet Freshness](../concerns/packet-freshness.spec.md), [Cost And Proof Freshness](../concerns/cost-and-proof-freshness.spec.md) | [Behavior Evaluation](../user/evaluation.spec.md), [Evaluation Surfaces And Runners](../maintainer/evaluation-surfaces-runners.spec.md) | selected |
| Optimization Packets | `evidence.optimization-packets` | [Bounded Optimization](../model/optimization.spec.md), [Reviewable Artifacts](../concerns/reviewable-artifacts.spec.md), [Cost And Proof Freshness](../concerns/cost-and-proof-freshness.spec.md) | [Bounded Optimization](../user/optimization.spec.md), [Optimization Loop](../maintainer/optimization-loop.spec.md) | open gap |
| Host Boundary | `evidence.host-boundary` | [Host-Owned Execution](../concerns/host-owned-execution.spec.md) | [Host Ownership](../user/ownership.spec.md), [Adapter And Host Ownership](../maintainer/adapter-host-ownership.spec.md), [Live Invocation Runtime](../maintainer/live-invocation-runtime.spec.md) | open gap |
| Review Artifact Rendering | `evidence.review-artifact-rendering` | [Reviewable Artifacts](../concerns/reviewable-artifacts.spec.md), [Packet Freshness](../concerns/packet-freshness.spec.md), [Agent-Human Resumability](../concerns/agent-human-resumability.spec.md) | [Evidence State And Review Artifacts](../maintainer/evidence-state-artifacts.spec.md), [Reporting And Review Variants](../maintainer/reporting-review-variants.spec.md), [Active Run And Workspace Lifecycle](../maintainer/active-run-workspace.spec.md) | current |
| Review Learning Packet Builder | `evidence.review-learning-packet-builder` | [Agent-Human Resumability](../concerns/agent-human-resumability.spec.md), [Reviewable Artifacts](../concerns/reviewable-artifacts.spec.md), [Packet Freshness](../concerns/packet-freshness.spec.md) | [Review Learning](../../contracts/review-learning.md), [Evidence State And Review Artifacts](../maintainer/evidence-state-artifacts.spec.md), [Reporting And Review Variants](../maintainer/reporting-review-variants.spec.md), [Binary And Skill Boundary](../maintainer/binary-skill-boundary.spec.md) | current |

```run:shell
# Verify evidence map can reach the ledger and gap view.
test -f docs/specs/model/promise-ledger.spec.md
test -f docs/specs/proof/gaps.spec.md
```
