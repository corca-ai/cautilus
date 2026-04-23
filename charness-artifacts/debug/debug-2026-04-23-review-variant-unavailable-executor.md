# Review Variant Unavailable Executor Debug
Date: 2026-04-23

## Problem

`cautilus review variants` can produce useful review output from one executor while another executor fails because the local tool or auth path is unavailable.
The aggregate `review-summary.json` reported a plain `failed` state, which made the usable passing variant easy to miss and made local readiness look like a negative review result.

## Correct Behavior

Given multiple review variants where one emits a schema-valid passing review and another exits with a local auth or tool-readiness error,
when `cautilus review variants` builds `review-summary.json`,
then the unavailable executor should be classified as blocked with a machine-readable `unavailable_executor` reason code and the passing review output should be easy to consume from the top-level summary.

## Observed Facts

- GitHub issue #28 reported a Ceal closeout run on 2026-04-23 with Cautilus `0.11.0`.
- `codex-review` passed and produced structured findings.
- `claude-review` failed because the local Claude CLI returned an API `401` authentication error.
- The top-level summary status was `failed`, even though one variant produced useful evidence.
- `cautilus review variants --help` only showed a generic `[args]` usage line, hiding the standalone `--prompt-file` plus `--schema-file` path.

## Reproduction

1. Use a temp adapter with two `executor_variants`.
2. Make the first variant write a valid completed review JSON file.
3. Make the second variant write `Claude API 401 authentication error` to stderr and exit non-zero.
4. Run `cautilus review variants --repo-root <tmp> --workspace <tmp> --output-dir <tmp>/outputs`.

## Candidate Causes

- Command failures are normalized before considering whether stderr indicates auth or missing-tool readiness.
- The summary only exposes full variant records, so a passing variant remains nested behind the aggregate failure state.
- The command registry carries a generic usage string for `review variants`, so topic help cannot reveal the ad-hoc prompt/schema path.

## Hypothesis

If command-failure normalization recognizes local auth and missing-tool signatures as unavailable executor blockers,
and if the summary lifts passing variant outputs into a small top-level list,
then a mixed review run should return `status: blocked`, include `unavailable_executor`, set `partialSuccess: true`, and keep the passing variant immediately consumable.

## Verification

Added an integration smoke test that exercises one passing variant plus one auth-failed variant.
Added a registry topic-help test that asserts `cautilus review variants --help` shows the `--prompt-file` and `--schema-file` path.

## Root Cause

The Go review-variant normalizer treated every non-zero executor command as `failed` with `command_failed`, regardless of whether the command output showed a local executor readiness problem.
The summary also lacked a top-level partial-success view, so downstream agents had to inspect each variant to discover useful passing evidence.

## Seam Risk

- Interrupt ID: review-variant-unavailable-executor
- Risk Class: none
- Seam: local executor readiness
- Disproving Observation: none
- What Local Reasoning Cannot Prove: exact stderr wording for every provider CLI
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep unavailable executor failures machine-classified separately from review verdicts.
Keep passing review evidence available at the top level whenever aggregate execution status is not passed.
