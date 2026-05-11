# Debug Review
Date: 2026-05-11

## Problem

`cautilus eval test --repo-root . --adapter-name self-dogfood-refresh-flow --runtime fixture --output-dir /tmp/cautilus-remaining-stale-proof-2026-05-11/refresh-flow-eval` failed before writing `eval-observed.json`.

## Correct Behavior

Given the `self-dogfood-refresh-flow` adapter declares a checked-in multi-turn fixture and checked-in fixture results, when `cautilus eval test` runs that adapter with `--runtime fixture`, then the adapter-owned runner should receive the fixture results file and produce `eval-cases.json`, `eval-observed.json`, and `eval-summary.json`.

Given the same adapter is run with Codex or Claude backends, when the optional fixture results argument is present, then the wrapper should continue to ignore it unless the backend is `fixture`.

## Observed Facts

- The failed command printed `eval test (dev/skill) commands failed before producing /tmp/cautilus-remaining-stale-proof-2026-05-11/refresh-flow-eval/eval-observed.json`.
- `/tmp/cautilus-remaining-stale-proof-2026-05-11/refresh-flow-eval/eval-test-1.stderr` contained `--fixture-results-file is required when --backend fixture`.
- `.agents/cautilus-adapters/self-dogfood-refresh-flow.yaml` listed `fixtures/eval/dev/skill/cautilus-refresh-flow-fixture-results.json` under `artifact_paths`, but its `eval_test_command_templates` did not pass `--fixture-results-file`.
- `fixtures/eval/dev/skill/cautilus-refresh-flow.fixture.json` contains one execution case with two `turns`.
- `fixtures/eval/dev/skill/cautilus-refresh-flow-fixture-results.json` contains the matching `episode-cautilus-refresh-flow` fixture result.

## Reproduction

```bash
./bin/cautilus eval test --repo-root . --adapter-name self-dogfood-refresh-flow --runtime fixture --output-dir /tmp/cautilus-remaining-stale-proof-2026-05-11/refresh-flow-eval
sed -n '1,160p' /tmp/cautilus-remaining-stale-proof-2026-05-11/refresh-flow-eval/eval-test-1.stderr
```

Before the fix, the command exited non-zero and stderr showed `--fixture-results-file is required when --backend fixture`.

## Candidate Causes

- The adapter template did not pass the checked-in fixture results file to the wrapper.
- The wrapper failed to substitute `{backend}` into `fixture` correctly.
- The fixture results file existed but had a mismatched case id, so the wrapper rejected it.

## Hypothesis

If the adapter template omission is the cause, then adding `--fixture-results-file fixtures/eval/dev/skill/cautilus-refresh-flow-fixture-results.json` to the `self-dogfood-refresh-flow` `eval_test_command_templates` entry should make the same `cautilus eval test --runtime fixture` command pass without changing the fixture or runner code.

## Verification

After adding the fixture results argument to the adapter template, the exact same command passed:

```bash
./bin/cautilus eval test --repo-root . --adapter-name self-dogfood-refresh-flow --runtime fixture --output-dir /tmp/cautilus-remaining-stale-proof-2026-05-11/refresh-flow-eval
```

It produced `/tmp/cautilus-remaining-stale-proof-2026-05-11/refresh-flow-eval/eval-summary.json` with `recommendation=accept-now`.

## Root Cause

The `self-dogfood-refresh-flow` adapter declared the fixture result artifact but did not pass it to the adapter-owned runner template.

The wrapper correctly required `--fixture-results-file` for `--backend fixture`; the adapter command template was incomplete.

## Seam Risk

- Interrupt ID: self-dogfood-refresh-flow-fixture-template-missing-results
- Risk Class: contract-freeze-risk
- Seam: Cautilus adapter template to adapter-owned runner wrapper
- Disproving Observation: a checked-in fixture-results artifact existed, but the runtime command template did not pass it when the selected backend was `fixture`.
- What Local Reasoning Cannot Prove: whether every other multi-turn dogfood adapter should support fixture runtime; only `self-dogfood-refresh-flow` currently has a dedicated fixture-results file.
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

When a self-dogfood adapter advertises a checked-in fixture-results artifact and can be selected with `--runtime fixture`, its `eval_test_command_templates` should pass that fixture results file explicitly.

The repair risk is low because the wrapper only requires fixture results for the `fixture` backend and already accepts the argument as optional for non-fixture backends.
