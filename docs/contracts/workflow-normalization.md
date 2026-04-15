# Workflow Scenario Normalization Contract

`Cautilus` supports a first-class `workflow` normalization helper that turns summaries of stateful automation runs into scenario proposal candidates.

The workflow archetype is about **durable automation that persists across invocations**: CLI workflows, long-running agent sessions, replay seeds, pipelines.
What matters is that the automation has discrete steps, a persistable state, and can be blocked mid-progression.
The helper exists so that a recurring blocker stops living as prose in a document and becomes a reusable evaluation case instead.

## Problem

Automation workflows that get stuck on the same step every week produce operator lore, not reusable coverage.
Each team rediscovers the same failure mode and writes another recovery note.
Without a normalized shape, there is no way to feed that signal back into the same `scenario propose` pipeline that already covers chatbot and skill regressions.

If `Cautilus` starts too early, it becomes a repo-specific log reader.

The product boundary is:

`host workflow run summaries -> workflow normalization helper -> proposalCandidates -> scenario prepare-input -> scenario propose`

## Current Slice

The shipped `workflow` normalization helper is `NormalizeWorkflowProposalCandidates` in [internal/runtime/proposals.go](../../internal/runtime/proposals.go), exposed on the CLI as `cautilus scenario normalize workflow`.

This slice accepts `cautilus.workflow_normalization_inputs.v1` and rejects every other input schema.

## Representative Consumers

- one checked-in workflow-recovery fixture
  - captures blocked durable workflow and replay-seed regressions

## Input Boundary

Minimum input class:

- `evaluationRuns`
  - `targetKind` (must be `cli_workflow` in this slice; future kinds may describe other stateful surfaces)
  - `targetId`
  - optional `intentProfile`
  - optional `displayName`
  - `surface`
    - examples: `replay_seed`, `state_exploration`, `resume_after_restart`
  - `startedAt`
  - `status`
    - examples: `passed`, `failed`, `degraded`, `blocked`
  - `summary`
  - optional `blockerKind`
  - optional `blockedSteps`
  - optional `artifactRefs`
  - optional `metrics`

The helper must not:

- run repo commands on its own
- traverse a repo looking for run directories or logs
- depend on one repo's local directory layout

## Output Boundary

The helper emits `proposalCandidates` compatible with [scenario-proposal-inputs.md](./scenario-proposal-inputs.md).

Current candidate family:

- `fast_regression`
  - blocked or degraded durable workflow regressions, tagged with `operator-recovery`

When no `intentProfile` is declared, the helper derives a thin profile with behavior surface `operator_workflow_recovery` and default success dimensions `workflow_recovery` plus `recovery_next_step`.

## Pattern Classes In Scope

### Durable Operator Workflow Regressions

- blocked or degraded persisted workflow artifacts
- repeated blocked-step waste in replay-seed scenarios
- operator guidance regressions where a durable workflow should become an evaluation case instead of recurring prose
- workflows that report `passed` while repeating the same step without progress (detected via `blockedSteps` or `metrics.blocked_steps`)

## Fixed Decisions

- `workflow` normalization is product-owned; runtime readers, replay-seed storage, and trace retrieval stay consumer-owned.
- The helper consumes normalized workflow summaries, not repo-local scans of `runs/`, `scenario.yaml` files, or CI logs.
- Skill-shaped `targetKind` values (`public_skill`, `profile`, `integration`) are rejected and handled by the skill archetype.

## Non-Goals

- reading replay seed files or workflow directories directly
- running workflows or restoring replay seeds on their own
- modeling conversational follow-up behavior
- modeling skill trigger selection or execution quality

## Constraints

- no hidden repo discovery
- no network or command execution inside the helper
- input and output remain deterministic and file-based
- the helper output must stay reusable across distinct automation surfaces that share `operator_workflow_recovery` as behavior surface

## Success Criteria

- a workflow-heavy consumer can normalize blocked or degraded run summaries into reusable proposal candidates without giving `Cautilus` runtime ownership of its automation surfaces.
- the helper rejects skill-shaped inputs with a clear pointer to the skill archetype.

## Acceptance Checks

- fixture: workflow-shaped degraded run with `blockedSteps` evidence becomes a candidate with operator-recovery rationale.
- fixture: helper output feeds directly into `scenario prepare-input` or `scenario propose` without extra mapping.
- skill-shaped input returns a non-zero exit with stderr mentioning the workflow archetype vocabulary.

## Canonical Artifact

- [workflow-normalization.md](./workflow-normalization.md)

## Source References

- [scenario-proposal-sources.md](./scenario-proposal-sources.md)
- [scenario-proposal-inputs.md](./scenario-proposal-inputs.md)
- [skill-normalization.md](./skill-normalization.md)
