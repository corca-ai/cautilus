# Skill Scenario Normalization Contract

`Cautilus` should also support a first-class `skill` normalization helper that
turns durable skill trigger, skill execution, or workflow-evaluation summaries
into scenario proposal candidates.

This helper is needed because some consumers do not look like chatbot-thread
stores, but they still produce the same kind of reusable
evaluation signals:

- deterministic validation or smoke-scenario failures
- skill trigger-selection failures
- skill execution-quality regressions
- durable operator guidance regressions
- blocked workflow artifacts whose shape should become scenario coverage

The helper should own candidate shaping for those signals without taking over
repo-specific runtime or storage readers.

## Problem

If `Cautilus` starts only at hand-written `proposalCandidates`, each consumer
must separately rediscover how to convert failed smoke scenarios, blocked run
artifacts, and operator workflow regressions into reusable scenario proposals.

If `Cautilus` starts too early, it becomes a repo-specific log reader.

The product boundary should instead be:

`host run/artifact summaries -> skill normalization helper -> proposalCandidates -> scenario prepare-input -> scenario propose`

When the host already uses the first-class `skill evaluate` seam, the chain can
be:

`host-observed skill eval packet -> skill evaluate -> skill evaluation summary -> skill normalization helper`

When the operator starts from a checked-in case suite instead, the chain can be:

`checked-in skill cases -> skill test -> observed skill eval packet -> skill evaluate -> skill evaluation summary -> skill normalization helper`

## Current Slice

The first `skill` normalization helper now exists as:

- [skill-proposal-candidates.mjs](../../scripts/agent-runtime/skill-proposal-candidates.mjs)
- [normalize-skill-proposals.mjs](../../scripts/agent-runtime/normalize-skill-proposals.mjs)

This slice fixes the initial contract for turning normalized evaluation and
workflow summaries into `proposalCandidates`.
It now accepts both the older `cautilus.skill_normalization_inputs.v1` packet
and the newer `cautilus.skill_evaluation_summary.v1` summary packet.

## Representative Consumers

- one checked-in skill-validation fixture
  - captures deterministic validation and smoke-scenario drift
- one checked-in skill-evaluation fixture
  - captures trigger-selection and execution-quality regressions
- one checked-in workflow-recovery fixture
  - captures blocked durable workflow and replay-seed regressions
- future mixed consumers
  - may reuse the same helper as long as they emit normalized summaries

## Input Boundary

The first helper should consume normalized summaries, not raw repo files or
command execution.

Minimum input class:

- `evaluationRuns`
  - `targetKind`
  - `targetId`
  - optional `intentProfile`
  - optional `displayName`
  - `surface`
    - examples: `smoke_scenario`, `bootstrap`, `trigger_selection`,
      `execution_quality`, `real_device_acceptance`, `replay_seed`
  - `startedAt`
  - `status`
    - examples: `passed`, `failed`, `degraded`, `blocked`
  - `summary`
  - optional `blockerKind`
  - optional `artifactRefs`
  - optional `metrics`

The helper must not:

- run repo commands on its own
- traverse a repo looking for `SKILL.md`, `scenario.yaml`, or logs
- depend on one repo's local directory layout

## Output Boundary

The helper must emit `proposalCandidates` compatible with
[scenario-proposal-inputs.md](./scenario-proposal-inputs.md).

Current candidate family for the first helper:

- `fast_regression`
  - deterministic skill/eval regressions
  - blocked workflow or resumability regressions, tagged with
    `operator-recovery`

The helper may emit an optional shared `intentProfile` using
`cautilus.behavior_intent.v1`.
When the host does not declare one, the helper may derive a thin profile for:

- `skill_validation`
- `operator_workflow_recovery`

Those derived profiles should use the shared product-owned dimension catalog
instead of repo-specific validation IDs.

## Pattern Classes In Scope

The first `skill` helper should cover two proven subtypes.

### 1. Skill And Validation Drift

Seen in the validation-shaped fixture:

- checked-in adapter bootstrap regressions
- smoke scenario failures for public-skill or profile validation
- missing or stale scenario coverage for declared validation surfaces

### 2. Skill Trigger And Execution Drift

Seen in the evaluation-shaped fixture:

- prompts that should have invoked the skill but did not
- prompts that should have stayed outside the skill but still invoked it
- execution runs that completed functionally but crossed the declared token or
  runtime budget
- execution runs that produced degraded or failed task outcomes after the skill
  was invoked

### 3. Durable Operator Workflow Regressions

Seen in the workflow-recovery fixture:

- blocked or degraded persisted workflow artifacts
- repeated blocked-step waste in replay-seed scenarios
- operator guidance regressions where a durable workflow should become an
  evaluation case instead of recurring prose

The workflow-shaped fixture is still a valid reference because the shared shape
is durable operator workflow evaluation rather than chat continuity.

## Fixed Decisions

- `skill` normalization is product-owned; runtime readers and command runners
  stay consumer-owned.
- The helper consumes normalized workflow summaries, not repo-local scans of
  `skills/`, `profiles/`, `runs/`, or CI logs.
- the validation-shaped fixture is the primary reference for skill/profile
  validation shape
- the evaluation-shaped fixture is the primary reference for trigger and
  execution quality shape
- the workflow-shaped fixture is the primary reference for blocked durable
  workflow artifacts
- The helper should output proposal candidates that can feed the existing
  `scenario prepare-input` and `scenario propose` chain unchanged.

## Probe Questions

- Should `operator_recovery` eventually become a first-class benchmark family
  instead of a tag on top of `fast_regression`?
- Does a future workflow-heavy consumer eventually justify a third dedicated helper, or is the shared
  durable-workflow contract enough?

## Deferred Decisions

- whether helper-specific input schemas should eventually share one common
  versioning or migration policy

## Non-Goals

- reading profile files or skill directories directly
- running smoke scenarios
- replacing repo-native deterministic gates
- modeling conversational follow-up behavior

## Constraints

- no hidden repo discovery
- no network or command execution inside the helper
- input/output remain deterministic and file-based
- helper output must stay reusable across validation-heavy, workflow-heavy, and
  later consumers

## Success Criteria

- a validation-heavy consumer can normalize failed smoke-scenario or validation summaries into
  reusable proposal candidates without teaching `Cautilus` how to read the
  whole repo.
- a workflow-heavy consumer can normalize blocked persisted workflow summaries into reusable
  proposal candidates without giving `Cautilus` Appium or iOS runtime ownership.
- The same helper contract can describe both skill validation and durable
  workflow artifact regressions without collapsing back into one repo's file
  layout.

## Acceptance Checks

- fixture: validation-shaped failed smoke scenario for a public skill becomes a
  candidate with stable `proposalKey`
- fixture: evaluation-summary-shaped trigger and execution regressions also
  become stable `proposalKey`s without extra host mapping
- fixture: workflow-shaped degraded run with `blocked_steps` evidence becomes a
  candidate with operator-recovery rationale
- fixture: helper output feeds directly into `scenario prepare-input` or
  `scenario propose` without extra mapping

## Canonical Artifact

- [skill-normalization.md](./skill-normalization.md)

## First Implementation Slice

- keep one validation-shaped fixture, one skill-evaluation-shaped fixture, and
  one workflow-shaped fixture checked in
- maintain the pure helper and CLI against those fixtures
- maintain the dedicated checked-in input schema artifact beside the fixture

## Source References

- [scenario-proposal-sources.md](./scenario-proposal-sources.md)
- [scenario-proposal-inputs.md](./scenario-proposal-inputs.md)
- [scenario-proposal-sources.md](./scenario-proposal-sources.md)
