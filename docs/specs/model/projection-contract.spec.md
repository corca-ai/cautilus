# Projection Contract

Cautilus design specs separate the model from the projections that read it.
The model names the product concepts.
Each projection chooses an order and emphasis for a specific reader task.

Canonical ledger: [Promise Ledger](promise-ledger.spec.md).
Naming rules: [Naming And Addressing](naming-and-addressing.spec.md).

## Model

The [Promise Ledger](promise-ledger.spec.md) names workflow promises, cross-cutting concerns, and their first-order relationships.
The model favors stable concepts and short commitments over explanation of past debates.

## Projections

| projection | reading task | primary order |
| --- | --- | --- |
| [User Workflow View](../user/index.spec.md) | understand what a Cautilus user can do | readiness, discovery, evaluation, optimization |
| [Maintainer Proof View](../maintainer/index.spec.md) | see which contracts and proof routes maintain the promises | proof-route ownership |
| [Cross-Cutting Concern View](../concerns/index.spec.md) | inspect acceptance concerns that apply across workflows | concern name |
| [Evidence And Gap View](../proof/index.spec.md) | inspect current evidence, selected evidence, and open proof gaps | evidence state |

## Context Map

| context | owns |
| --- | --- |
| Promise identity | human names, compact keys, projection membership |
| User workflow | reader-facing jobs and acceptance criteria |
| Maintainer proof | contracts, adapters, fixtures, and proof routes |
| Host execution | prompts, models, credentials, runtime wiring, fixtures, and acceptance policy in host repos |
| Evidence state | selected evidence, stale evidence, and open proof gaps |

## Traceability

The current traceability contract is Markdown reachability plus executable Specdown checks.
Typed Specdown traceability is tracked as `gap.traceability-config` in [Proof Gaps](../proof/gaps.spec.md).
