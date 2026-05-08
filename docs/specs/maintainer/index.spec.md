# Cautilus Maintainer-Facing Specs

This is the maintainer-facing view over the [canonical Cautilus promise model](../model/index.spec.md).
It maps promises and cross-cutting concerns to maintainer-owned contracts, proof routes, adapters, fixtures, and known evidence gaps.

User view: [User-Facing Specs](../user/index.spec.md).
Full spec entry: [Cautilus Claim Specs](../index.spec.md).
Concern lens: [Cross-Cutting Concerns](../concerns/index.spec.md).
Proof view: [Proof View](../proof/index.spec.md).

Use this view after the user-facing index.
Each maintainer page names the aligned canonical promises or concerns, the maintainer promise, concrete subclaims, current evidence, and remaining evidence gaps.

## Maintainer Proof Routes

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

## Concern Mapping

| concern | maintainer routes |
| --- | --- |
| `concern.reviewable-artifacts` | [Evidence State And Review Artifacts](evidence-state-artifacts.spec.md), [Reporting And Review Variants](reporting-review-variants.spec.md), [Active Run And Workspace Lifecycle](active-run-workspace.spec.md) |
| `concern.evidence-gaps` | [Evidence State And Review Artifacts](evidence-state-artifacts.spec.md), [Optimization Loop](optimization-loop.spec.md), [Readiness And Runtime Status](readiness-runtime-status.spec.md) |
| `concern.host-owned-execution` | [Adapter And Host Ownership](adapter-host-ownership.spec.md), [Live Invocation Runtime](live-invocation-runtime.spec.md), [Binary And Skill Boundary](binary-skill-boundary.spec.md) |
| `concern.vocabulary-consistency` | [Binary And Skill Boundary](binary-skill-boundary.spec.md), [Adapter And Host Ownership](adapter-host-ownership.spec.md), [Evidence State And Review Artifacts](evidence-state-artifacts.spec.md) |
| `concern.packet-freshness` | [Evidence State And Review Artifacts](evidence-state-artifacts.spec.md), [Reporting And Review Variants](reporting-review-variants.spec.md), [Active Run And Workspace Lifecycle](active-run-workspace.spec.md) |
| `concern.cost-and-proof-freshness` | [Evaluation Surfaces And Runners](evaluation-surfaces-runners.spec.md), [Optimization Loop](optimization-loop.spec.md), [Scenario History And Proposal Normalization](scenario-history-normalization.spec.md) |
| `concern.agent-human-resumability` | [Binary And Skill Boundary](binary-skill-boundary.spec.md), [Active Run And Workspace Lifecycle](active-run-workspace.spec.md), [Reporting And Review Variants](reporting-review-variants.spec.md) |
