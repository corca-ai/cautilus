# Debug Review: evaluation proof prompt fixture mode
Date: 2026-04-30

## Problem

The new blocker-preservation regression test failed before reaching proof assertions.

## Correct Behavior

Given a proof-normalization test uses the app/prompt evaluator, when it builds an observed record, then the record must satisfy the app/prompt observed-packet contract so the test exercises proof behavior instead of fixture shape errors.

## Observed Facts

- The failing command was `go test ./internal/runtime ./internal/app -run 'EvaluationProof|EvalTestRunsAppChat|ReportPacketSummarizesBlocked|OptimizeInputRejectsBlocked'`.
- The exact error was `BuildAppPromptEvaluationSummary returned error: evaluations[0].mode must be "messaging" for app/prompt`.
- Existing app/prompt fixtures use `mode: messaging`.
- The new test used `mode: prompt` and used `observed.output` instead of app/prompt `input`, `messages`, and `finalText`.

## Reproduction

```bash
go test ./internal/runtime ./internal/app -run 'EvaluationProof|EvalTestRunsAppChat|ReportPacketSummarizesBlocked|OptimizeInputRejectsBlocked'
```

## Candidate Causes

- The test author inferred the mode name from the preset name instead of the evaluator contract.
- The fixture copied a prompt-shaped payload idea instead of the existing app/prompt observed shape.
- The proof assertion was added in a low-level runtime test without reusing `validAppPromptObservedRecord`.

## Hypothesis

If the fixture uses `mode: messaging` and supplies app/prompt observed fields, then the test will reach the proof-blocker assertion and validate the intended regression.

## Verification

Rerun the targeted Go command and then the full verification gate.

## Root Cause

The regression test fixture violated the app/prompt evaluator contract.
The production proof code was not reached.

## Seam Risk

- Interrupt ID: evaluation-proof-prompt-fixture-mode
- Risk Class: none
- Seam: runtime test fixture shape
- Disproving Observation: evaluator rejected the fixture before proof normalization ran
- What Local Reasoning Cannot Prove: whether full verification still passes after the fixture repair
- Generalization Pressure: none

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When adding proof tests through an existing evaluator, copy the evaluator's valid observed-record shape before changing only the proof metadata under test.
