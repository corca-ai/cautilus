# Claim Discovery Engine Freshness Debug
Date: 2026-05-03

## Problem

`claim discover --previous .cautilus/claims/evidenced-typed-runners.json --refresh-plan` reported `refreshSummary.status=up-to-date` even after the claim-discovery heuristic changed and a fresh discovery reduced the current packet from 315 to 312 candidates.

## Correct Behavior

Given the saved claim map was produced by an older discovery ruleset, when the current binary or source checkout would produce a different claim set without any source-doc changes, then refresh planning should not say the saved map is current.
It should report that the discovery engine or ruleset changed and recommend regenerating the saved claim map before review or eval planning.

## Observed Facts

- A focused heuristic change excludes future-proof placeholder sentences such as `Future proof should...`, `Deeper proof should...`, and `This page should later...`.
- `./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json` produced `candidateCount=312`.
- The previous evidenced packet had `candidateCount=315`.
- The removed candidates were all evidence-placeholder sentences from `docs/specs/user/*.spec.md`.
- `./bin/cautilus claim discover --repo-root . --previous .cautilus/claims/evidenced-typed-runners.json --refresh-plan --output .cautilus/claims/refresh-plan-after-future-proof-placeholder-filter.json` reported `refreshSummary.status=up-to-date`, `changedSourceCount=0`, and `changedClaimCount=0`.

## Reproduction

```bash
./bin/cautilus claim discover --repo-root . --previous .cautilus/claims/evidenced-typed-runners.json --refresh-plan --output .cautilus/claims/refresh-plan-after-future-proof-placeholder-filter.json
jq '.refreshSummary' .cautilus/claims/refresh-plan-after-future-proof-placeholder-filter.json
./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json
jq '.candidateCount' .cautilus/claims/latest.json
```

## Candidate Causes

- Refresh planning only compares recorded source files between the saved packet commit and current HEAD.
- The claim packet does not record discovery engine or ruleset identity, so a changed heuristic is indistinguishable from a no-op when source docs did not change.
- The source-hash based freshness logic intentionally excludes working-tree and non-source drift, which is correct for generated claim artifacts but insufficient for discovery implementation drift.

## Hypothesis

If claim proof-plan packets record discovery engine metadata and refresh planning compares previous metadata with the current engine, then an older packet without that metadata or with a different ruleset/source hash will produce a non-current refresh summary even when claim source files are unchanged.

## Verification

Repaired.
`TestBuildClaimRefreshPlanDetectsDiscoveryEngineDrift` proves a previous packet without discovery-engine metadata now reports `refreshSummary.status=discovery-engine-changed`.
`TestBuildClaimRefreshPlanIgnoresCommittedClaimPacketDrift` still proves committed packet-only drift remains `up-to-date` when discovery engine metadata matches.
The self refresh-plan repro now reports `discovery-engine-changed` with `previousDiscoveryEngine.status=missing` and the current `claim-discovery-rules.v2` metadata.

## Root Cause

Refresh planning treated claim-source freshness as the only reason a saved claim map could become semantically stale.
That was incomplete because claim candidates are a function of both source documents and the discovery engine/ruleset.
The repair records discovery engine metadata in proof-plan packets and compares it during refresh planning before declaring a saved map current.

## Seam Risk

- Interrupt ID: claim-discovery-engine-freshness
- Risk Class: contract-freeze-risk
- Seam: claim discovery refresh semantics
- Disproving Observation: unchanged source docs plus changed heuristic produced a different candidate set while refresh-plan reported up-to-date
- What Local Reasoning Cannot Prove: whether every future packaged binary exposes enough implementation identity for perfect ruleset comparison
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Record discovery engine metadata in claim packets and make refresh-plan status account for engine/ruleset drift separately from source-doc drift.
Keep source-doc drift narrow so generated artifact commits still do not make packets stale by themselves.
