# Release Fresh Checkout Shallow Probe Debug
Date: 2026-05-13

## Problem

The declared release fresh-checkout probe failed after the 0.15.4 release-prep commit even though local claim evidence checks passed.

## Correct Behavior

Given a release probe clones the current branch to validate claim freshness, it should fetch enough history to compare the checked-in claim packet commit with the current release head.

## Observed Facts

- `check_fresh_checkout_probes.py --run-probes` clones with `--depth 1`.
- `npm run claims:evidence-state:check` failed inside that shallow clone.
- A manual shallow clone reported `gitState.comparisonStatus=stale-unknown-diff`.
- The status packet in the release branch was otherwise locally fresh.

## Reproduction

```bash
python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.23/skills/release/scripts/check_fresh_checkout_probes.py --repo-root . --run-probes --json
```

## Candidate Causes

- The claim packet itself was stale.
- The release version bump changed claim sources.
- The fresh-checkout probe lacked enough git history to compare commits.

## Hypothesis

The fresh-checkout probe's shallow clone could not see the packet commit, so claim evidence state reported an unknown stale diff even when a full-history checkout could validate the packet.

## Verification

- Added `git fetch --unshallow --quiet || true` as the first declared fresh-checkout probe in `.agents/release-adapter.yaml`.
- Re-ran the release fresh-checkout probes; the claim evidence and generated drift probes passed after history was available.

## Root Cause

The release adapter declared claim freshness probes without first ensuring the probe checkout had enough history for commit comparison.

## Seam Risk

- Interrupt ID: release-fresh-checkout-shallow-probe
- Risk Class: none
- Seam: release adapter fresh-checkout clone depth to claim evidence git-state comparison
- Disproving Observation: Unshallowing the probe checkout lets the same claim freshness commands pass.
- What Local Reasoning Cannot Prove: whether future external release runners preserve full git history unless they run the same probe sequence.
- Generalization Pressure: none

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep the release adapter's fresh-checkout probes responsible for fetching enough git history before running claim freshness checks.
