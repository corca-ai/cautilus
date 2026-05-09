# Cautilus Promise Specs

This is the entry point for the Cautilus design specs.
Cautilus is a CLI plus Cautilus Agent workflow for discovering, evaluating, and improving behavior promises while keeping evidence, ownership, and review state inspectable.

## Words Used Here

- A promise is something Cautilus currently says it can help with.
- A candidate claim is a possible promise found during Claim Discovery.
- Evidence is the packet, fixture, command result, or durable artifact that supports a promise.
- A gap is missing or weak evidence that stays visible.
- A shared concern is a rule or risk that applies across workflows, such as host ownership, evidence visibility, or packet freshness.

## Reading Path

1. Start with the [User Workflow](user/index.spec.md) to see what Cautilus helps a user do.
2. Read the [Maintainer View](maintainer/index.spec.md) to see which contracts, fixtures, and evidence routes keep those workflows true.
3. Use the [Promise Model](model/index.spec.md) when you need the compact map of names, keys, and links.
4. Use [Shared Concerns](concerns/index.spec.md) when checking reviewability, evidence visibility, ownership, vocabulary, or packet freshness across workflows.
5. Use [Evidence State](proof/index.spec.md) when checking current evidence, selected evidence, or expected-failing gaps.

## Reference Pages

- [User Workflow](user/index.spec.md)
- [Maintainer View](maintainer/index.spec.md)
- [Shared Concerns](concerns/index.spec.md)
- [Evidence State](proof/index.spec.md)
- [Promise Model](model/index.spec.md)
- [Promise Ledger](model/promise-ledger.spec.md)
- [How The Views Relate](model/how-views-relate.spec.md)
- [Names And Keys](model/names-and-keys.spec.md)

## Archive

- [Archived Specs](archive/index.spec.md)

The archive preserves older spec pages for comparison while the promise model remains the current reading path.
