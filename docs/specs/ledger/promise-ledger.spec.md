# Cautilus Promise Ledger

This ledger names the current Cautilus promises and cross-cutting rules.
The names are the reader-facing addresses.
Compact keys mirror those names for packets, tables, and checks.

Model index: [Promise Ledger](index.spec.md).
View guide: [How The Views Relate](how-views-relate.spec.md).
Evidence state: [Evidence State](../evidence/index.spec.md).

## Workflow Promises

- [Readiness](readiness.spec.md): Cautilus shows whether the selected repo is ready for a bounded workflow and what setup remains.
- [Claim Discovery](claim-discovery.spec.md): Cautilus turns selected source docs into source-referenced candidate claims and proof-planning work.
- [Behavior Evaluation](evaluation.spec.md): Cautilus evaluates intentful behavior across supported `dev` and `app` surfaces.
- [Bounded Improvement](improvement.spec.md): Cautilus improves a selected behavior target under explicit budget, protected checks, and held-out evidence.

## Workflow Audit Matrix

| promise | key | commitment | user workflow | maintainer evidence routes | cross-cutting rules |
| --- | --- | --- | --- | --- | --- |
| [Readiness](readiness.spec.md) | `promise.readiness` | A user can tell whether Cautilus can operate in the selected repo and what setup is missing before spending workflow budget. | [Readiness](../user/doctor-readiness.spec.md) | [Readiness And Runtime Status](../contracts/readiness-runtime-status.spec.md), [Adapter And Host Ownership](../contracts/adapter-host-ownership.spec.md) | [Evidence Gaps](../rules/evidence-gaps.spec.md), [Vocabulary Consistency](../rules/vocabulary-consistency.spec.md), [Agent-Human Resumability](../rules/agent-human-resumability.spec.md), [Host-Owned Execution](../rules/host-owned-execution.spec.md) |
| [Claim Discovery](claim-discovery.spec.md) | `promise.claim-discovery` | A user can scan selected source docs into broad source-referenced candidates and leave curation, likely false negatives, and proof planning visible. | [Claim Discovery](../user/claim-discovery.spec.md) | [Claim Discovery Workflow](../contracts/claim-discovery-workflow.spec.md), [Evidence State And Review Artifacts](../contracts/evidence-state-artifacts.spec.md), [Binary And Skill Boundary](../contracts/binary-skill-boundary.spec.md) | [Reviewable Artifacts](../rules/reviewable-artifacts.spec.md), [Evidence Gaps](../rules/evidence-gaps.spec.md), [Agent-Human Resumability](../rules/agent-human-resumability.spec.md), [Host-Owned Execution](../rules/host-owned-execution.spec.md) |
| [Behavior Evaluation](evaluation.spec.md) | `promise.evaluation` | A user can evaluate intentful behavior across supported `dev` and `app` surfaces when deterministic tests alone do not explain the behavior. | [Behavior Evaluation](../user/evaluation.spec.md) | [Evaluation Surfaces And Runners](../contracts/evaluation-surfaces-runners.spec.md), [Reporting And Review Variants](../contracts/reporting-review-variants.spec.md), [Live Invocation Runtime](../contracts/live-invocation-runtime.spec.md) | [Reviewable Artifacts](../rules/reviewable-artifacts.spec.md), [Packet Freshness](../rules/packet-freshness.spec.md), [Cost And Proof Freshness](../rules/cost-and-proof-freshness.spec.md), [Host-Owned Execution](../rules/host-owned-execution.spec.md) |
| [Bounded Improvement](improvement.spec.md) | `promise.improvement` | A user can improve a selected behavior target while preserving intent, explicit budget, protected checks, held-out evidence, and reviewable revision artifacts. | [Bounded Improvement](../user/improvement.spec.md) | [Improvement Loop](../contracts/improvement-loop.spec.md), [Scenario History And Proposal Normalization](../contracts/scenario-history-normalization.spec.md), [Active Run And Workspace Lifecycle](../contracts/active-run-workspace.spec.md) | [Reviewable Artifacts](../rules/reviewable-artifacts.spec.md), [Evidence Gaps](../rules/evidence-gaps.spec.md), [Cost And Proof Freshness](../rules/cost-and-proof-freshness.spec.md), [Host-Owned Execution](../rules/host-owned-execution.spec.md) |

## Cross-Cutting Rules

