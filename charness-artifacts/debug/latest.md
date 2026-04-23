# Instruction Surface Nested Override Debug
Date: 2026-04-24

## Problem

`./bin/cautilus instruction-surface test --repo-root . --adapter-name self-dogfood-instruction-surface` exited 0 but returned `recommendation=reject`.
The failing evaluation was `nested-override-routing`.

## Correct Behavior

Given an instruction-surface case with root `AGENTS.md` plus `apps/demo/AGENTS.md`,
when the prompt asks the runner to review the scoped task before routing,
then the observed packet should either load both root and nested instruction files or the case expectation should explicitly allow the scoped nested file to be the entry point.

## Observed Facts

- The checked-in root `AGENTS.md` routing case passed after commit `6466341`.
- The overall instruction-surface summary had `recommendation=reject` because one of five evaluations failed.
- The failing live observation reported `entryFile=apps/demo/AGENTS.md`.
- The checked-in `fixtures/instruction-surface/cases.json` case expects `expectedEntryFile=AGENTS.md` and `requiredInstructionFiles=["AGENTS.md","apps/demo/AGENTS.md"]`.
- `fixtures/instruction-surface/fixture-results.json` expects the same case to load both files.
- A prior related debug note, `debug-2026-04-19-instruction-surface-routing-expectation.md`, found stale instruction-surface routing expectations after `AGENTS.md` routing semantics changed.

## Reproduction

1. Run `./bin/cautilus instruction-surface test --repo-root . --adapter-name self-dogfood-instruction-surface`.
2. Open the emitted `.cautilus/runs/<run>/instruction-surface-summary.json`.
3. Inspect `evaluations[] | select(.evaluationId=="nested-override-routing")`.

## Candidate Causes

- The live model incorrectly skipped the root instruction file even though the root file tells it to read nested overrides.
- The case prompt overemphasizes `taskPath=apps/demo`, making the model treat the nested file as the entry point.
- The case expectation is too strict if scoped nested files are now allowed to be first entry points.
- The runner prompt does not make the root-first expectation explicit enough for the bounded instruction-surface task.

## Hypothesis

If the product contract still requires root instruction discovery before nested override loading,
then the correct fix is to tighten the runner prompt or case wording so `nested-override-routing` consistently reports `AGENTS.md` plus `apps/demo/AGENTS.md`.
If scoped nested entry is now acceptable, the correct fix is to update the case expectation and fixture result together.

## Verification

- `./bin/cautilus instruction-surface evaluate --input fixtures/instruction-surface/input.json --output /tmp/cautilus-instruction-surface-fixture-summary.json` passed, but that fixture input only covers `checked-in-agents-routing`.
- `fixtures/instruction-surface/cases.json` and `fixtures/instruction-surface/fixture-results.json` both encode the root-plus-nested expectation for `nested-override-routing`.
- No fix has been applied yet.

## Root Cause

Not yet resolved.
The current evidence shows a mismatch between live model behavior and checked-in nested override expectations.

## Seam Risk

- Interrupt ID: instruction-surface-nested-override-routing
- Risk Class: external-seam
- Seam: live model instruction-surface observation
- Disproving Observation: a fixture-only evaluator pass does not prove the live runner will report root and nested instruction files consistently.
- What Local Reasoning Cannot Prove: whether future live model runs will consistently choose root-first or scoped-first entry semantics without a prompt or expectation change.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: spec
- Handoff Artifact: charness-artifacts/spec/instruction-surface-nested-override-routing.md

## Prevention

Do not treat `instruction-surface test` exit 0 as success when the summary recommendation is `reject`.
When `AGENTS.md` or routing policy changes, run the full live instruction-surface suite and update nested override expectations or prompts in the same slice when the failure is semantically valid.

## Related Prior Incidents

- `debug-2026-04-19-instruction-surface-routing-expectation.md`: a prior instruction-surface `recommendation=reject` was caused by stale routing expectations after `AGENTS.md` semantics changed.
