# Debug Review: doctor first bounded run eval template
Date: 2026-04-26

## Problem

Running the Cautilus startup workflow from the default adapter produced a ready `doctor` payload whose `first_bounded_run` command failed immediately.
The exact error was:

```text
Adapter does not define eval_test_command_templates
```

## Correct Behavior

Given `cautilus doctor --repo-root .` returns `ready: true`, when it includes `first_bounded_run`, then the suggested `cautilus eval test` loop should be runnable with the selected adapter.
If an adapter only defines `executor_variants`, then it may support bounded review after a report packet exists, but it should not be treated as an eval-test-ready adapter.

## Observed Facts

- `./bin/cautilus healthcheck --json` returned healthy for Cautilus v0.13.0 with 55 registered commands.
- Default `doctor` returned `status=ready` and suggested completing `first_bounded_run`.
- The root adapter had `executor_variants` and `full_gate_command_templates`, but no `eval_test_command_templates`.
- `cautilus eval test --repo-root /home/hwidong/codes/cautilus --fixture fixtures/eval/whole-repo/checked-in-agents-routing.fixture.json --output-dir /tmp/cautilus-first-run` failed before preparing a run.
- The named `self-dogfood-eval` adapter already had an eval test template and the same checked-in fixture.
- A public web search for the exact error string did not surface an external cause, so the incident was local product behavior.

## Reproduction

Before the fix, run:

```bash
./bin/cautilus doctor --repo-root .
./bin/cautilus eval test --repo-root /home/hwidong/codes/cautilus --fixture fixtures/eval/whole-repo/checked-in-agents-routing.fixture.json --output-dir /tmp/cautilus-first-run
```

The second command exits 1 with `Adapter does not define eval_test_command_templates`.

## Candidate Causes

- The default adapter was missing the eval-test runner required by the public first-run contract.
- `doctor` incorrectly treated review `executor_variants` as sufficient for the eval-test execution surface.
- The first bounded-run guide was too generic and did not distinguish review-only adapters from eval-test-ready adapters.
- A stale installed binary might have been used instead of the source checkout, but healthcheck showed the source checkout was active.

## Hypothesis

If the root adapter declares an actual eval-test template and `doctor` only marks the repo eval execution surface ready when `eval_test_command_templates` is present, then the default first bounded run will complete and executor-only adapters will no longer get an invalid first-run handoff.

## Verification

Patched `.agents/cautilus-adapter.yaml` to declare the whole-repo self-dogfood fixture and runner.
Patched `internal/runtime/adapter.go` so `execution_surface` requires `eval_test_command_templates`, while explaining that `executor_variants` alone are review-only.
Added `TestCLIDoctorDoesNotTreatExecutorVariantsAsFirstBoundedRun`.

Ran:

```bash
go test ./internal/runtime ./internal/app -run 'TestCLIDoctor|TestDoctor'
./bin/cautilus doctor --repo-root .
./bin/cautilus eval test --repo-root /home/hwidong/codes/cautilus --fixture fixtures/eval/whole-repo/checked-in-agents-routing.fixture.json --output-dir /tmp/cautilus-first-run
./bin/cautilus eval evaluate --input /tmp/cautilus-first-run/eval-observed.json --output /tmp/cautilus-first-run/eval-summary.recheck.json
```

The focused tests passed.
Default `doctor` returned ready with runnable eval templates.
The bounded run completed with `recommendation=accept-now`, and the recheck summary also returned `recommendation=accept-now`.

## Root Cause

`DoctorRepo` used `eval_test_command_templates || executor_variants` for the `execution_surface` readiness check, but `first_bounded_run` always points at `cautilus eval test`.
That allowed a review-only adapter to be reported as ready for an eval-test loop it could not execute.

## Seam Risk

- Interrupt ID: doctor-first-bounded-run-eval-template
- Risk Class: none
- Seam: adapter readiness classification versus CLI first-run guidance
- Disproving Observation: review executor variants are runnable commands, but they do not produce `eval-observed.json` for `eval evaluate`
- What Local Reasoning Cannot Prove: whether downstream consumers rely on executor-only adapters being `doctor ready`
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep repo-scope `doctor` readiness tied to the command family named by its next action.
If future adapters are ready for a non-eval workflow, add a distinct next action instead of reusing `first_bounded_run`.
