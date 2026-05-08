# Cautilus Promise Ledger

This ledger is the canonical source of truth for current Cautilus promise identity.
Audience views, concern lenses, maintainer routes, and proof pages project these rows instead of inventing separate promise truth.

Model index: [Promise Model](index.spec.md).
Projection contract: [Projection Contract](projection-contract.spec.md).
Proof view: [Proof View](../proof/index.spec.md).

## Primary Workflow Promises

| id | canonical promise | user projection | maintainer proof routes | concerns | evidence posture |
| --- | --- | --- | --- | --- | --- |
| `promise.readiness` | A user can tell whether Cautilus can operate in the selected repo and what setup is missing before spending workflow budget. | [Readiness](../user/doctor-readiness.spec.md) | [Readiness And Runtime Status](../maintainer/readiness-runtime-status.spec.md), [Adapter And Host Ownership](../maintainer/adapter-host-ownership.spec.md) | `concern.evidence-gaps`, `concern.vocabulary-consistency`, `concern.agent-human-resumability`, `concern.host-owned-execution` | partial |
| `promise.claim-discovery` | A user can scan selected source docs into broad source-referenced candidates and leave curation, likely false negatives, and proof planning visible. | [Claim Discovery](../user/claim-discovery.spec.md) | [Claim Discovery Workflow](../maintainer/claim-discovery-workflow.spec.md), [Evidence State And Review Artifacts](../maintainer/evidence-state-artifacts.spec.md), [Binary And Skill Boundary](../maintainer/binary-skill-boundary.spec.md) | `concern.reviewable-artifacts`, `concern.evidence-gaps`, `concern.agent-human-resumability`, `concern.host-owned-execution` | partial |
| `promise.evaluation` | A user can evaluate intentful behavior across supported `dev` and `app` surfaces when deterministic tests alone do not explain the behavior. | [Behavior Evaluation](../user/evaluation.spec.md) | [Evaluation Surfaces And Runners](../maintainer/evaluation-surfaces-runners.spec.md), [Reporting And Review Variants](../maintainer/reporting-review-variants.spec.md), [Live Invocation Runtime](../maintainer/live-invocation-runtime.spec.md) | `concern.reviewable-artifacts`, `concern.packet-freshness`, `concern.cost-and-proof-freshness`, `concern.host-owned-execution` | partial |
| `promise.optimization` | A user can improve a selected behavior target while preserving intent, explicit budget, protected checks, held-out evidence, and reviewable revision artifacts. | [Bounded Optimization](../user/optimization.spec.md) | [Optimization Loop](../maintainer/optimization-loop.spec.md), [Scenario History And Proposal Normalization](../maintainer/scenario-history-normalization.spec.md), [Active Run And Workspace Lifecycle](../maintainer/active-run-workspace.spec.md) | `concern.reviewable-artifacts`, `concern.evidence-gaps`, `concern.cost-and-proof-freshness`, `concern.host-owned-execution` | partial |

## Cross-Cutting Concerns

