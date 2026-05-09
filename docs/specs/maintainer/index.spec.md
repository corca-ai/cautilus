# Cautilus Maintainer View

This view maps Cautilus promises and shared concerns to maintainer-owned contracts, evidence routes, adapters, fixtures, and known evidence gaps.

User workflow view: [Cautilus User Workflow View](../user/index.spec.md).
Full spec entry: [Cautilus Promise Specs](../index.spec.md).
Shared concerns: [Shared Concerns](../concerns/index.spec.md).
Evidence state: [Evidence State](../proof/index.spec.md).

Use this view after the user-facing index.
Each maintainer page names the aligned promises or shared concerns, the maintainer promise, concrete subclaims, current evidence, and remaining evidence gaps.

## Maintainer Evidence Routes

- [Maintainer Shared Concern Policy](concerns-policy.spec.md)
- [Claim Discovery Workflow](claim-discovery-workflow.spec.md)
- [Binary And Skill Boundary](binary-skill-boundary.spec.md)
- [Adapter And Host Ownership](adapter-host-ownership.spec.md)
- [Evaluation Surfaces And Runners](evaluation-surfaces-runners.spec.md)
- [Evidence State And Review Artifacts](evidence-state-artifacts.spec.md)
- [Optimization Loop](optimization-loop.spec.md)
- [Readiness And Runtime Status](readiness-runtime-status.spec.md)
- [Active Run And Workspace Lifecycle](active-run-workspace.spec.md)
- [Live Invocation Runtime](live-invocation-runtime.spec.md)
- [Reporting And Review Variants](reporting-review-variants.spec.md)
- [Scenario History And Proposal Normalization](scenario-history-normalization.spec.md)

## Shared Concern Mapping

| shared concern | key | maintainer evidence routes |
| --- | --- | --- |
| [Reviewable Artifacts](../concerns/reviewable-artifacts.spec.md) | `concern.reviewable-artifacts` | [Evidence State And Review Artifacts](evidence-state-artifacts.spec.md), [Reporting And Review Variants](reporting-review-variants.spec.md), [Active Run And Workspace Lifecycle](active-run-workspace.spec.md) |
| [Evidence Gaps](../concerns/evidence-gaps.spec.md) | `concern.evidence-gaps` | [Evidence State And Review Artifacts](evidence-state-artifacts.spec.md), [Optimization Loop](optimization-loop.spec.md), [Readiness And Runtime Status](readiness-runtime-status.spec.md) |
| [Host-Owned Execution](../concerns/host-owned-execution.spec.md) | `concern.host-owned-execution` | [Adapter And Host Ownership](adapter-host-ownership.spec.md), [Live Invocation Runtime](live-invocation-runtime.spec.md), [Binary And Skill Boundary](binary-skill-boundary.spec.md) |
| [Vocabulary Consistency](../concerns/vocabulary-consistency.spec.md) | `concern.vocabulary-consistency` | [Binary And Skill Boundary](binary-skill-boundary.spec.md), [Adapter And Host Ownership](adapter-host-ownership.spec.md), [Evidence State And Review Artifacts](evidence-state-artifacts.spec.md) |
| [Packet Freshness](../concerns/packet-freshness.spec.md) | `concern.packet-freshness` | [Evidence State And Review Artifacts](evidence-state-artifacts.spec.md), [Reporting And Review Variants](reporting-review-variants.spec.md), [Active Run And Workspace Lifecycle](active-run-workspace.spec.md) |
| [Cost And Proof Freshness](../concerns/cost-and-proof-freshness.spec.md) | `concern.cost-and-proof-freshness` | [Evaluation Surfaces And Runners](evaluation-surfaces-runners.spec.md), [Optimization Loop](optimization-loop.spec.md), [Scenario History And Proposal Normalization](scenario-history-normalization.spec.md) |
| [Agent-Human Resumability](../concerns/agent-human-resumability.spec.md) | `concern.agent-human-resumability` | [Evidence State And Review Artifacts](evidence-state-artifacts.spec.md), [Binary And Skill Boundary](binary-skill-boundary.spec.md), [Active Run And Workspace Lifecycle](active-run-workspace.spec.md), [Reporting And Review Variants](reporting-review-variants.spec.md) |
