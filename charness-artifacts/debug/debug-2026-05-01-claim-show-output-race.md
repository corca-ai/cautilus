# Debug Review: claim show output race
Date: 2026-05-01

## Problem

After applying `.cautilus/claims/review-result-llm-batch4.json`, `claim show` appeared to report the old claim summary counts even though the updated claim candidates had two additional satisfied claims.

## Correct Behavior

Given `claim review apply-result` updates claim candidates and recomputes `claimSummary`, when `claim show --output .cautilus/claims/status-summary.json` runs after that update, then the status summary should report the recomputed satisfied, unknown, reviewed, proof-layer, and readiness counts.

## Observed Facts

- `claim review apply-result` updated `claim-agents-md-78` and `claim-agents-md-123` to `evidenceStatus=satisfied`.
- A parallel tool call ran `claim show --output .cautilus/claims/status-summary.json` and `jq .cautilus/claims/status-summary.json` at the same time.
- The `jq` output still showed `satisfied=25`, `unknown=300`, `agent-reviewed=37`, and `heuristic=288`.
- Directly inspecting `.cautilus/claims/evidenced-typed-runners.json` showed the packet `claimSummary` had already moved to `satisfied=27`, `unknown=298`, `agent-reviewed=43`, and `heuristic=282`.
- Re-running `claim show` and then reading the output sequentially produced the correct status summary.

## Reproduction

The misleading observation came from a parallel writer/reader shape:

```bash
./bin/cautilus claim show --input .cautilus/claims/evidenced-typed-runners.json --sample-claims 8 --output .cautilus/claims/status-summary.json
jq -r '.claimSummary' .cautilus/claims/status-summary.json
```

When those commands are run concurrently, `jq` can read the previous `status-summary.json` before `claim show` rewrites it.

The correct reproduction is sequential:

```bash
./bin/cautilus claim show --input .cautilus/claims/evidenced-typed-runners.json --sample-claims 8 --output .cautilus/claims/status-summary.json
jq -r '.claimSummary' .cautilus/claims/status-summary.json
```

That reports `satisfied=27` and `unknown=298`.

## Candidate Causes

- Product summary bug: `claim show` might trust stale top-level `claimSummary` instead of recomputing from `claimCandidates`.
- Apply-result bug: `claim review apply-result` might update individual candidates but fail to recompute the top-level `claimSummary`.
- Operator race: the command writing `status-summary.json` and the command reading it might have run concurrently.

## Hypothesis

If this was an operator race, then the updated claim packet should already contain the recomputed top-level `claimSummary`, and a sequential `claim show` followed by `jq` should report the updated counts.

## Verification

`jq` over `.cautilus/claims/evidenced-typed-runners.json` showed the top-level `claimSummary` and a direct aggregation over `claimCandidates` both reported:

- `byEvidenceStatus.satisfied=27`
- `byEvidenceStatus.unknown=298`
- `byReviewStatus.agent-reviewed=43`
- `byReviewStatus.heuristic=282`

Sequentially rerunning `claim show` and then `jq` over `.cautilus/claims/status-summary.json` reported the same updated counts.

## Root Cause

The symptom was caused by a parallel command ordering mistake in the agent workflow, not by a product bug.
`claim show --output` and `jq` over the same output file were launched in one parallel tool call, so the reader could observe the old file before the writer completed.

## Seam Risk

- Interrupt ID: claim-show-output-race
- Risk Class: none
- Seam: agent workflow around generated output files
- Disproving Observation: the persisted claim packet and a sequential `claim show` both reported the correct updated counts.
- What Local Reasoning Cannot Prove: whether other agent sessions will avoid parallel writer/reader pairs without an explicit working-pattern reminder.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Do not run a command that writes a generated artifact in parallel with a command that reads the same artifact.
Use parallel tool calls only for independent reads or for commands with disjoint output paths.
