# Debug Review: eval action bucket review queue
Date: 2026-05-03

## Problem

During autonomous claim dogfood, `agent-plan-cautilus-eval` appeared to have 123 claims in the status summary, but a focused review input was believed to produce zero clusters and only skipped claims.
That would make the status report's recommended next action impossible to execute.

## Correct Behavior

Given a claim packet has heuristic `agent-plan-cautilus-eval` claims, when an agent runs `claim review prepare-input --action-bucket agent-plan-cautilus-eval`, then those heuristic claims should appear in bounded review clusters.
Given the same bucket also has already reviewed claims, then already reviewed non-stale claims should be recorded in `skippedClaims` with `reason=already-reviewed`.
Given `agent status` has both a writable discovery baseline and a more advanced related claim packet, then top-level status and next branches should use the selected orientation packet while preserving the writable baseline under `configuredState`.

## Observed Facts

- `.cautilus/claims/status-summary.json` reports `agent-plan-cautilus-eval: 123`, with `agent-reviewed: 11` and `heuristic: 112`.
- Running focused review input against `.cautilus/claims/evidenced-typed-runners.json` with `--allow-stale-claims` produced 20 clusters and 36 rendered candidates under the default budget.
- The same packet recorded 200 skipped claims, including 189 action-bucket mismatches and 11 already reviewed claims.
- Direct packet inspection showed 112 heuristic, unknown, ready-to-verify `cautilus-eval` claims in `agent-plan-cautilus-eval`.
- `skills/cautilus/SKILL.md` already instructs agents to treat `claimState.orientationState` as the selected claim map and `claimState.configuredState` as the writable discovery baseline.
- `agent status --json` selects `.cautilus/claims/evidenced-typed-runners.json` as top-level `claimState.path`, records `.cautilus/claims/latest.json` under `configuredState.path`, and makes next branches point at the evidenced packet.
- `.cautilus/claims/latest.json` is older and purely heuristic, but it is not the selected orientation packet.

## Reproduction

Run:

```bash
./bin/cautilus claim review prepare-input \
  --claims .cautilus/claims/evidenced-typed-runners.json \
  --action-bucket agent-plan-cautilus-eval \
  --allow-stale-claims \
  --output /tmp/cautilus-eval-review-input.json

node -e "const fs=require('fs'); const j=JSON.parse(fs.readFileSync('/tmp/cautilus-eval-review-input.json','utf8')); const skip={}; for (const s of j.skippedClaims||[]) skip[s.reason]=(skip[s.reason]||0)+1; console.log({clusters:j.clusters.length,candidates:j.clusters.reduce((n,c)=>n+(c.candidates?.length||0),0), skipped:j.skippedClaims.length, skip});"

./bin/cautilus agent status --repo-root . --json
```

The first command produces a non-empty review queue.
The status packet's selected top-level claim path is the evidenced packet, not the configured writable baseline.

## Candidate Causes

- The focused review input command may exclude heuristic claims before action-bucket filtering.
- The rendered cluster budget may make a non-empty candidate set look empty if only skipped claims are inspected.
- The agent may have inspected `configuredState.summary` or `.cautilus/claims/latest.json` instead of the top-level selected orientation packet.
- A stale-packet rejection may have been misread as an empty queue in an earlier manual probe.

## Hypothesis

If the focused review input command is rerun against the selected evidenced packet and its rendered clusters are counted directly, then heuristic eval claims will appear in the queue.
If `agent status` is summarized from top-level `claimState` rather than `configuredState`, then it will point to the evidenced packet and not to the older heuristic-only baseline.

## Verification

- `claim review prepare-input --action-bucket agent-plan-cautilus-eval --allow-stale-claims` produced `clusters=20`, `candidates=36`, `skipped=200`.
- Skipped reason counts were `action-bucket-mismatch=189` and `already-reviewed=11`.
- Direct packet counting confirmed the bucket contains `agent-plan-cautilus-eval|heuristic|unknown=112` and `agent-plan-cautilus-eval|agent-reviewed|unknown=11`.
- `agent status --json` summarized to top-level `claimState.path=.cautilus/claims/evidenced-typed-runners.json`, `claimState.role=evidenced`, `configuredState.path=.cautilus/claims/latest.json`, and next branch commands using `.cautilus/claims/evidenced-typed-runners.json`.
- No product code change is needed for this symptom.

## Root Cause

The original suspected empty queue was not reproducible.
The implementation already includes heuristic eval claims in focused review input.
The confusion came from reading a large `agent status` packet where `configuredState.summary` showed the older writable baseline before the selected top-level orientation summary was inspected.

## Seam Risk

- Interrupt ID: eval-action-bucket-review-queue
- Risk Class: none
- Seam: agent interpretation of orientation packets
- Disproving Observation: focused review input from the selected evidenced packet produces non-empty clusters for heuristic eval claims.
- What Local Reasoning Cannot Prove: whether every agent will notice the top-level selected claim map before reading nested `configuredState` details in the full JSON.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: continue autonomous claim/eval workflow
- Handoff Artifact: none

## Prevention

When reading `agent status`, summarize top-level `claimState.path`, `claimState.role`, and `nextBranches` first.
Treat nested `configuredState` as discovery write-target context, not as the selected review/eval packet.
When action-bucket behavior looks empty, count rendered `clusters[].candidates` before concluding that `skippedClaims` represents the whole queue.
