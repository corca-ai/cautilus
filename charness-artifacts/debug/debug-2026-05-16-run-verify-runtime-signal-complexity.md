# Run Verify Runtime Signal Complexity Debug
Date: 2026-05-16

## Problem

`npm run verify -- --runtime-signal charness-artifacts/quality/runtime-latest.json` failed immediately at `lint:eslint`.

## Correct Behavior

Given `scripts/run-verify.mjs` can optionally write a structured runtime signal packet, when `npm run verify -- --runtime-signal <file>` runs, then the normal verify phases should still satisfy the repo ESLint complexity budget and the runtime packet should be written on pass or failure.

## Observed Facts

- `npm run verify -- --runtime-signal charness-artifacts/quality/runtime-latest.json` stopped in the first phase.
- ESLint reported `Function 'runPhases' has a complexity of 13. Maximum allowed is 12`.
- The new runtime-signal patch had inserted phase result construction and runtime-signal writes directly into the existing phase loop.
- Focused tests for `scripts/run-verify.test.mjs` passed before the full verify attempt, but focused tests do not enforce ESLint complexity.

## Reproduction

```bash
npm run verify -- --runtime-signal charness-artifacts/quality/runtime-latest.json
```

Before the repair, the command failed during `lint:eslint`.

## Candidate Causes

- `runPhases` mixed phase execution, result normalization, failure shaping, runtime-signal writing, and summary output in one function.
- The success and failure branches duplicated phase-result object construction.
- The optional runtime-signal feature was added as inline control flow instead of as a side-effect helper.

## Hypothesis

If phase command construction, phase result construction, and final runtime-signal writing move into helpers, then `runPhases` should preserve behavior while dropping below the complexity limit.

## Verification

- `npx eslint scripts/run-verify.mjs scripts/run-verify.test.mjs` passes after the helper extraction.
- `node --test scripts/run-verify.test.mjs` passes after the helper extraction and covers pass and failure runtime-signal file writes.

## Root Cause

The runtime-signal feature expanded an already central loop by adding sibling branches for packet collection and side-effect writing.
The behavior was correct in focused tests, but the maintainability gate caught that the implementation had crossed the repo complexity threshold.

## Detection Gap

- ESLint | focused runtime-signal tests did not enforce complexity | run `npx eslint` or `npm run lint:eslint` after adding optional behavior to central workflow loops.

## Sibling Search

- Mental model: runtime-signal writing is a small optional appendage.
- Verify runner axis: `runPhases` needed helper extraction because it is already the central loop for stop-gate execution.
- Packet writer axis: future signal fields should be added to `runtimeSignalPayload`, not to the phase loop.
- Prior incident axis: this repeats the scanner/projection complexity pattern from `debug-2026-05-13-surface-critique-packet-complexity.md` and `debug-2026-05-16-deployment-evidence-cache-telemetry-complexity.md`.

## Seam Risk

- Interrupt ID: run-verify-runtime-signal-complexity
- Risk Class: none
- Seam: standing gate runner maintainability
- Disproving Observation: ESLint caught the regression before commit.
- What Local Reasoning Cannot Prove: whether future quality runtime capture should include non-verify inventory commands in the same packet.
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep optional packet writing out of central execution loops.
When adding runtime capture to a gate runner, add focused tests plus focused ESLint before starting the full gate.

## Related Prior Incidents

- `debug-2026-05-13-surface-critique-packet-complexity.md`: a scanner exceeded complexity when rule-family logic stayed inline.
- `debug-2026-05-16-deployment-evidence-cache-telemetry-complexity.md`: packet projection changes exceeded complexity before helper extraction.
