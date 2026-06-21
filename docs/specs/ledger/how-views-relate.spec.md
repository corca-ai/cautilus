# How The Views Relate

Cautilus design specs use one promise model and several reading views.
The map names the product concepts.
Each view chooses an order and emphasis for a specific reader task.

Canonical ledger: [Promise Ledger](promise-ledger.spec.md).
Naming rules: [Names And Keys](names-and-keys.spec.md).

## Map

The [Promise Ledger](promise-ledger.spec.md) names workflow promises, cross-cutting rules, and their first-order relationships.
The model favors stable concepts and short commitments over explanation of past debates.

## Views

| view | reading task | primary order |
| --- | --- | --- |
| [User Workflow](../user/index.spec.md) | understand what a Cautilus user can do | readiness, discovery, evaluation, improvement |
| [Contracts](../contracts/index.spec.md) | see which contracts and evidence routes maintain the promises | evidence-route ownership |
| [Cross-Cutting Rules](../rules/index.spec.md) | inspect rules and risks that apply across workflows | concern name |
| [Evidence State](../evidence/index.spec.md) | inspect current evidence, selected evidence, and open proof gaps | evidence state |

## Context Map

| context | owns |
| --- | --- |
| Promise identity | human names, compact keys, view membership |
| User workflow | reader-facing jobs and acceptance criteria |
| Maintainer evidence | contracts, adapters, fixtures, and evidence routes |
| Host execution | prompts, models, credentials, runtime wiring, fixtures, and acceptance policy in host repos |
| Evidence state | selected evidence, stale evidence, and open proof gaps |

## Traceability

The traceability contract is typed Specdown traceability, configured in `specdown.json` and validated by `specdown trace -strict`.
Today the typed spine is the apex and the seven promises, joined by `badges::`-prefixed apex-to-promise edges; promise-to-rule and promise-to-contract edges are a later slice.
Markdown reachability (`scripts/check-specs.mjs`) still runs alongside it until trace is proven equivalent.
