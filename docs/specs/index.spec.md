# Cautilus Claim Specs

This is the top-level entry for checking what `Cautilus` promises, how those promises are verified, and which contracts keep the evidence current.

This report keeps one promise model visible through multiple projections.
The model is the source of truth for promise identity, concern tags, proof routes, and evidence state.
Views are reader-facing projections over that model.

## Canonical Model

- [Promise Model](model/index.spec.md)
- [Promise Ledger](model/promise-ledger.spec.md)
- [Projection Contract](model/projection-contract.spec.md)
- [ID Policy](model/id-policy.spec.md)

## Views

- [User View](user/index.spec.md)
- [Maintainer View](maintainer/index.spec.md)

## Concern Lens

- [Cross-Cutting Concerns](concerns/index.spec.md)

Cross-cutting concerns are not a third audience.
They are concern-first projections over the same model, used when a reader needs to ask where reviewability, evidence visibility, vocabulary consistency, packet freshness, or agent-human resumability attach across workflows and maintainer proof routes.

## Proof View

- [Proof View](proof/index.spec.md)

The proof view keeps current evidence, expected proof gaps, and intentionally red Specdown checks visible without promoting missing evidence to product truth.

## Archive

- [Archived Specs](archive/index.spec.md)

Archived specs are retained for historical context, not as current product promises.
