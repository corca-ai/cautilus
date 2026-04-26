# Skill Scenario Normalization Contract

`Cautilus` supports a first-class `skill` normalization helper that turns
normalized skill trigger, skill execution, or skill validation summaries
into scenario proposal candidates.

This helper covers evaluation signals such as:

- deterministic validation or smoke-scenario failures
- skill trigger-selection regressions
- skill execution-quality regressions

Durable automation workflow regressions are handled by a separate first-class
archetype. See
[workflow-normalization.md](./workflow-normalization.md) for that contract.

## Problem

If `Cautilus` starts only at hand-written `proposalCandidates`, each consumer
must separately rediscover how to convert failed smoke scenarios and skill
trigger or execution regressions into reusable scenario proposals.

If `Cautilus` starts too early, it becomes a repo-specific log reader.

The product boundary is:

`host skill run summaries -> skill normalization helper -> proposalCandidates -> scenario prepare-input -> scenario propose`

When the host already uses the first-class `skill evaluate` seam, the chain
can be:

`host-observed skill eval packet -> skill evaluate -> skill evaluation summary -> skill normalization helper`

When the operator starts from a checked-in case suite instead, the chain can
be:

`checked-in skill cases -> skill test -> observed skill eval packet -> skill evaluate -> skill evaluation summary -> skill normalization helper`

## Current Slice

The shipped `skill` normalization helper is `NormalizeSkillProposalCandidates`
in [internal/runtime/proposals.go](../../../../internal/runtime/proposals.go),
exposed on the CLI as `cautilus scenario normalize skill`.

This slice accepts `cautilus.skill_normalization_inputs.v2` or the newer
`cautilus.skill_evaluation_summary.v1` summary packet. It rejects
`cautilus.workflow_normalization_inputs.v1` inputs and points the caller at
`cautilus scenario normalize workflow` instead.

## Representative Consumers

- one checked-in skill-validation fixture
  - captures deterministic validation and smoke-scenario drift
- one checked-in skill-evaluation fixture
  - captures trigger-selection and execution-quality regressions

## Input Boundary

The helper should consume normalized summaries, not raw repo files or command
execution.

Minimum input class:

- `evaluationRuns`
  - `targetKind` (one of `public_skill`, `profile`, `integration`)
  - `targetId`
  - optional `intentProfile`
  - optional `displayName`
  - `surface`
    - examples: `smoke_scenario`, `bootstrap`, `trigger_selection`,
      `execution_quality`, `real_device_acceptance`
  - `startedAt`
  - `status`
    - examples: `passed`, `failed`, `degraded`
  - `summary`
  - optional `artifactRefs`
  - optional `metrics`

`targetKind: cli_workflow` is rejected with a pointer to the workflow
archetype.

The helper must not:

- run repo commands on its own
- traverse a repo looking for `SKILL.md`, `scenario.yaml`, or logs
- depend on one repo's local directory layout

## Output Boundary

The helper emits `proposalCandidates` compatible with
[scenario-proposal-inputs.md](./scenario-proposal-inputs.md).

Current candidate family for the first helper:

- `fast_regression`
  - deterministic skill or validation regressions

The helper may emit an optional shared `intentProfile` using
`cautilus.behavior_intent.v1`. When the host does not declare one, the
helper derives a thin profile for:

- `skill_validation`
- `skill_trigger_selection`
- `skill_execution_quality`

Those derived profiles should use the shared product-owned dimension catalog
instead of repo-specific validation IDs.

## Pattern Classes In Scope

### 1. Skill And Validation Drift

- checked-in adapter bootstrap regressions
- smoke scenario failures for public-skill or profile validation
- missing or stale scenario coverage for declared validation surfaces

### 2. Skill Trigger And Execution Drift

- prompts that should have invoked the skill but did not
- prompts that should have stayed outside the skill but still invoked it
- execution runs that completed functionally but crossed the declared token
  or runtime budget
- execution runs that produced degraded or failed task outcomes after the
  skill was invoked

## Fixed Decisions

- `skill` normalization is product-owned; runtime readers and command
  runners stay consumer-owned.
- The helper consumes normalized summaries, not repo-local scans of
  `skills/`, `profiles/`, `runs/`, or CI logs.
- `cli_workflow` inputs are handled by the workflow archetype and rejected
  here with an actionable pointer.
- The helper outputs proposal candidates that can feed the existing
  `scenario prepare-input` and `scenario propose` chain unchanged.

## Non-Goals

- reading profile files or skill directories directly
- running smoke scenarios
- replacing repo-native deterministic gates
- modeling conversational follow-up behavior
- modeling durable automation workflow recovery

## Constraints

- no hidden repo discovery
- no network or command execution inside the helper
- input and output remain deterministic and file-based
- helper output must stay reusable across validation-heavy and
  trigger/execution-heavy consumers

## Success Criteria

- a validation-heavy consumer can normalize failed smoke-scenario or
  validation summaries into reusable proposal candidates without teaching
  `Cautilus` how to read the whole repo.
- a trigger/execution-heavy consumer can normalize packet-shaped trigger or
  execution regressions without extra host mapping.
- the helper rejects workflow-shaped inputs with a clear pointer to the
  workflow archetype.

## Acceptance Checks

- fixture: validation-shaped failed smoke scenario for a public skill
  becomes a candidate with stable `proposalKey`
- fixture: evaluation-summary-shaped trigger and execution regressions also
  become stable `proposalKey`s without extra host mapping
- `cli_workflow` input returns a non-zero exit with stderr mentioning
  `cautilus scenario normalize workflow`

## Canonical Artifact

- [skill-normalization.md](./skill-normalization.md)

## Source References

- [scenario-proposal-sources.md](./scenario-proposal-sources.md)
- [scenario-proposal-inputs.md](./scenario-proposal-inputs.md)
- [workflow-normalization.md](./workflow-normalization.md)
