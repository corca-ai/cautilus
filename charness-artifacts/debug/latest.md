# Debug Review
Date: 2026-05-11

## Problem

The `v0.15.0` tag-triggered `release-artifacts` workflow failed during `npm run verify`.

## Correct Behavior

Given a release tag points at a commit after the checked-in claim packet was generated, when CI runs `npm run claims:evidence-state:check`, then the checkout should include enough git history to compare the packet commit with the tag commit and distinguish source drift from generated-artifact commit drift.

## Observed Facts

- GitHub Actions run `25649021254` failed in the `release-artifacts` workflow at `Run npm run verify`.
- The failed log showed `.cautilus/claims/status-summary.json is stale; run npm run claims:evidence-state`.
- The failure happened after the tag was pushed, before release assets were built or published.
- Local `npm run verify`, `npm run claims:evidence-state:check`, and `npm run generated:drift:check` passed on the same commit.
- A full local clone of commit `8426b5b8b6d103f15672e66c377e2d51d6c3f53e` passed `npm run claims:evidence-state:check`.
- A shallow local clone reproduced the CI failure with the same stale status-summary message.
- `.github/workflows/release-artifacts.yml` and `.github/workflows/verify.yml` used `actions/checkout@v6` without `fetch-depth: 0`.

## Reproduction

```bash
rm -rf /tmp/cautilus-shallow-repro
git clone --quiet --depth 1 --no-local file:///home/hwidong/codes/cautilus /tmp/cautilus-shallow-repro
cd /tmp/cautilus-shallow-repro
npm run claims:evidence-state:check
```

The shallow clone failed with:

```text
.cautilus/claims/status-summary.json is stale; run npm run claims:evidence-state
```

A full-history clone of the same commit passed the same command.

## Candidate Causes

- The release workflow did not fetch enough history for claim freshness comparison.
- The checked-in claim packet was actually stale against the release commit.
- CI had different evidence files or generated artifacts than the local checkout.

## Hypothesis

If shallow checkout history is the cause, then reproducing with `--depth 1` should fail while a full-history clone should pass, and setting `fetch-depth: 0` in the CI checkout should give `claim show` enough history to compute `fresh-with-head-drift` instead of stale.

## Verification

The hypothesis was confirmed locally:

- full-history clone: `npm run claims:evidence-state:check` passed
- shallow clone: `npm run claims:evidence-state:check` failed with the CI error

The repair sets `fetch-depth: 0` in both release and branch verify workflows so claim freshness checks can compare packet commit to current HEAD.

## Root Cause

The claim freshness gate depends on git history between the claim packet commit and current HEAD.
GitHub Actions shallow checkout omitted the packet commit, so the gate could not prove that changed committed files were generated-only or content-matching claim sources.

## Seam Risk

- Interrupt ID: release-ci-shallow-claim-freshness
- Risk Class: contract-freeze-risk
- Seam: GitHub Actions checkout history to claim freshness verification
- Disproving Observation: the same command passed in a full clone and failed in a shallow clone.
- What Local Reasoning Cannot Prove: whether future CI providers will default to shallow clones with enough reachable history for claim freshness checks.
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

CI workflows that run `npm run verify` must use a full-history checkout while claim freshness depends on comparing packet and current commits.
Release retries should not move failed public tags; create the next patch tag after fixing the workflow.
