# Debug Review
Date: 2026-05-04

## Problem

Refreshing the Cautilus self-dogfood claim packet after heuristic changes removed the top-level `carryForward` audit block from `.cautilus/claims/latest.json` and `.cautilus/claims/evidenced-typed-runners.json`.

## Correct Behavior

Given a checked-in claim packet already has reviewed labels and evidence refs, when claim discovery is refreshed after a heuristic change, then the saved claim packet should be regenerated with `claim discover --previous <prior-claim-packet>` so unchanged claim fingerprints carry reviewed labels, evidence refs, and a visible `carryForward` audit summary.

Given a line begins with `Whether`, when it appears under `## Deferred Decisions`, then deterministic discovery should skip it as decision backlog.

Given a line begins with `Whether`, when it appears outside a deferred-decision section and otherwise describes current product behavior, then deterministic discovery should still be allowed to classify it as a claim.

## Observed Facts

- Fresh-eye review found `carryForward` was present in `HEAD:.cautilus/claims/latest.json` but missing from the refreshed working-tree claim packets.
- `jq '.carryForward // null' .cautilus/claims/latest.json` returned `null` after the first refresh.
- The first refresh command was plain `./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json`.
- Re-running discovery with `--previous /tmp/cautilus-prev-evidenced-before-heuristic.json` restored `carryForward.matchedClaimCount=323` and all stale/missing evidence counters stayed zero.
- The heuristic patch initially skipped every `Whether ...` line globally, not only deferred decisions.

## Reproduction

The bad artifact state was reproduced by running:

```bash
./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json
jq '.carryForward // null' .cautilus/claims/latest.json
```

The repaired artifact state was reproduced by running:

```bash
git show HEAD:.cautilus/claims/evidenced-typed-runners.json > /tmp/cautilus-prev-evidenced-before-heuristic.json
./bin/cautilus claim discover --repo-root . --previous /tmp/cautilus-prev-evidenced-before-heuristic.json --output .cautilus/claims/latest.json
jq '.carryForward' .cautilus/claims/latest.json
```

## Candidate Causes

- The refresh workflow used a first-discovery command instead of the current-claim refresh command.
- The review-result replay script may have dropped the top-level `carryForward` block while applying review results.
- The heuristic change may have changed too many fingerprints for carry-forward to match.

## Hypothesis

If the missing audit block came from using plain discovery, then regenerating `.cautilus/claims/latest.json` with `--previous` against the prior evidenced packet should restore `carryForward`, preserve evidence refs for unchanged fingerprints, and keep claim validation clean.

If the global `Whether` filter risks false negatives, then section-aware extraction should skip `Whether` only under `Deferred Decisions` while a non-deferred `Whether ... emits ... packet ...` sentence remains discoverable in a focused test.

## Verification

- `go test ./internal/runtime -run 'TestDiscoverClaimProofPlanAvoidsExampleAndBroadRouting'` passed after adding section-aware deferred-decision coverage.
- `jq '.carryForward' .cautilus/claims/latest.json` now reports `matchedClaimCount=323`, `staleEvidenceClaimCount=0`, `missingEvidenceRefCount=0`, and `evidenceSupportIdRewriteCount=0`.
- `jq '.carryForward' .cautilus/claims/evidenced-typed-runners.json` reports the same restored carry-forward summary after review-result replay.
- `jq '.valid, .issueCount, .warningCount // 0' .cautilus/claims/validation-evidenced-typed-runners.json` reports `true`, `0`, `0`.

## Root Cause

The immediate artifact regression was an operator workflow error.
I refreshed a saved claim map with first-discovery semantics, so no previous packet existed for the binary to carry forward reviewed/evidenced state or emit a carry-forward audit summary.

The false-negative risk came from encoding a local observation about `## Deferred Decisions` as a global `Whether` line filter.
The fix makes the filter section-aware and keeps non-deferred `Whether` claims eligible for classification.

## Seam Risk

- Interrupt ID: claim-refresh-carry-forward-loss
- Risk Class: contract-freeze-risk
- Seam: saved claim packet refresh after heuristic changes
- Disproving Observation: claim validation passed even when the top-level `carryForward` audit summary was missing.
- What Local Reasoning Cannot Prove: whether future operators will always remember to use `--previous` when refreshing checked-in claim state.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

When updating checked-in claim state after heuristic, source, or evidence changes, regenerate `.cautilus/claims/latest.json` with `claim discover --previous <prior-current-packet> --output .cautilus/claims/latest.json`.
Then replay review results, rerender status artifacts, validate the evidenced packet, and explicitly check that `carryForward` is present unless the operator is intentionally doing a first discovery.

Add or preserve classifier tests for section-scoped exclusions so local Cautilus docs do not become global false-negative rules.
