# Claim Evidence Projection Source Loop Debug
Date: 2026-05-11

## Problem

Refreshing the claim packet made `docs/specs/proof/claim-evidence-state.md` appear as a changed claim source.

## Correct Behavior

Given `docs/specs/proof/claim-evidence-state.md` is generated from the claim packet and status snapshot, when claim discovery decides whether a saved claim map is stale, then this generated projection should not itself create claim candidates or make the next claim packet stale.

## Observed Facts

- `./bin/cautilus claim discover --repo-root . --previous .cautilus/claims/latest.json --refresh-plan --output .cautilus/claims/refresh-plan-2026-05-11-post-skill-triage.json` reported `changedSourceCount: 2`.
- The changed sources were `skills/cautilus-agent/SKILL.md` and `docs/specs/proof/claim-evidence-state.md`.
- The generated evidence-state page says `This file is generated from the claim packet and status snapshot` and `Do not edit it by hand`.
- The page also embeds volatile projection fields such as claims hash, status hash, current commit, packet commit, and changed claim source count.

## Reproduction

Run:

```bash
./bin/cautilus claim discover --repo-root . --previous .cautilus/claims/latest.json --refresh-plan --output .cautilus/claims/refresh-plan-2026-05-11-post-skill-triage.json
```

## Candidate Causes

- The Cautilus adapter lists `docs/specs/proof/claim-evidence-state.md` as an artifact path but does not exclude it from claim discovery.
- The linked Markdown scan can reach generated proof projection pages under `docs/specs/proof/`.
- The generated page contains claim-shaped explanatory text, so it can produce claim candidates even though it is not a source-of-truth promise document.

## Hypothesis

If the adapter excludes `docs/specs/proof/claim-evidence-state.md` from claim discovery while keeping it as an artifact path, then the projection remains inspectable but stops participating in claim candidate discovery and stale-source detection.

## Verification

Added `docs/specs/proof/claim-evidence-state.md` to `.agents/cautilus-adapter.yaml` claim discovery excludes.
Re-ran the refresh plan, claim discovery, review-result application, canonical map generation, evidence-state generation, and status-report generation.
The new refresh plan reports `status: up-to-date`, `changedSourceCount: 0`, and no changed claim lifecycle rows.

## Root Cause

The generated evidence-state projection was treated as both a derived status artifact and a claim source.
That made the status projection self-referential: refreshing the projection could create another changed claim-source signal.

## Seam Risk

- Interrupt ID: claim-evidence-projection-source-loop
- Risk Class: none
- Seam: generated claim-status projection to claim-discovery source selection
- Disproving Observation: a refresh plan after adapter exclusion no longer lists `docs/specs/proof/claim-evidence-state.md` as a changed source.
- What Local Reasoning Cannot Prove: whether other generated proof projection pages under `docs/specs/proof/` should also be excluded.
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep generated claim/status projections in adapter artifact paths for review, but exclude them from claim discovery unless they are intentionally authored promise sources.
