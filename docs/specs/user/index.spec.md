# Cautilus User Workflow View

`Cautilus` helps users discover, evaluate, and improve behavior promises as prompts, agents, and app behavior change.

Use this page to answer four questions:
is my repo ready, what promises did Cautilus find, can I evaluate behavior, and can I improve it safely?
Each workflow page names the user job, the Cautilus surface, the expected outcome, and the available evidence.

Maintainer view: [Contracts](../contracts/index.spec.md).
Full spec entry: [Cautilus Promise Specs](../index.spec.md).
Shared concerns: [Cross-Cutting Rules](../rules/index.spec.md).

## Workflow Stories

- [Readiness](doctor-readiness.spec.md): see which Cautilus workflow is ready, blocked, or missing setup before starting claim, eval, or improve work. Primary surfaces: `cautilus doctor`, `cautilus agent status`, and the `cautilus-agent` skill.
- [Claim Discovery](claim-discovery.spec.md): scan selected source docs into broad source-referenced candidates, curate false positives and likely missing promises, and turn the result into a reviewable next-work map. Primary surfaces: `cautilus claim` and the `cautilus-agent` skill.
- [Behavior Evaluation](evaluation.spec.md): evaluate behavior across `dev/repo`, `dev/skill`, `app/chat`, and `app/prompt` surfaces when deterministic tests alone do not explain the behavior. Primary surfaces: `cautilus eval` and the `cautilus-agent` skill.
- [Bounded Improvement](improvement.spec.md): improve a selected behavior target while preserving intent, explicit budget, protected checks, held-out evidence, and reviewable revision artifacts. Primary surfaces: `cautilus improve` and the `cautilus-agent` skill.

Read this index first when judging the product story.
The main stories are ordered by the user's workflow.
The shared-concern section keeps workflow-wide rules and risks visible.

## Cross-Cutting Rules To Keep In View

- [Reviewable Artifacts](reviewable-artifacts.spec.md): every workflow should leave machine-readable packets and readable views that another person or agent can reopen.
- [Evidence Gaps](evidence-gaps.spec.md): discovered or reviewed promises should not be treated as satisfied until valid evidence is attached, and missing or weak evidence should remain visible until the claim is proven, narrowed, deferred, or removed.
- [Host Ownership](ownership.spec.md): prompts, models, credentials, runtime wiring, fixtures, and acceptance policy stay in the host repo while Cautilus standardizes workflow packets and boundaries.
- [Agent-Human Resumability](../rules/agent-human-resumability.spec.md): workflow packets and next actions should let a human or agent resume without relying on chat memory, while source-bound review feedback can become reusable learning evidence about which discovery or evaluation work was useful.

Shared concerns should stay visible here and should also appear locally inside the main stories where they constrain the workflow.
For example, readiness uses `meaning` and `detail` consistently in the `doctor` packet, while evaluation and improvement show latest evidence artifacts instead of hiding cost or proof state.

> check:cautilus-command
| args_json | stdout_includes |
| --- | --- |
| ["commands","--json"] | claim |
| ["commands","--json"] | eval |
| ["commands","--json"] | improve |
| ["doctor","--help"] | Usage: |
| ["doctor","--repo-root","."] | ready |
