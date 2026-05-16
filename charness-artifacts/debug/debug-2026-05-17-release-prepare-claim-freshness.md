# Debug Review
Date: 2026-05-17

## Problem

`npm run release:prepare -- 0.16.0` stopped during the release claim freshness preflight after applying the version bump.

## Correct Behavior

Given a release version bump has been applied, when the release prepare helper checks claim freshness, then the saved claim packet and generated projections should describe the current release-prep checkout before a tag is prepared.

## Observed Facts

The exact failure was:

```text
Release claim freshness preflight failed.
> cautilus@0.16.0 claims:evidence-state:check
> node scripts/agent-runtime/render-claim-evidence-state.mjs --refresh-status --check

.cautilus/claims/status-summary.json is stale; run npm run claims:evidence-state
Refresh the saved claim packet and projections before preparing the tag:
  ./bin/cautilus discover claims --repo-root . --previous .cautilus/claims/evidenced-typed-runners.json --output .cautilus/claims/evidenced-typed-runners.json
  npm run claims:canonical-map
  npm run claims:evidence-state
  npm run claims:status-report
```

Before the failure, `release:prepare` completed `skills:sync-packaged` and bumped versioned release surfaces from `0.15.4` to `0.16.0`.
The working tree then contained version changes in `package.json`, `package-lock.json`, `.claude-plugin/marketplace.json`, and the packaged Claude/Codex plugin manifests.

## Reproduction

Run `npm run release:prepare -- 0.16.0` from the current release-prep checkout before refreshing the saved claim packet and projections.

## Candidate Causes

- The version bump changed claim-source files, making the checked-in claim projections stale.
- The release helper ran claim freshness after version mutation, so the generated claim status now points at a pre-bump source state.
- A generator regression made claim status unstable even without source changes.

## Hypothesis

The version bump touched release metadata that participates in claim-source freshness.
Therefore the saved claim packet and its derived projections must be refreshed with the release helper's printed repair sequence before `release:prepare` can complete.

## Verification

The failure message itself names the stale generated status file and the required repair sequence.
This matches the prior release incident recorded in `charness-artifacts/debug/debug-2026-05-12-release-claim-state-stale.md`, where projection-only refresh was insufficient after release input commits changed claim sources.

## Root Cause

The release-prep version bump advanced release metadata from `0.15.4` to `0.16.0`, changing files summarized by the checked-in claim freshness artifacts.
The existing claim packet and status projections still described the pre-bump checkout, so the release preflight correctly stopped before tagging.

## Detection Gap

- Release claim freshness preflight | fired after version mutation, not before | keep the stop and run the printed repair sequence before retrying prepare.

## Sibling Search

- Mental model: release prepare can be treated as one atomic helper, but it intentionally exposes claim-source drift after mutation.
- Prior incident: `charness-artifacts/debug/debug-2026-05-12-release-claim-state-stale.md` records the same claim-source freshness class during release prep.
- Release helper: `scripts/release/check-claim-freshness.mjs` owns the repair command sequence that should be followed instead of guessing.

## Seam Risk

- Interrupt ID: release-prepare-claim-freshness
- Risk Class: none
- Seam: release version bump to checked-in claim freshness projections
- Disproving Observation: the helper printed the exact stale status and repair sequence before any tag was prepared.
- What Local Reasoning Cannot Prove: whether the refreshed claim packet will remain fresh after the release record and critique artifacts are committed.
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

During release prep, treat a claim freshness preflight failure after version bump as an expected stop.
Run the printed claim refresh sequence, then retry `npm run release:prepare -- <version>` before release verification and publish.
