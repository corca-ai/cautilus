# Cautilus Promise Specs

This is the entry point for the Cautilus design specs.
Cautilus is a CLI plus Cautilus Agent workflow for discovering, evaluating, and improving behavior promises while keeping evidence, ownership, and review state inspectable.

## Core Vocabulary

- A promise is a current Cautilus product commitment.
- Claim Discovery finds candidate claims in source documents and turns useful ones into proof-planning work.
- Evidence is the packet, fixture, command result, or durable artifact that supports a promise.
- A concern is an acceptance pressure that applies across several workflows, such as evidence visibility or host-owned execution.
- A projection arranges the same promise model for a specific reading task.

## Reading Path

1. Start with the [User Workflow](user/index.spec.md) to see what Cautilus helps a user do.
2. Read the [Maintainer Proof](maintainer/index.spec.md) projection to see which contracts and proof routes keep those workflows true.
3. Use the [Promise Model](model/index.spec.md) when you need the compact map of names, keys, concerns, and projections.
4. Use [Cross-Cutting Concerns](concerns/index.spec.md) when checking reviewability, evidence visibility, ownership, vocabulary, or packet freshness across workflows.
5. Use [Evidence And Gaps](proof/index.spec.md) when checking current evidence, selected evidence, or expected-failing proof gaps.

## Model And Projections

- [User Workflow View](user/index.spec.md)
- [Maintainer Proof View](maintainer/index.spec.md)
- [Cross-Cutting Concern View](concerns/index.spec.md)
- [Evidence And Gap View](proof/index.spec.md)
- [Promise Model](model/index.spec.md)
- [Promise Ledger](model/promise-ledger.spec.md)
- [Projection Contract](model/projection-contract.spec.md)
- [Naming And Addressing](model/naming-and-addressing.spec.md)

## Archive

- [Archived Specs](archive/index.spec.md)

The archive preserves older spec pages for comparison while the promise model remains the current reading path.
