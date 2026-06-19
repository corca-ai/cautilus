# Claim Discovery Bucket Spec Drift Debug
Date: 2026-06-19

## Problem

`npm run lint:specs docs/specs/user/evaluation.spec.md docs/specs/index.spec.md` failed in the focused specdown run while the new app/prompt intent-judge rows were passing.

## Correct Behavior

Given the checked-in `.cautilus/claims/status-summary.json`, when specdown runs the public spec graph, then `docs/specs/user/claim-discovery.spec.md` should assert the bucket set that is actually present in the current status summary.

## Observed Facts

- Exact failing command: `npm run lint:specs docs/specs/user/evaluation.spec.md docs/specs/index.spec.md`.
- Exact symptom: `specdown: spec run failed`.
- Verbose reproduction with `npm run specdown -- --config .specdown-focus-4125829-1.json --no-report` showed failures in `docs/specs/user/claim-discovery.spec.md`.
- The failing spec expected `bucketCount=7` and `agent-design-scenario`.
- Both the worktree copy and `HEAD:.cautilus/claims/status-summary.json` report six buckets: `already-satisfied`, `agent-add-deterministic-proof`, `agent-plan-cautilus-eval`, `human-align-surfaces`, `human-confirm-or-decompose`, and `split-or-defer`.
- The new app/prompt intent-judge projection rows passed in the same verbose run.

## Reproduction

```bash
jq -r '"bucketCount=" + (.actionSummary.primaryBuckets | length | tostring), (.actionSummary.primaryBuckets[] | .id + ":" + .recommendedActor)' .cautilus/claims/status-summary.json
npm run specdown -- --config .specdown-focus-4125829-1.json --no-report
```

## Candidate Causes

- The new app/prompt spec rows may have malformed JSON paths or table columns.
- The focused specdown run may include the full public spec graph through `docs/specs/index.spec.md`, surfacing an unrelated stale assertion.
- The checked-in generated claim state may be stale relative to the claim-discovery spec's current-bucket example.

## Hypothesis

If the failure is a stale claim-discovery current-bucket assertion, then updating only the current-bucket example and JSON rows to the checked-in six-bucket status summary should make `npm run lint:specs` pass without changing the app/prompt intent-judge rows.

## Verification

Pending after repair: rerun focused `npm run lint:specs docs/specs/user/evaluation.spec.md docs/specs/index.spec.md`, the app/prompt on-demand tests, and the final stop gates after claim refresh.

## Root Cause

`docs/specs/user/claim-discovery.spec.md` treated `agent-design-scenario` as present in the current status summary even though the checked-in generated status no longer contains that bucket.
The focus run through `docs/specs/index.spec.md` traversed the public spec graph and exposed this latent drift.

## Invariant Proof

- Invariant: a spec section that says it shows the current status summary must assert the bucket set in `.cautilus/claims/status-summary.json`.
- Producer Proof: `jq` over the checked-in status summary reports six current buckets.
- Final-Consumer Proof: focused specdown names the claim-discovery rows as the failing consumer.
- Interface-Shape Sibling Scan: app/prompt JSON rows passed in the same verbose run, so the new intent-judge packet shape was not the failing interface.
- Non-Claims: This does not change the action-bucket vocabulary table; it changes only which buckets are asserted as currently present.

## Detection Gap

- focused spec lint | `npm run lint:specs` reports only `specdown: spec run failed` in quiet mode | rerun the generated focus config with `npm run specdown -- --config <focus-config> --no-report` to expose row-level failures.

## Sibling Search

- Mental model: "the newly added app/prompt rows caused the focused specdown failure."
- same-file: `docs/specs/user/evaluation.spec.md` app/prompt rows | decision: no repair needed | proof: verbose specdown passed every app/prompt row.
- cross-file: `docs/specs/user/claim-discovery.spec.md` current-bucket rows | decision: repair stale current-state assertion | proof: verbose specdown failed rows 235 and 253-255.
- generated-state: `.cautilus/claims/status-summary.json` | decision: treat as current SOT until the post-source claim refresh commit | proof: worktree and HEAD both report six buckets.

## Seam Risk

- Interrupt ID: claim-discovery-bucket-spec-drift
- Risk Class: none
- Seam: specdown public graph over checked-in generated claim state
- Disproving Observation: app/prompt rows passed; failure came from claim-discovery current-bucket projection.
- What Local Reasoning Cannot Prove: whether a later claim refresh will reintroduce `agent-design-scenario`; the refresh commit must be inspected separately.
- Generalization Pressure: none

## Interrupt Decision

- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

When focused spec lint fails after claim-source or public spec edits, rerun the temporary specdown focus config without quiet mode before attributing the failure to the nearest edited spec.
