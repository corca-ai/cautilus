# CLI Scenario Normalization Contract

`Cautilus` should also support a first-class `cli` normalization helper that
turns repeated CLI intent/evaluation summaries into durable scenario proposal
candidates.

This helper is useful when the product surface the operator experiences is the
CLI itself:

- guidance text on stdout or stderr
- exit-code expectations
- file or scaffold side effects
- bounded operator-facing behavior contracts

The helper should own candidate shaping for those signals without turning
`Cautilus` into a generic log reader or integration-test miner.

## Problem

`cli evaluate` can already produce one bounded evaluation packet, but repeated
CLI failures still need a product-owned way to become reusable scenario
coverage.

Without this helper, each consumer must separately rediscover how to convert
operator-guidance drift and behavior-contract regressions into durable
`proposalCandidates`.

The boundary should instead be:

`host CLI eval summaries -> cli normalization helper -> proposalCandidates -> scenario prepare-input -> scenario propose`

## Current Slice

The first `cli` normalization helper now exists as:

- [cli-proposal-candidates.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/cli-proposal-candidates.mjs)
- [normalize-cli-proposals.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/normalize-cli-proposals.mjs)

This slice keeps the input deterministic and file-based while turning repeated
CLI regressions into reusable proposal candidates.

## Input Boundary

Use `cautilus.cli_normalization_inputs.v1`.

Minimum input class:

- `cliRuns`
  - `surfaceId`
  - `commandId`
  - optional `displayName`
  - `startedAt`
  - `status`
  - `intent`
  - optional `intentProfile`
  - `summary`
  - optional `commandPreview`
  - optional `failureKinds`
  - optional `expectationFailures`
  - optional `artifactRefs`
  - optional `telemetry`

The helper may consume summaries derived from `cautilus cli evaluate`, but it
does not require that exact packet shape. Consumers can map their own bounded
CLI-evaluation records into this normalized input.

## Output Boundary

The helper emits `proposalCandidates` compatible with
[scenario-proposal-inputs.md](/home/ubuntu/cautilus/docs/contracts/scenario-proposal-inputs.md).

When the host only provides a plain `intent` string, the helper may derive a
thin `cautilus.behavior_intent.v1` with `behaviorSurface: operator_cli` and
product-owned default success dimensions for the detected subtype.

Current candidate family for the first helper:

- `fast_regression`
  - repeated operator-guidance drift
  - repeated output-contract or side-effect regressions

## Pattern Classes In Scope

The first `cli` helper covers two proven subtypes.

### 1. Operator Guidance Drift

Examples:

- missing setup guidance
- ambiguous next steps after a known failure
- stdout or stderr that no longer explains the intended recovery path

### 2. Behavior-Contract Regressions

Examples:

- missing scaffold files after a supposedly successful command
- unexpected side effects
- exit-code or output-contract drift that breaks the operator expectation

## Fixed Decisions

- `cli` normalization is product-owned; raw command execution and host logging
  stay outside the helper.
- The helper consumes normalized CLI summaries, not arbitrary shell history.
- `cli evaluate` is a canonical producer for this helper, but not the only
  one.
- The helper output must feed the existing
  `scenario prepare-input -> scenario propose` chain unchanged.

## Non-Goals

- replacing deterministic CLI tests
- reading shell history or CI logs directly
- running commands inside the helper
- becoming a generic integration-test framework

## Constraints

- no hidden repo discovery
- no command execution inside the helper
- deterministic file-based input/output
- stable `proposalKey` generation for repeated CLI regressions

## Success Criteria

- a repeated `doctor`-style guidance failure becomes one stable
  operator-guidance candidate
- a repeated `adapter init`-style scaffold failure becomes one stable
  behavior-contract candidate
- helper output feeds directly into `scenario prepare-input` and
  `scenario propose`
