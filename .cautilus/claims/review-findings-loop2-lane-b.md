# Loop 2 Lane B Findings

Reviewed clusters 3-5 from `.cautilus/claims/review-input-loop2.json`.
No product code was modified.

## Findings

- `claim-readme-md-211` still looks misrouted as purely `deterministic`.
  The install and manifest materialization part is deterministic, but the same claim also promises that an in-editor agent can drive the contracts conversationally.
  I marked it as `cautilus-eval` with `recommendedEvalSurface=dev/skill`, with a split-claim question.
- `claim-readme-md-137` is not a pure false positive, but the extractor still combines the CLI command, the `For agent` prompt example, and the output promise into one claim.
  The resulting proof route is still acceptable as `deterministic`, but sentence splitting would reduce review noise.
- I did not mark any reviewed claim as `evidenceStatus=satisfied`.
  The review input contains source excerpts and labels, but no direct or verified evidence refs.

## Label Summary

- Kept `claim-readme-md-144` as `cautilus-eval`, `dev/skill`, `ready-to-verify`.
- Kept `claim-readme-md-10`, `claim-readme-md-137`, and `claim-readme-md-95` as deterministic, `ready-to-verify`.
- Changed `claim-readme-md-211` from deterministic to `cautilus-eval`, `dev/skill`, `ready-to-verify`.
- Kept `claim-readme-md-148` as `cautilus-eval`, `dev/skill`, `ready-to-verify`.
