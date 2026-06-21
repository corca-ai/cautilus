# Cautilus User Workflow View

`Cautilus` helps users discover, evaluate, and improve behavior promises as prompts, agents, and app behavior change.

Use this page to answer four questions:
is my repo ready, what promises did Cautilus find, can I evaluate behavior, and can I improve it safely?
Each workflow page names the user job, the Cautilus surface, the expected outcome, and the available evidence.

Maintainer view: [Contracts](../contracts/index.spec.md).
Full spec entry: [Cautilus Promise Specs](../index.spec.md).
Cross-cutting rules and per-promise rule/contract map: [Cross-Cutting Rules](../rules/index.spec.md), [Promise Ledger](../generated/promise-ledger.spec.md).

## Workflow Stories

- [Readiness](doctor-readiness.spec.md): see which Cautilus workflow is ready, blocked, or missing setup before starting claim, eval, or improve work. Primary surfaces: `cautilus doctor`, `cautilus doctor status`, and the `cautilus-agent` skill.
- [Claim Discovery](claim-discovery.spec.md): scan selected source docs into broad source-referenced candidates, curate false positives and likely missing promises, and turn the result into a reviewable next-work map. Primary surfaces: `cautilus discover claims` and the `cautilus-agent` skill.
- [Behavior Evaluation](evaluation.spec.md): evaluate behavior across `dev/repo`, `dev/skill`, `app/chat`, and `app/prompt` surfaces when deterministic tests alone do not explain the behavior. Primary surfaces: `cautilus evaluate` and the `cautilus-agent` skill.
- [Bounded Improvement](improvement.spec.md): improve a selected behavior target while preserving intent, explicit budget, protected checks, held-out evidence, and reviewable revision artifacts. Primary surfaces: `cautilus improve` and the `cautilus-agent` skill.

Read this index first when judging the product story.
The main stories are ordered by the user's workflow.
Shared concerns (reviewability, evidence gaps, ownership, freshness, resumability) are carried as `governed-by::` edges on each promise leaf and mapped in the [Promise Ledger](../generated/promise-ledger.spec.md).

> check:cautilus-command
| args_json | stdout_includes |
| --- | --- |
| ["doctor", "commands","--json"] | claim |
| ["doctor", "commands","--json"] | eval |
| ["doctor", "commands","--json"] | improve |
| ["doctor","--help"] | Usage: |
| ["doctor","--repo-root","."] | ready |
