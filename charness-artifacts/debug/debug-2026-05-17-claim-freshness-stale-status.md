# Debug Review
Date: 2026-05-17

## Problem

Repeated critique found that release claim freshness could report `fresh` when the saved and refreshed claim status snapshots both declared `gitState.isStale: true`.

## Correct Behavior

Given a selected claim status snapshot reports stale claim state, when release claim freshness runs, then the preflight should fail even if the saved and refreshed snapshots match byte-for-byte in meaning.

## Observed Facts

`check-claim-freshness.mjs` compared saved and refreshed status snapshots after normalizing head-drift fields.
It did not assert that `gitState.isStale` was false.
The custom repair guidance also rendered unquoted paths and raw relative paths, and default path detection used literal strings instead of repo-root-resolved paths.

## Reproduction

Create a temporary claim packet and status snapshot with `gitState.isStale: true`.
Make the status refresh runner return the same stale status.
Before the fix, `checkClaimFreshness` returned `{"status":"fresh"}`.

## Candidate Causes

- The selected-status comparison verified snapshot consistency but not release readiness.
- Tests covered mismatched status snapshots but not matching stale snapshots.
- Default-path handling was still oriented around exact package-script defaults, not resolved file identity.

## Hypothesis

If the refreshed selected status must have `gitState.isStale !== true`, default paths are compared after repo-root resolution, and repair commands quote paths while preserving repo-root execution context, then release freshness cannot pass stale selected claim state or misclassify equivalent default paths.

## Verification

Focused release claim freshness tests, focused ESLint, `npm run release:claim-freshness`, and an explicit stale-status repro all pass with the corrected behavior.

## Root Cause

The preflight conflated “saved status agrees with regenerated status” with “claim state is release-fresh”.
Those are separate checks.

## Detection Gap

- Stale status parity | matching stale snapshots were not tested | reject `gitState.isStale: true` directly.
- Default path identity | exact strings were tested, equivalent paths were not | compare resolved default and selected paths.
- Repair commands | only simple paths were tested | quote paths and preserve `cd <repoRoot>` in guidance.
- Status refresh invocation | runner tests ignored arguments | assert selected claims path is passed to the status refresh command.

## Sibling Search

- `claims:evidence-state:check` still owns generated projection equality for default state.
- Custom selected claim/status pairs now validate selected files directly and do not run default projection checks.
- Release prepare and verify continue to call `release:claim-freshness`; the gate behavior is local to this helper.

## Seam Risk

- Interrupt ID: claim-freshness-stale-status
- Risk Class: none
- Seam: release claim freshness status semantics
- Disproving Observation: a matching selected status with `gitState.isStale: true` exits 0.
- What Local Reasoning Cannot Prove: whether external release operators depend on the old unquoted repair command text.
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Freshness preflights should assert semantic readiness flags directly rather than deriving readiness from artifact equality alone.
