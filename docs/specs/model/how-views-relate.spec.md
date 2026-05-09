# How The Views Relate

Cautilus design specs use one promise model and several reading views.
The map names the product concepts.
Each view chooses an order and emphasis for a specific reader task.

Canonical ledger: [Promise Ledger](promise-ledger.spec.md).
Naming rules: [Names And Keys](names-and-keys.spec.md).

## Map

The [Promise Ledger](promise-ledger.spec.md) names workflow promises, shared concerns, and their first-order relationships.
The model favors stable concepts and short commitments over explanation of past debates.

## Views

| view | reading task | primary order |
| --- | --- | --- |
| [User Workflow](../user/index.spec.md) | understand what a Cautilus user can do | readiness, discovery, evaluation, optimization |
| [Maintainer View](../maintainer/index.spec.md) | see which contracts and evidence routes maintain the promises | evidence-route ownership |
| [Shared Concerns](../concerns/index.spec.md) | inspect rules and risks that apply across workflows | concern name |
| [Evidence State](../proof/index.spec.md) | inspect current evidence, selected evidence, and open proof gaps | evidence state |

## Context Map

| context | owns |
| --- | --- |
| Promise identity | human names, compact keys, view membership |
| User workflow | reader-facing jobs and acceptance criteria |
| Maintainer evidence | contracts, adapters, fixtures, and evidence routes |
| Host execution | prompts, models, credentials, runtime wiring, fixtures, and acceptance policy in host repos |
| Evidence state | selected evidence, stale evidence, and open proof gaps |

## Traceability

The current traceability contract is Markdown reachability plus executable Specdown checks.
Typed Specdown traceability is tracked as `gap.traceability-config` in [Proof Gaps](../proof/gaps.spec.md).
