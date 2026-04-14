# Skill Evaluation Contract

`Cautilus` should support a first-class `skill evaluate` surface for judging
whether a skill is invoked on the right prompts and whether it performs its
intended task once invoked.

When the operator still needs to run the host-specific skill invocation loop,
use `skill-testing.md` first and treat `skill evaluate` as the packet
summarizer one step downstream.

Use `cautilus.skill_evaluation_inputs.v1` for the input packet and
`cautilus.skill_evaluation_summary.v1` for the summary packet.

## Problem

`scenario normalize skill` is useful once a host repo already has normalized
skill-evaluation summaries, but that helper starts one step too late when the
host wants `skill` to be an explicit product-owned evaluation target.

The product boundary for the first slice should be:

`host-observed skill eval packet -> cautilus skill evaluate -> skill evaluation summary -> cautilus scenario normalize skill`

This keeps raw runner ownership in the host repo while letting `Cautilus` own
the packet shape, behavior framing, status rollup, and downstream chaining.

## Input Boundary

The first slice consumes one normalized packet with:

- `skillId`
- optional `skillDisplayName`
- `evaluations`
  - `evaluationId`
  - `targetKind`
  - `targetId`
  - optional `displayName`
  - `evaluationKind`
    - `trigger`
    - `execution`
  - `prompt`
  - `startedAt`
  - `invoked`
  - `summary`
  - trigger-only `expectedTrigger`
    - `must_invoke`
    - `must_not_invoke`
  - execution-only `outcome`
    - `passed`
    - `failed`
    - `degraded`
    - `blocked`
  - optional `metrics`
  - optional `sampling`
    - `sampleCount`
    - optional `consensusCount`
    - optional `matchingCount`
    - optional `invokedCount`
    - optional `stable`
    - execution-only optional `statusCounts`
  - optional `baseline`
    - `invoked`
    - optional `summary`
    - optional `outcome`
    - optional `metrics`
  - optional `thresholds`
  - optional `artifactRefs`
  - optional `intentProfile`

The host repo still owns:

- how prompts are selected
- how the skill is actually invoked
- how raw transcripts or output files are captured
- any baseline or A/B runner logic

The product-owned surface starts at the normalized packet, not at raw host
runtime access.

## Output Boundary

The first summary packet should include:

- recommendation
  - `accept-now`
  - `defer`
  - `reject`
- evaluation counts by status and kind
- sampling rollup
  - pass rate
  - invocation rate
  - consensus rate
  - unstable evaluation count
- baseline comparison rollup
  - better / same / worse counts
- per-evaluation results with normalized `surface`
  - `trigger_selection`
  - `execution_quality`
- derived product-owned `intentProfile`
- `evaluationRuns`
  suitable for `cautilus scenario normalize skill`

The point is not to replace host execution.
The point is to give the product one stable boundary that can:

- evaluate skill trigger accuracy
- evaluate skill execution quality
- degrade passing runs when declared runtime or token budgets are exceeded
- chain directly into reusable scenario proposal coverage

## Current Recommendation Rules

- any `failed` run -> `reject`
- otherwise any `degraded`, `blocked`, `unstable`, or baseline-worse run -> `defer`
- otherwise -> `accept-now`

This remains intentionally bounded. The product now exposes stability and
baseline drift explicitly, but the host still owns richer experiment design.

## Behavior Intent Mapping

Current product-owned surfaces for this seam:

- `skill_trigger_selection`
  - `skill_trigger_accuracy`
- `skill_execution_quality`
  - `skill_task_fidelity`
  - optional `runtime_budget_respect` when thresholds are declared

## Guardrails

- Do not let `skill evaluate` read raw repos, `SKILL.md`, or logs directly.
- Do not pretend this slice owns skill execution infrastructure.
- Do not collapse deterministic packaging or bootstrap validation into this
  seam; those remain repo-owned local gates.
- Do not make budget drift invisible when the host declared explicit runtime or
  token thresholds.
- Do not force hosts to supply a baseline packet before they can evaluate one
  skill surface honestly.
