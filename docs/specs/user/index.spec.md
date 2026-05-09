# Cautilus User Workflow View

`Cautilus` helps users discover, evaluate, and improve behavior promises as prompts, agents, and app behavior change.

These specs are the user-facing view over the [canonical Cautilus promise model](../model/index.spec.md).
Each story page should read as an acceptance contract:
the story names the user job, the Cautilus surface, and the outcome;
each acceptance criterion carries local executable proof or an explicit gap.
Expensive Cautilus proof is produced on demand as durable artifacts, while this report should project the latest selected evidence without rerunning costly evaluation or optimization loops.
The same product vocabulary should appear in user prose, Cautilus JSON packets, `cautilus-agent` skill guidance, maintainer specs, and tests.

Maintainer proof view: [Maintainer Proof View](../maintainer/index.spec.md).
Full spec entry: [Cautilus Promise Specs](../index.spec.md).
Concern view: [Cross-Cutting Concerns](../concerns/index.spec.md).

## Workflow Stories

- [Readiness](doctor-readiness.spec.md): see which Cautilus workflow is ready, blocked, or missing setup before starting claim, eval, or optimize work. Primary surfaces: `cautilus doctor`, `cautilus agent status`, and the `cautilus-agent` skill.
- [Claim Discovery](claim-discovery.spec.md): scan selected source docs into broad source-referenced candidates, curate false positives and likely missing promises, and turn the result into a reviewable next-work map. Primary surfaces: `cautilus claim` and the `cautilus-agent` skill.
- [Behavior Evaluation](evaluation.spec.md): evaluate behavior across `dev/repo`, `dev/skill`, `app/chat`, and `app/prompt` surfaces when deterministic tests alone do not explain the behavior. Primary surfaces: `cautilus eval` and the `cautilus-agent` skill.
- [Bounded Optimization](optimization.spec.md): improve a selected behavior target while preserving intent, explicit budget, protected checks, held-out evidence, and reviewable revision artifacts. Primary surfaces: `cautilus optimize` and the `cautilus-agent` skill.

Read this index first when judging the product story.
The main stories are ordered by the user's workflow.
The concern section keeps workflow-wide acceptance pressures visible.

## Cross-Cutting Acceptance Concerns

- [Reviewable Artifacts](reviewable-artifacts.spec.md): every workflow should leave machine-readable packets and readable views that another person or agent can reopen.
- [Evidence Gaps](evidence-gaps.spec.md): discovered or reviewed promises should not be treated as satisfied until valid evidence is attached, and missing or weak evidence should remain visible until the claim is proven, narrowed, deferred, or removed.
- [Host Ownership](ownership.spec.md): user-facing name for [Host-Owned Execution](../concerns/host-owned-execution.spec.md), where prompts, models, credentials, runtime wiring, fixtures, and acceptance policy stay in the host repo while Cautilus standardizes workflow packets and boundaries.

Cross-cutting concerns should stay visible here and should also appear locally inside the main stories where they constrain the workflow.
For example, readiness uses `meaning` and `detail` consistently in the `doctor` packet, while evaluation and optimization project latest evidence artifacts instead of hiding cost or proof state.

> check:cautilus-command
| args_json | stdout_includes |
| --- | --- |
| ["commands","--json"] | claim |
| ["commands","--json"] | eval |
| ["commands","--json"] | optimize |
| ["doctor","--help"] | Usage: |
| ["doctor","--repo-root","."] | ready |