| cross-cutting rule | key | commitment | user attachments | maintainer evidence routes |
| --- | --- | --- | --- | --- |
| [Reviewable Artifacts](../rules/reviewable-artifacts.spec.md) | `rule.reviewable-artifacts` | Workflow output remains reopenable as machine-readable packets and readable reports. | [Reviewable Artifacts](../user/reviewable-artifacts.spec.md) | [Evidence State And Review Artifacts](../contracts/evidence-state-artifacts.spec.md), [Reporting And Review Variants](../contracts/reporting-review-variants.spec.md), [Active Run And Workspace Lifecycle](../contracts/active-run-workspace.spec.md) |
| [Evidence Gaps](../rules/evidence-gaps.spec.md) | `rule.evidence-gaps` | Missing or weak evidence stays visible until the claim is proven, narrowed, deferred, or removed. | [Evidence Gaps](../user/evidence-gaps.spec.md) | [Evidence State And Review Artifacts](../contracts/evidence-state-artifacts.spec.md), [Improvement Loop](../contracts/improvement-loop.spec.md), [Readiness And Runtime Status](../contracts/readiness-runtime-status.spec.md) |
| [Host-Owned Execution](../rules/host-owned-execution.spec.md) | `rule.host-owned-execution` | Host repos own prompts, models, credentials, runtime wiring, fixtures, and acceptance policy while Cautilus owns generic workflow packets and boundaries. | [Host Ownership](../user/ownership.spec.md) | [Adapter And Host Ownership](../contracts/adapter-host-ownership.spec.md), [Live Invocation Runtime](../contracts/live-invocation-runtime.spec.md), [Binary And Skill Boundary](../contracts/binary-skill-boundary.spec.md) |
| [Vocabulary Consistency](../rules/vocabulary-consistency.spec.md) | `rule.vocabulary-consistency` | One concept keeps one name across user prose, maintainer specs, packets, tests, and Cautilus Agent guidance. | [Readiness](../user/doctor-readiness.spec.md), [Claim Discovery](../user/claim-discovery.spec.md), [Host Ownership](../user/ownership.spec.md) | [Binary And Skill Boundary](../contracts/binary-skill-boundary.spec.md), [Adapter And Host Ownership](../contracts/adapter-host-ownership.spec.md), [Evidence State And Review Artifacts](../contracts/evidence-state-artifacts.spec.md) |
| [Packet Freshness](../rules/packet-freshness.spec.md) | `rule.packet-freshness` | Readable views show current packets and source artifacts rather than stale copied state. | [Reviewable Artifacts](../user/reviewable-artifacts.spec.md), [Evidence Gaps](../user/evidence-gaps.spec.md), [Behavior Evaluation](../user/evaluation.spec.md) | [Evidence State And Review Artifacts](../contracts/evidence-state-artifacts.spec.md), [Reporting And Review Variants](../contracts/reporting-review-variants.spec.md), [Active Run And Workspace Lifecycle](../contracts/active-run-workspace.spec.md) |
| [Cost And Proof Freshness](../rules/cost-and-proof-freshness.spec.md) | `rule.cost-and-proof-freshness` | Expensive eval and improve evidence is shown honestly as selected, prepared, stale, or newly executed proof. | [Behavior Evaluation](../user/evaluation.spec.md), [Bounded Improvement](../user/improvement.spec.md) | [Evaluation Surfaces And Runners](../contracts/evaluation-surfaces-runners.spec.md), [Improvement Loop](../contracts/improvement-loop.spec.md), [Scenario History And Proposal Normalization](../contracts/scenario-history-normalization.spec.md) |
| [Agent-Human Resumability](../rules/agent-human-resumability.spec.md) | `rule.agent-human-resumability` | A human or agent can resume from durable packets, next actions, source refs, and source-bound review feedback that can become reusable learning evidence instead of chat memory. | [Readiness](../user/doctor-readiness.spec.md), [Claim Discovery](../user/claim-discovery.spec.md), [Host Ownership](../user/ownership.spec.md) | [Evidence State And Review Artifacts](../contracts/evidence-state-artifacts.spec.md), [Binary And Skill Boundary](../contracts/binary-skill-boundary.spec.md), [Active Run And Workspace Lifecycle](../contracts/active-run-workspace.spec.md), [Reporting And Review Variants](../contracts/reporting-review-variants.spec.md) |

## Ledger Checks

```run:shell
# Verify all primary reading views exist.
test -f docs/specs/user/index.spec.md
test -f docs/specs/contracts/index.spec.md
test -f docs/specs/rules/index.spec.md
test -f docs/specs/evidence/index.spec.md
```