| id | concern | concern projection | user-facing attachment | maintainer proof routes | current gap |
| --- | --- | --- | --- | --- | --- |
| `concern.reviewable-artifacts` | Workflow output remains reopenable as machine-readable packets and readable projections. | [Reviewable Artifacts](../concerns/reviewable-artifacts.spec.md) | [Reviewable Artifacts](../user/reviewable-artifacts.spec.md) | [Evidence State And Review Artifacts](../maintainer/evidence-state-artifacts.spec.md), [Reporting And Review Variants](../maintainer/reporting-review-variants.spec.md), [Active Run And Workspace Lifecycle](../maintainer/active-run-workspace.spec.md) | no maintainer concern page yet |
| `concern.evidence-gaps` | Missing or weak evidence stays visible until the claim is proven, narrowed, deferred, or removed. | [Evidence Gaps](../concerns/evidence-gaps.spec.md) | [Evidence Gaps](../user/evidence-gaps.spec.md) | [Evidence State And Review Artifacts](../maintainer/evidence-state-artifacts.spec.md), [Optimization Loop](../maintainer/optimization-loop.spec.md), [Readiness And Runtime Status](../maintainer/readiness-runtime-status.spec.md) | no maintainer concern page yet |
| `concern.host-owned-execution` | Host repos own prompts, models, credentials, runtime wiring, fixtures, and acceptance policy while Cautilus owns generic workflow packets and boundaries. | [Host-Owned Execution](../concerns/host-owned-execution.spec.md) | [Host Ownership](../user/ownership.spec.md) | [Adapter And Host Ownership](../maintainer/adapter-host-ownership.spec.md), [Live Invocation Runtime](../maintainer/live-invocation-runtime.spec.md), [Binary And Skill Boundary](../maintainer/binary-skill-boundary.spec.md) | live host parity proof is partial |
| `concern.vocabulary-consistency` | One concept keeps one name across user prose, maintainer specs, packets, tests, and Cautilus Agent guidance. | [Vocabulary Consistency](../concerns/vocabulary-consistency.spec.md) | [Readiness](../user/doctor-readiness.spec.md), [Claim Discovery](../user/claim-discovery.spec.md), [Host Ownership](../user/ownership.spec.md) | [Binary And Skill Boundary](../maintainer/binary-skill-boundary.spec.md), [Adapter And Host Ownership](../maintainer/adapter-host-ownership.spec.md), [Evidence State And Review Artifacts](../maintainer/evidence-state-artifacts.spec.md) | no dedicated vocabulary evidence bundle yet |
| `concern.packet-freshness` | Readable views project current packets and source artifacts rather than stale copied state. | [Packet Freshness](../concerns/packet-freshness.spec.md) | [Reviewable Artifacts](../user/reviewable-artifacts.spec.md), [Evidence Gaps](../user/evidence-gaps.spec.md), [Behavior Evaluation](../user/evaluation.spec.md) | [Evidence State And Review Artifacts](../maintainer/evidence-state-artifacts.spec.md), [Reporting And Review Variants](../maintainer/reporting-review-variants.spec.md), [Active Run And Workspace Lifecycle](../maintainer/active-run-workspace.spec.md) | proof is scattered across routes |
| `concern.cost-and-proof-freshness` | Expensive eval and optimize evidence is projected honestly as selected, prepared, stale, or newly executed proof. | [Cost And Proof Freshness](../concerns/cost-and-proof-freshness.spec.md) | [Behavior Evaluation](../user/evaluation.spec.md), [Bounded Optimization](../user/optimization.spec.md) | [Evaluation Surfaces And Runners](../maintainer/evaluation-surfaces-runners.spec.md), [Optimization Loop](../maintainer/optimization-loop.spec.md), [Scenario History And Proposal Normalization](../maintainer/scenario-history-normalization.spec.md) | no checked-in held-out optimize cycle yet |
| `concern.agent-human-resumability` | A human or agent can resume from packets, source refs, next actions, and readable projections instead of chat memory. | [Agent-Human Resumability](../concerns/agent-human-resumability.spec.md) | [Readiness](../user/doctor-readiness.spec.md), [Claim Discovery](../user/claim-discovery.spec.md), [Host Ownership](../user/ownership.spec.md) | [Binary And Skill Boundary](../maintainer/binary-skill-boundary.spec.md), [Active Run And Workspace Lifecycle](../maintainer/active-run-workspace.spec.md), [Reporting And Review Variants](../maintainer/reporting-review-variants.spec.md) | proof is scattered across routes |

## Ledger Checks

```run:shell
# Verify all primary projection roots exist.
test -f docs/specs/user/index.spec.md
test -f docs/specs/maintainer/index.spec.md
test -f docs/specs/concerns/index.spec.md
test -f docs/specs/proof/index.spec.md
```

```run:shell
# Verify ledger IDs do not use retired U-number claim anchors.
! grep -Eq 'U[0-9]+' docs/specs/model/promise-ledger.spec.md
```
