# Cautilus

**Cautilus** is a CLI bundled with the `cautilus-agent` skill for discovering, evaluating, and improving behavior promises while keeping evidence, ownership, and review state inspectable.

## Vocabulary

- A `promise` means something Cautilus currently says it can help with.
- A `candidate claim` means a possible promise found during `Claim Discovery`.
- `evidence` means a packet, fixture, command result, or durable artifact that supports a promise.
- A `gap` means missing or weak evidence that stays visible.
- A `cross-cutting rule` means a rule or risk that applies across workflows, such as host ownership, evidence visibility, or packet freshness.

## Reading Path

1. Start with the [User Workflow](user/index.spec.md) to see how people use the `cautilus` CLI and the `cautilus-agent` skill to discover, evaluate, and improve behavior against explicit evidence.
2. Read [Contracts](contracts/index.spec.md) to see the command, packet, adapter, fixture, and evidence contracts that keep the user-facing workflow buildable and reviewable.
3. Read [Promise Ledger](ledger/index.spec.md) to understand which behavior claims Cautilus currently makes, how they relate, and which workflow or contract owns each claim.
4. Read [Cross-Cutting Rules](rules/index.spec.md) to understand the reviewability, ownership, vocabulary, freshness, cost, and resumability rules that apply across workflow steps.
5. Read [Evidence State](evidence/index.spec.md) to see which claims are supported now, which proof was selected instead of rerun, and which gaps remain open.
