# Debug Review
Date: 2026-04-22

## Problem

`npm run dogfood:self` failed because the `codex-review` executor variant could not load the review verdict schema through `codex exec --output-schema`.

## Correct Behavior

Given the checked-in self-dogfood adapter and review verdict schema,
when `dogfood:self` runs the `codex_exec` review variant,
then Codex should accept the structured-output schema and return either a completed verdict or a blocked payload.

## Observed Facts

- The failing run produced `overallStatus: blocker` with `review variant command failed`.
- Re-running the same `run-review-variant.sh` command reproduced the failure.
- The reproduced Codex stderr reported `invalid_json_schema` and said the schema root must be `type: "object"`.
- `fixtures/review/review-verdict.schema.json` used a root `oneOf` without a root `type`.

## Reproduction

1. Run `npm run dogfood:self`.
2. Re-run the emitted review variant with `bash scripts/agent-runtime/run-review-variant.sh --backend codex_exec ...`.
3. Read the generated `.stderr` file for the reproduced variant command.

## Candidate Causes

- Codex rejects root-union schemas for `--output-schema`.
- The self-dogfood prompt content caused an executor abort before output.
- The published latest bundle hid the real stderr artifact path and made the failure look opaque.

## Hypothesis

If the Codex backend normalizes root-union review schemas into a root object schema before invoking `codex exec`,
then the same self-dogfood review path should stop failing at schema load time.

## Verification

- Reproduced the failure outside `dogfood:self`.
- Captured Codex stderr proving the schema rejection.
- Confirmed the rejection disappears when the backend receives a root object schema wrapper in regression tests.

## Root Cause

The `codex_exec` review path passed a valid repo schema that Codex's structured-output interface does not accept because the root node was `oneOf` instead of `type: object`.

## Seam Risk

- Interrupt ID: codex-review-schema-root
- Risk Class: none
- Seam: none
- Disproving Observation: none
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Normalize review schemas for Codex before passing `--output-schema`,
and keep failed review variants linked to stderr artifact paths in the published self-dogfood bundle.
