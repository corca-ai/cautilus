# Debug Review: claim refresh plan overwrite
Date: 2026-05-01

## Problem

During scenario-normalization vocabulary work, claim follow-up commands failed after `claim discover --previous ... --refresh-plan --output` was written directly over `.cautilus/claims/latest.json`, `.cautilus/claims/reviewed-typed-runners.json`, and `.cautilus/claims/evidenced-typed-runners.json`.

## Correct Behavior

Given a prior claim packet is stale, when an operator asks for refresh planning, then `--refresh-plan` output must go to a separate refresh-plan artifact and the saved claim maps must be updated only by a normal `claim discover --previous ... --output <claim-packet>` run.
Given a saved claim map is updated, when `claim review prepare-input`, `claim plan-evals`, or `claim validate` reads it, then its `schemaVersion` must be `cautilus.claim_proof_plan.v1`.

## Observed Facts

- The failed commands emitted `schemaVersion must be cautilus.claim_proof_plan.v1`.
- `jq` showed `.cautilus/claims/evidenced-typed-runners.json` had `schemaVersion: cautilus.claim_refresh_plan.v1`.
- The diff showed the large claim packet had been replaced by the compact refresh-plan packet.
- `claim discover --previous /tmp/cautilus-prev-evidenced.json --output /tmp/cautilus-fresh-evidenced.json` produced a valid `cautilus.claim_proof_plan.v1` packet with `candidateCount=324`.

## Reproduction

```bash
./bin/cautilus claim discover --repo-root . --previous .cautilus/claims/evidenced-typed-runners.json --refresh-plan --output .cautilus/claims/evidenced-typed-runners.json
./bin/cautilus claim validate --claims .cautilus/claims/evidenced-typed-runners.json
```

The first command overwrites the proof-plan file with a refresh-plan file.
The second command rejects the schema.

## Candidate Causes

- Operator misuse: `--refresh-plan` was treated as a saved-map update instead of a separate planning artifact.
- CLI guard gap: the binary permits `--refresh-plan --output` to target a known claim-state path.
- Documentation ambiguity: the CLI reference says to use `--previous <claims.json> --refresh-plan` before review or eval planning, but does not state strongly enough that this does not update the saved claim map.

## Hypothesis

If the previous claim packets are recovered from `HEAD` into temporary files and the saved artifacts are regenerated with `claim discover --previous <temp-previous> --output <saved-claim-packet>` without `--refresh-plan`, then downstream review, eval planning, and validation should accept the regenerated files.

## Verification

Recovered the three previous packets from `HEAD` into `/tmp/cautilus-prev-*.json`.
Regenerated `.cautilus/claims/latest.json`, `.cautilus/claims/reviewed-typed-runners.json`, and `.cautilus/claims/evidenced-typed-runners.json` without `--refresh-plan`.
Regenerated `.cautilus/claims/refresh-plan-typed-runners.json` separately with `--refresh-plan`.
Then `claim review prepare-input`, both `claim plan-evals` commands, and both `claim validate` commands completed with exit 0.
Added an app-level CLI guard and regression test so `--refresh-plan --output` refuses configured saved claim-state paths.

## Root Cause

This was not a claim-discovery logic bug.
It was an operator workflow error caused by using a refresh-plan packet path as if it were the refreshed saved claim map.

## Seam Risk

- Interrupt ID: claim-refresh-plan-overwrite
- Risk Class: workflow-guard
- Seam: claim refresh planning versus saved claim-map update
- Disproving Observation: the binary accepted an output path that was already configured as a saved claim-state path and replaced it with a different schema.
- What Local Reasoning Cannot Prove: whether future agents will reliably remember the two-step distinction without a stronger CLI guard or clearer skill text.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep refresh plans in files named `refresh-plan*.json`.
When a saved claim map must be updated, run `claim discover --previous <prior-claim-packet> --output <saved-claim-packet>` without `--refresh-plan`.
The CLI now rejects `--refresh-plan --output` when the output path equals a configured `claimState.path` or related reviewed/evidenced state path.

## Related Prior Incidents

- [debug-2026-04-27-refresh-plan-internal-language.md](debug-2026-04-27-refresh-plan-internal-language.md): refresh planning is a separate coordinator-facing branch and should not update saved claim maps.
