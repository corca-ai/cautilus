# Debug Review: stale claim review overrun
Date: 2026-04-27

## Problem

A resumed `$cautilus` test session accepted `prepare-claim-review` after `claim show` and proceeded through review preparation, subagent review, review application, validation, eval planning, verification, and commit on a stale claim packet.
The reviewed packet still had `gitCommit=bec65ce20af8b3d20429e766287ab1a9aef5db90`, while the current checkout was already `a3c9ca930d2d0fe0b942cc356271f7a745c6685f`.

## Correct Behavior

Given an existing claim packet records an older git commit, when an agent tries to prepare review, apply review results, or plan evals, then Cautilus should surface the stale state and require refresh planning or an explicit stale override before proceeding.

## Observed Facts

- The test session did use the updated installed skill text with `claim show --sample-claims`.
- `claim show` summarized the existing packet but did not make the stale commit mismatch prominent enough to redirect the next step.
- The skill selected `prepare-claim-review` and stated a review budget without first running a refresh plan.
- `claim review prepare-input` accepted the stale packet.
- The session spawned reviewer lanes, applied results, validated the reviewed packet, generated an eval plan, ran `npm run verify`, ran `npm run hooks:check`, and committed `7048548`.
- The artifact commit was reverted with `0fe2942` because the review artifacts were based on stale claim state.

## Reproduction

Run from a checkout where `.cautilus/claims/latest.json` has an older `gitCommit` than `git rev-parse HEAD`:

```bash
./bin/cautilus claim review prepare-input --claims .cautilus/claims/latest.json --output /tmp/review-input.json
```

Before the fix, the command succeeded instead of requiring refresh planning or an explicit stale override.

## Candidate Causes

- `claim show` and `agent status` exposed the packet `gitCommit` but did not normalize it into an actionable stale-state field.
- The bundled skill's stale branch guard only covered stale menu branch execution, not post-summary transitions into review or eval planning.
- The binary allowed review preparation and eval planning from any structurally valid claim packet, even when the packet commit was older than the current checkout.

## Hypothesis

If claim status packets include explicit git staleness and review/eval-planning commands reject stale claim packets by default, then a short user instruction like `prepare-claim-review` will either be redirected to refresh planning by the skill or stopped by the binary before stale artifacts are produced.

## Verification

Added `gitState` to `claim show` and `agent status` claim summaries.
Changed `agent status` to put `refresh_claims_from_diff` before `show_existing_claims` when the configured claim packet is stale.
Changed `claim review prepare-input`, `claim review apply-result`, and `claim plan-evals` to reject stale claim packets by default unless `--allow-stale-claims` is explicitly passed.
Confirmed the current stale `.cautilus/claims/latest.json` reports `gitState.isStale=true` and that `claim review prepare-input` exits non-zero without writing an output file.
Added app tests for stale `claim show` git state and stale review-input rejection with explicit override.

## Root Cause

Freshness was treated as conversational guidance instead of a command precondition.
The skill could notice stale state only if it reasoned from raw `gitCommit`, and the binary did not enforce freshness before commands that consume existing claim state.

## Seam Risk

- Interrupt ID: stale-claim-review-overrun
- Risk Class: none
- Seam: existing claim packet consumption before review/eval planning
- Disproving Observation: a same-session agent produced valid-looking reviewed artifacts from a stale claim packet
- What Local Reasoning Cannot Prove: whether every future agent will compare packet and checkout commits before review work
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Make stale claim state a product-owned field and command gate.
Keep the skill guidance as sequencing help, but do not rely on prompt text alone for stale claim packet safety.
