# Debug Review: scenario builder registry validation panic
Date: 2026-07-11

## Problem

`BuildScenarioProposalPacket` and `BuildScenarioConversationReview` return `(map[string]any, error)` but shared validation panics when an existing scenario registry entry has an empty `scenarioKey`.
The CLI masks this with global panic recovery, while direct runtime callers cannot handle the validation failure through the advertised error channel.

## Correct Behavior

Malformed existing registry data must return a field-indexed error from both scenario builders without panic.
Valid packet generation and the CLI's concise error behavior must remain unchanged.

## Observed Facts

- `readScenarioKeys` panics at an empty normalized `scenarioKey`.
- Both scenario builders invoke it inline before calling `GenerateScenarioProposals`, despite returning an error.
- `app.invokeHandler` globally recovers panics and makes the CLI exit 1, so current operator output is bounded.
- Direct runtime callers have no local recovery contract and would unwind unexpectedly.
- Other proposal candidate validation in `GenerateScenarioProposals` returns indexed errors normally.

## Reproduction

- Call either scenario builder with the correct input schema and `existingScenarioRegistry: [{"scenarioKey":" "}]`.
- Observe a panic with `existingScenarioRegistry[0].scenarioKey must be a non-empty string` instead of a returned error.

## Candidate Causes

- Panic was used as a shortcut because `readScenarioKeys` originally returned only a slice.
- CLI global recovery was treated as the validation contract.
- Empty keys were considered impossible after upstream schema validation.
- Registry entries with invalid shapes were intentionally skipped, and empty strings accidentally received stricter handling.

## Hypothesis

- Falsifiable claim: `readScenarioKeys` is the only panic source for this input; changing it to return `([]string, error)` and propagating the error from both scenario builders will make direct unit tests pass without altering valid generation | disconfirmer: add the direct malformed-registry table and observe another panic after error propagation.

## Verification

- confirmed — the proposal-builder test panicked against old code; after typing the shared helper's failure and updating both compile-time consumers, the two-builder table returns the indexed error and focused valid runtime/CLI scenario tests pass.

## Root Cause

A validation helper's return type cannot represent failure, so one malformed branch bypasses the surrounding error-based API.
The CLI's broad recovery hides the contract mismatch from process-level smoke tests.

## Invariant Proof

- Invariant: every deterministic input validation failure in both `BuildScenarioProposalPacket` and `BuildScenarioConversationReview` returns an error and never panics.
- Producer Proof: direct runtime table covers both scenario builders with an indexed empty registry key.
- Final-Consumer Proof: both direct runtime calls return the expected field path; existing proposal/conversation CLI and valid generation tests continue to pass.
- Interface-Shape Sibling Scan: scenario coverage intentionally skips missing keys and proposal candidate validation already returns errors; neither shares the required registry identity contract.
- Non-Claims: this slice does not reject non-object registry entries, tighten scenario coverage validation, or remove CLI global panic recovery.

## Detection Gap

- proposal runtime tests and CLI smoke | valid packets and candidate validation were covered, but malformed existing registry identity was not sampled directly | add a direct non-panic error test.

## Sibling Search

- Mental model: upstream schema validation makes registry keys impossible to omit.
- same layer axis: both callers of `readScenarioKeys` | decision: same bug, fix now | proof: the compile-time consumer inventory exposed both error-returning builders.
- abstraction up axis: runtime builders returning errors | decision: same bug, fix now | proof: this builder already advertises error and candidate validation follows it.
- specialization down axis: non-object registry entries | decision: intentional plain-text or non-rendering boundary | proof: existing helper intentionally skips them and this slice does not redefine that contract.
- mental-model axis: `readScenarioCoverage` missing keys | decision: intentional plain-text or non-rendering boundary | proof: coverage is optional enrichment rather than registry identity.
- cross-file: `internal/runtime/proposals.go` owns validation and `internal/runtime/proposals_test.go` owns direct runtime proof; `internal/app/app.go` recovery remains unchanged.

## Seam Risk

- Interrupt ID: scenario-proposal-registry-validation-panic
- Risk Class: none
- Seam: structured proposal input validation to runtime error API
- Disproving Observation: malformed registry returns the indexed error from both builders without recover, and valid runtime/CLI scenario tests pass.
- What Local Reasoning Cannot Prove: all panic sources across unrelated runtime builders.
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Represent registry validation failure in the helper's type, propagate it through the builder's existing error return, and pin the direct call rather than relying on CLI-wide panic recovery.
