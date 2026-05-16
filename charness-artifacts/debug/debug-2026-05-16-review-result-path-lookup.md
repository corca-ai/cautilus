# Review Result Path Lookup Debug
Date: 2026-05-16

## Problem

While refreshing stale CLI runtime claim evidence, a guessed review-result filename did not exist.

## Correct Behavior

Given old evidence bundles may have batch-oriented review result filenames, when locating the review result for an evidence bundle, then the workflow should discover the path from checked-in files instead of deriving it from the evidence bundle name.

## Observed Facts

- The failing command was `sed -n '1,160p' .cautilus/claims/review-result-evidence-cli-runtime-claims-2026-05-01.json`.
- The exact stderr was `sed: can't read .cautilus/claims/review-result-evidence-cli-runtime-claims-2026-05-01.json: No such file or directory`.
- `rg --files .cautilus/claims | rg 'cli-runtime|runtime-claims|batch5'` found `.cautilus/claims/review-result-llm-batch5.json`.
- The stale claim investigation can continue by reading the discovered batch review result or by writing a new narrowly scoped refresh result.

## Reproduction

```bash
sed -n '1,160p' .cautilus/claims/review-result-evidence-cli-runtime-claims-2026-05-01.json
```

The command fails because that filename is not checked in.

## Candidate Causes

- Older review results were grouped by batch name rather than by evidence bundle name.
- The current session inferred a filename from newer evidence-result naming patterns.
- The evidence bundle may have been intentionally applied through a broader review result file.

## Hypothesis

If this is only a lookup mistake, then `rg --files` should reveal the actual review result file and no product state needs repair.

## Verification

- `rg --files .cautilus/claims | rg 'cli-runtime|runtime-claims|batch5'` returned `.cautilus/claims/review-result-llm-batch5.json`.
- No code, claim packet, or evidence bundle failed validation because of the missing guessed path.

## Root Cause

The path lookup assumed a one-to-one evidence-to-review-result naming convention that older batch evidence did not use.

## Detection Gap

- stale evidence inspection | no path discovery step ran before opening a guessed review-result path | use `rg --files` before opening historical review result filenames.

## Sibling Search

- Mental model: evidence bundle names imply matching review-result names.
- Claims axis: older `.cautilus/claims/review-result-llm-batch*.json` files can apply several evidence bundles.
- Workflow axis: stale refresh should prefer new narrowly scoped refresh results when old batch files are broad.
- Debug axis: keep this as operator lookup memory, not as a product regression.

## Seam Risk

- Interrupt ID: review-result-path-lookup
- Risk Class: none
- Seam: local claim artifact inspection
- Disproving Observation: checked-in claim files revealed the actual batch review result.
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: none

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Use `rg --files .cautilus/claims` before opening historical review-result files whose naming pattern is not already known.

## Related Prior Incidents

- `debug-2026-05-16-rg-search-target.md`: another operator-side path selection mistake during deterministic proof work.
