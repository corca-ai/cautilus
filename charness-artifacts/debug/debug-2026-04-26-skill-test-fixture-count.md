# Debug Review: skill test fixture count
Date: 2026-04-26

## Problem

`node --test --test-reporter=dot --test-reporter-destination=stdout scripts/agent-runtime/run-local-skill-test.test.mjs scripts/run-self-dogfood-eval.test.mjs` failed after adding a new bundled-skill self-dogfood fixture case.
The exact assertion was:

```text
AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

3 !== 2

at TestContext.<anonymous> (file:///home/hwidong/codes/cautilus/scripts/agent-runtime/run-local-skill-test.test.mjs:27:9)
```

## Correct Behavior

Given `fixtures/eval/skill/internal-runner-cases.json` adds a third Cautilus skill case, when the fixture-backed runner test materializes a packet, then the test should expect three evaluations and assert the new case's normalized fields.

## Observed Facts

- The new case is `execution-cautilus-no-input-claim-discovery-status`.
- `buildObservedSkillEvaluationInput` correctly emitted three evaluations.
- The test still asserted `packet.evaluations.length === 2`.
- The fixture results file had matching output for the new case.

## Reproduction

Run:

```bash
node --test --test-reporter=dot --test-reporter-destination=stdout scripts/agent-runtime/run-local-skill-test.test.mjs scripts/run-self-dogfood-eval.test.mjs
```

The failure occurs in `buildObservedSkillEvaluationInput materializes a normalized packet from fixture-backed skill test results`.

## Candidate Causes

- The test hard-coded the old fixture case count.
- The fixture results file might be missing the new case.
- The runner might be duplicating one case unexpectedly.

## Hypothesis

If the test expectation is updated from two cases to three and asserts the new case id, outcome, threshold, and duration, then the fixture-backed runner test should pass without changing runner behavior.

## Verification

Updated `scripts/agent-runtime/run-local-skill-test.test.mjs` to expect three evaluations and check the no-input claim discovery fixture result.
Rerunning the focused node test is part of the implementation closeout.

## Root Cause

The fixture-backed test encoded the fixture's old cardinality instead of treating the checked-in fixture as the evolving self-dogfood surface.

## Seam Risk

- Interrupt ID: skill-test-fixture-count
- Risk Class: none
- Seam: checked-in skill self-dogfood fixture and fixture-backed runner test
- Disproving Observation: the runner emitted the intended new evaluation but the test expected the old count
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When adding a checked-in fixture case, update the fixture-backed runner test to assert the new case explicitly instead of only changing the fixture files.
