# Cautilus User-Facing Specs

`Cautilus` helps users discover, evaluate, and improve behavior promises as prompts, agents, and app behavior change.

These specs are the user-facing source of truth for what the product promises.
Each story page should read as an acceptance contract:
the story names the user job, the Cautilus surface, and the outcome;
each acceptance criterion carries local executable proof or an explicit gap.
Expensive Cautilus proof is produced on demand as durable artifacts, while this report should project the latest selected evidence without rerunning costly evaluation or optimization loops.
The same product vocabulary should appear in user prose, Cautilus JSON packets, Cautilus Agent guidance, maintainer specs, and tests.

Maintainer view: [Maintainer-Facing Specs](../maintainer/index.spec.md).
Full claim-spec report entry: [Cautilus Claim Specs](../index.spec.md).

## User Stories

- [Readiness](doctor-readiness.spec.md): using `cautilus doctor`, `cautilus agent status`, and the Cautilus Agent, a user can see which Cautilus workflow is ready, blocked, or missing setup before starting claim, eval, or optimize work.
- [Claim Discovery](claim-discovery.spec.md): using `cautilus claim` and the Cautilus Agent, a user can scan selected source docs into broad source-referenced candidates, curate false positives and likely missing promises, and turn the result into a reviewable next-work map.
- [Behavior Evaluation](evaluation.spec.md): using `cautilus eval` and Cautilus Agent guidance, a user can evaluate intentful behavior across `dev/repo`, `dev/skill`, `app/chat`, and `app/prompt` surfaces when deterministic tests alone do not explain the behavior.
- [Bounded Optimization](optimization.spec.md): using `cautilus optimize` and Cautilus Agent guidance, a user can improve a selected behavior target while preserving intent, explicit budget, protected checks, held-out evidence, and reviewable revision artifacts.
- [Host Ownership](ownership.spec.md): using Cautilus adapters and host-owned runners, a user can keep prompts, models, credentials, runtime wiring, and acceptance policy in the host repo while Cautilus standardizes workflow packets and boundaries.

Read this index first when judging the product story.
The main stories are ordered by the user's workflow, not by internal implementation layers.
They are the dominant product decomposition, but they do not replace the cross-cutting stories below.

## Cross-Cutting Stories

- [Reviewable Artifacts](reviewable-artifacts.spec.md): every workflow should leave machine-readable packets and readable views that another person or agent can reopen.
- [Evidence Gaps](evidence-gaps.spec.md): discovered or reviewed promises should not be treated as satisfied until valid evidence is attached, and missing or weak evidence should remain visible until the claim is proven, narrowed, deferred, or removed.

Cross-cutting stories should stay visible here and should also appear locally inside the main stories where they constrain the workflow.
For example, readiness uses `meaning` and `detail` consistently in the `doctor` packet, while evaluation and optimization project latest evidence artifacts instead of hiding cost or proof state.

> check:cautilus-command
| args_json | stdout_includes |
| --- | --- |
| ["commands","--json"] | claim |
| ["commands","--json"] | eval |
| ["commands","--json"] | optimize |
| ["doctor","--help"] | Usage: |
| ["doctor","--repo-root","."] | ready |
