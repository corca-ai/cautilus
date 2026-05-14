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

## Evidence Quality

Each subclaim on a claim spec page must be backed by evidence that runs the claimed behavior end-to-end and asserts on the produced packet, file, or audit artifact.
The following are **not** acceptable as the closing state of a slice that touches a subclaim:

- `--help` substring matches or other surface-existence checks (`> check:cautilus-command` style probes that only assert a word appears in help output).
- "command exists" probes that do not run the claimed scenario.
- `Evidence is pending` placeholders left as the closing state.

When adding or touching a claim spec page, for each subclaim either (a) add an executable check that runs the actual scenario and asserts on the produced packet/file, or (b) link a concrete existing evidence bundle, audit fixture, or packet path that proves that specific subclaim.
If a subclaim genuinely has no evidence yet, log it as explicit proof debt — an owned next-action item that names the bundle to author — rather than letting it close as a silent omission.

When introducing or expanding a spec tree, install a lint that fails on missing per-subclaim evidence in the same slice so the gap cannot drift back.
Absorbing old contracts into specs should run *after* this convention is locked, not before, otherwise the same evidence mapping is done twice.
