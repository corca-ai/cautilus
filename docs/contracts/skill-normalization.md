# Skill Scenario Normalization Contract

`Cautilus` should also support a first-class `skill` normalization helper that
turns durable skill- or workflow-evaluation summaries into scenario proposal
candidates.

This helper is needed because repos such as `charness` and `crill` do not look
like chatbot-thread stores, but they still produce the same kind of reusable
evaluation signals:

- deterministic validation or smoke-scenario failures
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

## Current Slice

Define the canonical input/output contract for the first `skill`
normalization helper.

This slice is design-only. It fixes the boundary before code exists.

## Representative Consumers

- `charness`
  - repo-owned eval scenarios in
    [/home/ubuntu/charness/scripts/eval_registry.py](/home/ubuntu/charness/scripts/eval_registry.py)
  - validation tiers and smoke scenario expectations in
    [/home/ubuntu/charness/docs/public-skill-validation.md](/home/ubuntu/charness/docs/public-skill-validation.md)
  - profile `validation.smoke_scenarios` contracts in
    [/home/ubuntu/charness/profiles/profile.schema.json](/home/ubuntu/charness/profiles/profile.schema.json)
- `crill`
  - persisted `scenario.yaml` and `replay-result.json` style artifacts in
    [/home/ubuntu/crill/docs/architecture.md](/home/ubuntu/crill/docs/architecture.md)
  - blocked-step and replay-seed metadata in
    [/home/ubuntu/crill/src/crill/output/scan_scenario.py](/home/ubuntu/crill/src/crill/output/scan_scenario.py)
- `ceal`
  - skill-like adapter consumers such as `skill-smoke` still matter as later
    dogfood, but are not the only design center

## Input Boundary

The first helper should consume normalized summaries, not raw repo files or
command execution.

Minimum input classes:

- `workflowTargets`
  - `targetKind`
    - examples: `public_skill`, `profile`, `integration`, `cli_workflow`
  - `targetId`
  - `displayName`
- `evaluationRuns`
  - `targetKind`
  - `targetId`
  - `surface`
    - examples: `smoke_scenario`, `bootstrap`, `real_device_acceptance`,
      `replay_seed`
  - `startedAt`
  - `status`
    - examples: `passed`, `failed`, `degraded`, `blocked`
  - `summary`
  - optional `blockerKind`
  - optional `artifactRefs`
  - optional `metrics`
- `existingSkillScenarios`
  - current checked-in scenario or eval identifiers already associated with the
    target

The helper must not:

- run repo commands on its own
- traverse a repo looking for `SKILL.md`, `scenario.yaml`, or logs
- depend on one repo's local directory layout

## Output Boundary

The helper must emit `proposalCandidates` compatible with
[scenario-proposal-inputs.md](/home/ubuntu/cautilus/docs/contracts/scenario-proposal-inputs.md).

Likely candidate families for the first helper:

- `fast_regression`
  - deterministic skill/eval regressions
- `operator_recovery`
  - blocked workflow or resumability regressions

The family names above are helper-level concepts, not raw repo labels. The
final set may be adjusted during implementation, but the output still has to
fit the current `proposalCandidates` contract.

## Pattern Classes In Scope

The first `skill` helper should cover two proven subtypes.

### 1. Skill And Validation Drift

Seen in `charness`:

- checked-in adapter bootstrap regressions
- smoke scenario failures for public-skill or profile validation
- missing or stale scenario coverage for declared validation surfaces

### 2. Durable Operator Workflow Regressions

Seen in `crill`:

- blocked or degraded persisted workflow artifacts
- repeated blocked-step waste in replay-seed scenarios
- operator guidance regressions where a durable workflow should become an
  evaluation case instead of recurring prose

`crill` is not a skill repo, but it is a valid reference because the shared
shape is durable operator workflow evaluation rather than chat continuity.

## Fixed Decisions

- `skill` normalization is product-owned; runtime readers and command runners
  stay consumer-owned.
- The helper consumes normalized workflow summaries, not repo-local scans of
  `skills/`, `profiles/`, `runs/`, or CI logs.
- `charness` is the primary reference for skill/profile validation shape.
- `crill` is the primary reference for blocked durable workflow artifacts.
- The helper should output proposal candidates that can feed the existing
  `scenario prepare-input` and `scenario propose` chain unchanged.

## Probe Questions

- Should `operator_recovery` become a first-class benchmark family, or stay a
  tag on top of `fast_regression` for the first version?
- Should the helper accept one generic `evaluationRuns` packet, or separate
  packets for skill validation and workflow artifact summaries?
- Does `crill` eventually justify a third dedicated helper, or is the shared
  durable-workflow contract enough?

## Deferred Decisions

- exact CLI surface name, likely `cautilus scenario normalize skill`
- exact normalized packet schema for `workflowTargets` and `evaluationRuns`

## Non-Goals

- reading profile files or skill directories directly
- running smoke scenarios
- replacing repo-native deterministic gates
- modeling conversational follow-up behavior

## Constraints

- no hidden repo discovery
- no network or command execution inside the helper
- input/output remain deterministic and file-based
- helper output must stay reusable across `charness`, `crill`, and later
  consumers

## Success Criteria

- `charness` can normalize failed smoke-scenario or validation summaries into
  reusable proposal candidates without teaching `Cautilus` how to read the
  whole repo.
- `crill` can normalize blocked persisted workflow summaries into reusable
  proposal candidates without giving `Cautilus` Appium or iOS runtime ownership.
- The same helper contract can describe both skill validation and durable
  workflow artifact regressions without collapsing back into one repo's file
  layout.

## Acceptance Checks

- fixture: `charness`-like failed smoke scenario for a public skill becomes a
  candidate with stable `proposalKey`
- fixture: `crill`-like degraded run with `blocked_steps` evidence becomes a
  candidate with operator-recovery rationale
- fixture: helper output feeds directly into `scenario prepare-input` or
  `scenario propose` without extra mapping

## Canonical Artifact

- [skill-normalization.md](/home/ubuntu/cautilus/docs/contracts/skill-normalization.md)

## First Implementation Slice

- fix the normalized summary packet shape for one `charness`-like fixture and
  one `crill`-like fixture
- implement a pure helper that converts those summaries into
  `proposalCandidates`
- add CLI only after fixtures and helper logic are stable

## Source References

- [scenario-proposal-sources.md](/home/ubuntu/cautilus/docs/contracts/scenario-proposal-sources.md)
- [scenario-proposal-inputs.md](/home/ubuntu/cautilus/docs/contracts/scenario-proposal-inputs.md)
- [/home/ubuntu/charness/docs/public-skill-validation.md](/home/ubuntu/charness/docs/public-skill-validation.md)
- [/home/ubuntu/charness/scripts/eval_registry.py](/home/ubuntu/charness/scripts/eval_registry.py)
- [/home/ubuntu/charness/profiles/profile.schema.json](/home/ubuntu/charness/profiles/profile.schema.json)
- [/home/ubuntu/crill/docs/architecture.md](/home/ubuntu/crill/docs/architecture.md)
- [/home/ubuntu/crill/src/crill/output/scan_scenario.py](/home/ubuntu/crill/src/crill/output/scan_scenario.py)
