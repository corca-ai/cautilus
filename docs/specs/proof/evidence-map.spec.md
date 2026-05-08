# Evidence Map

This page maps canonical promises and concerns to the current durable proof routes.
It does not assert that every route is complete.
Completeness is handled by [Proof Gaps](gaps.spec.md).

## Evidence Routes

| evidence id | supports | route | current state |
| --- | --- | --- | --- |
| `evidence.readiness-cli` | `promise.readiness`, `concern.vocabulary-consistency` | [Readiness](../user/doctor-readiness.spec.md), [Readiness And Runtime Status](../maintainer/readiness-runtime-status.spec.md) | executable CLI checks exist |
| `evidence.claim-discovery-fixtures` | `promise.claim-discovery`, `concern.reviewable-artifacts`, `concern.evidence-gaps` | [Claim Discovery](../user/claim-discovery.spec.md), [Claim Discovery Workflow](../maintainer/claim-discovery-workflow.spec.md) | deterministic fixture proof exists; agent curation proof is partial |
| `evidence.evaluation-selected` | `promise.evaluation`, `concern.packet-freshness`, `concern.cost-and-proof-freshness` | [Behavior Evaluation](../user/evaluation.spec.md), [Evaluation Surfaces And Runners](../maintainer/evaluation-surfaces-runners.spec.md) | selected evidence is projected instead of rerun |
| `evidence.optimization-packets` | `promise.optimization`, `concern.reviewable-artifacts`, `concern.cost-and-proof-freshness` | [Bounded Optimization](../user/optimization.spec.md), [Optimization Loop](../maintainer/optimization-loop.spec.md) | packet proof exists; held-out live cycle proof is missing |
| `evidence.host-boundary` | `concern.host-owned-execution` | [Host Ownership](../user/ownership.spec.md), [Adapter And Host Ownership](../maintainer/adapter-host-ownership.spec.md), [Live Invocation Runtime](../maintainer/live-invocation-runtime.spec.md) | deterministic boundary proof exists; live parity proof is partial |
| `evidence.review-artifact-rendering` | `concern.reviewable-artifacts`, `concern.packet-freshness`, `concern.agent-human-resumability` | [Evidence State And Review Artifacts](../maintainer/evidence-state-artifacts.spec.md), [Reporting And Review Variants](../maintainer/reporting-review-variants.spec.md), [Active Run And Workspace Lifecycle](../maintainer/active-run-workspace.spec.md) | route proof exists across maintainer pages |

```run:shell
# Verify evidence map can reach the canonical ledger and gap view.
test -f docs/specs/model/promise-ledger.spec.md
test -f docs/specs/proof/gaps.spec.md
```
