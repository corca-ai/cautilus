# Debug Review
Date: 2026-04-22

## Problem

`npm run dogfood:self` exited with `overallStatus: blocker` because the `codex-review` executor variant failed before producing a review verdict.

## Correct Behavior

Given the checked-in self-dogfood adapter and review verdict schema,
when `npm run dogfood:self` invokes `cautilus review variants` through the `codex_exec` backend,
then the review variant should either emit a schema-valid review verdict or emit a schema-valid blocked payload instead of failing at schema load time.

## Observed Facts

- `artifacts/self-dogfood/latest/summary.json` recorded `overallStatus: blocker` and `review variant command failed`.
- `artifacts/self-dogfood/runs/2026-04-22T11-58-18.597Z/review/codex-review.json.stderr` was empty in the published run artifact.
- Re-running `bash scripts/agent-runtime/run-review-variant.sh --backend codex_exec ...` against the same prompt reproduced the failure.
- The reproduced stderr showed `invalid_json_schema` from Codex with `schema must be a JSON Schema of 'type: "object"', got 'type: "None"'`.
- `fixtures/review/review-verdict.schema.json` uses a root `oneOf` and does not declare a root `type`.

## Reproduction

1. Run `npm run dogfood:self`.
2. Inspect `artifacts/self-dogfood/latest/summary.json` and the matching run directory under `artifacts/self-dogfood/runs/`.
3. Re-run `bash scripts/agent-runtime/run-review-variant.sh --backend codex_exec --workspace . --prompt-file artifacts/self-dogfood/runs/2026-04-22T11-58-18.597Z/review/review.prompt.md --schema-file fixtures/review/review-verdict.schema.json --output-file /tmp/cautilus-codex-review-repro.json`.
4. Read `/tmp/cautilus-codex-review-repro.json.stderr`.

## Candidate Causes

- Codex `--output-schema` rejects schemas whose root node is not `type: object`.
- The self-dogfood prompt or missing artifact list causes Codex to abort before writing output.
- `run-review-variant.sh` drops stderr on command failure and turns a diagnosable schema rejection into a generic summary.

## Hypothesis

If the Codex backend receives a schema file normalized to a root `type: object` wrapper while preserving the branch-level `oneOf` constraints,
then the same review prompt should stop failing with `invalid_json_schema` and `dogfood:self` should complete the review variant instead of returning a generic command failure.

## Verification

- Confirmed the reproduced stderr contains the schema rejection from Codex.
- Confirmed the rejected schema file is `fixtures/review/review-verdict.schema.json`.
- Confirmed the rejected schema uses root `oneOf` without root `type: object`.

## Root Cause

The `codex_exec` review path passed `fixtures/review/review-verdict.schema.json` directly to `codex exec --output-schema`.
That schema is valid JSON Schema for the repo's own consumers, but Codex's structured-output contract requires the root schema node to be an object schema.
The root `oneOf` therefore caused the executor variant to fail before the model could return any review payload.

## Seam Risk

- Interrupt ID: codex-output-schema-root-object
- Risk Class: host-disproves-local
- Seam: external executor schema contract
- Disproving Observation: Codex rejected a repo-owned schema that local JSON parsing accepts.
- What Local Reasoning Cannot Prove: every future Codex structured-output restriction beyond the current root-object requirement.
- Generalization Pressure: any future review or self-dogfood path that hands a root union schema directly to Codex can fail the same way.

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Normalize root-union review schemas into a Codex-compatible root object wrapper before calling `codex exec --output-schema`.
Keep failed review variants linked to concrete stderr artifact paths in the published self-dogfood bundle so future executor failures stay diagnosable.
