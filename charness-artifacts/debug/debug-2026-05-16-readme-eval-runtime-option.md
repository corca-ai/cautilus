# README Eval Runtime Option Debug
Date: 2026-05-16

## Problem

While proving the README bounded eval loop, `./bin/cautilus evaluate fixture --runtime fixture ...` failed before producing `eval-observed.json`.

## Correct Behavior

Given the README documents the normal bounded eval loop without a runtime override, when a checked-in fixture is run through a host-owned adapter, then `evaluate fixture` should produce `eval-observed.json` and `eval-summary.json`, and `evaluate observation` should reopen the observed packet into a summary packet.

## Observed Facts

- The failing command was `./bin/cautilus evaluate fixture --repo-root . --adapter-name self-dogfood-eval --fixture ./fixtures/eval/dev/repo/checked-in-agents-routing.fixture.json --runtime fixture --output-dir /tmp/cautilus-readme-bounded-eval-proof`.
- The exact stderr was `--fixture-results-file is required when --backend fixture`.
- The self-dogfood eval adapter command template passes `{backend}` through to `scripts/run-self-dogfood-eval.mjs`.
- The README example does not include `--runtime fixture`.
- The same fixture and adapter passed when run without the runtime override and produced `/tmp/cautilus-readme-bounded-eval-proof-codex/eval-observed.json` plus `/tmp/cautilus-readme-bounded-eval-proof-codex/eval-summary.json`.
- `./bin/cautilus evaluate observation --input /tmp/cautilus-readme-bounded-eval-proof-codex/eval-observed.json --output /tmp/cautilus-readme-bounded-eval-proof-codex/eval-summary-rerun.json` exited 0.

## Reproduction

```bash
rm -rf /tmp/cautilus-readme-bounded-eval-proof
./bin/cautilus evaluate fixture \
  --repo-root . \
  --adapter-name self-dogfood-eval \
  --fixture ./fixtures/eval/dev/repo/checked-in-agents-routing.fixture.json \
  --runtime fixture \
  --output-dir /tmp/cautilus-readme-bounded-eval-proof
```

The command fails before producing `eval-observed.json`.

## Candidate Causes

- The `fixture` runtime intentionally requires a fixture-results file, and this adapter template does not provide one.
- The README proof command was accidentally widened with a runtime override that the README does not promise.
- The adapter's default runtime path might be broken, and the fixture override exposed a broader runner issue.

## Hypothesis

If the failure is caused by the unsupported `--runtime fixture` override rather than the README loop, then rerunning the same checked-in fixture without the override should produce the observed and summary packets, and `evaluate observation` should reopen the observed packet.

## Verification

- `./bin/cautilus evaluate fixture --repo-root . --adapter-name self-dogfood-eval --fixture ./fixtures/eval/dev/repo/checked-in-agents-routing.fixture.json --output-dir /tmp/cautilus-readme-bounded-eval-proof-codex` exited 0.
- The run produced `eval-observed.json` with `schemaVersion=cautilus.evaluation_observed.v1`.
- The run produced `eval-summary.json` with `schemaVersion=cautilus.evaluation_summary.v1`, `recommendation=accept-now`, and `evaluationCounts.passed=1`.
- `./bin/cautilus evaluate observation --input /tmp/cautilus-readme-bounded-eval-proof-codex/eval-observed.json --output /tmp/cautilus-readme-bounded-eval-proof-codex/eval-summary-rerun.json` exited 0 with the same summary shape.

## Root Cause

The proof attempt added a runtime override that changed the adapter backend to `fixture`.
That backend requires a separate fixture-results file for this runner.
The README claim is about the normal adapter-owned bounded eval loop, so the override was outside the claim boundary.

## Detection Gap

- README proof selection | no gate warned that the proof command had been widened beyond the documented example | keep evidence bundles explicit about runtime overrides and record when a failed probe was outside the claim boundary.

## Sibling Search

- Mental model: cheap fixture runtime is always the safest proof path.
- Adapter axis: other adapters with `--runtime fixture` may also require a fixture-results file.
- Documentation axis: README examples should stay narrower than runtime-specific smoke probes.
- Evidence axis: evidence bundles should record the exact command so future reviewers can see when a proof depends on default adapter runtime versus a forced runtime.

## Seam Risk

- Interrupt ID: readme-eval-runtime-option
- Risk Class: none
- Seam: adapter runtime selection
- Disproving Observation: the documented default runtime path produced observed and summary packets.
- What Local Reasoning Cannot Prove: whether every adapter's fixture runtime should expose a friendlier missing fixture-results hint.
- Generalization Pressure: none

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When proving README examples, start with the command shape the README actually shows.
Use runtime overrides only when the claim or adapter contract names that runtime.

## Related Prior Incidents

- None.
