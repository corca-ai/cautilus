# Debug Review
Date: 2026-05-11

## Problem

The `v0.15.0` and `v0.15.1` tag-triggered `release-artifacts` workflows failed during `npm run verify`.

## Correct Behavior

Given a release tag points at a commit after the checked-in claim packet was generated, when CI runs `npm run claims:evidence-state:check`, then the checkout should include enough git history to compare the packet commit with the tag commit and distinguish source drift from generated-artifact commit drift.
Given CI renders or checks the human-readable claim status report from checked-in JSON packets, when the same commit is checked out in a clean clone, then `npm run claims:status-report:check` should produce the same report as the maintainer workspace.

## Observed Facts

- GitHub Actions run `25649021254` failed in the `release-artifacts` workflow at `Run npm run verify`.
- The failed log showed `.cautilus/claims/status-summary.json is stale; run npm run claims:evidence-state`.
- The failure happened after the tag was pushed, before release assets were built or published.
- Local `npm run verify`, `npm run claims:evidence-state:check`, and `npm run generated:drift:check` passed on the same commit.
- A full local clone of commit `8426b5b8b6d103f15672e66c377e2d51d6c3f53e` passed `npm run claims:evidence-state:check`.
- A shallow local clone reproduced the CI failure with the same stale status-summary message.
- `.github/workflows/release-artifacts.yml` and `.github/workflows/verify.yml` used `actions/checkout@v6` without `fetch-depth: 0`.
- GitHub Actions run `25649251200` for `v0.15.1` failed later in the same workflow step.
- The second failed log showed `.cautilus/claims/claim-status-report.md is stale; run npm run claims:status-report`.
- A full clean local clone of `a30e823f64fa046aeb2bf82275deef994ce1c4ea` reproduced the second failure.
- Re-rendering the report in that clean clone changed only the latest refresh summary from the checked-in `up-to-date` summary to the historical `.cautilus/claims/refresh-plan.json` changes-detected summary.
- `scripts/agent-runtime/claim-status-refresh-plans.mjs` selected the latest refresh plan by filesystem `mtimeMs`.

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

For the second failure:

```bash
rm -rf /tmp/cautilus-status-repro
git clone --quiet --no-hardlinks /home/hwidong/codes/cautilus /tmp/cautilus-status-repro
cd /tmp/cautilus-status-repro
git checkout --quiet a30e823f64fa046aeb2bf82275deef994ce1c4ea
npm run claims:evidence-state:check
npm run claims:status-report:check
```

The status report check failed with:

```text
.cautilus/claims/claim-status-report.md is stale; run npm run claims:status-report
```

## Candidate Causes

- The release workflow did not fetch enough history for claim freshness comparison.
- The checked-in claim packet was actually stale against the release commit.
- CI had different evidence files or generated artifacts than the local checkout.
- Claim status report rendering depended on filesystem metadata that changes between maintainer worktrees and clean CI checkouts.
- The clean clone had a different Node runtime or locale sort behavior than the maintainer workspace.

## Hypothesis

If shallow checkout history is the first cause, then reproducing with `--depth 1` should fail while a full-history clone should pass, and setting `fetch-depth: 0` in the CI checkout should give `claim show` enough history to compute `fresh-with-head-drift` instead of stale.
If filesystem `mtimeMs` is the second cause, then a clean clone can select a different refresh plan than the maintainer workspace without any JSON packet content changing, and replacing mtime selection with packet-currentness plus deterministic path ordering should make `claims:status-report:check` stable.

## Verification

The hypothesis was confirmed locally:

- full-history clone: `npm run claims:evidence-state:check` passed
- shallow clone: `npm run claims:evidence-state:check` failed with the CI error

The repair sets `fetch-depth: 0` in both release and branch verify workflows so claim freshness checks can compare packet commit to current HEAD.

The second hypothesis was confirmed by the clean-clone diff:

- clean clone before repair: `npm run claims:status-report:check` failed
- report diff: only the latest refresh summary changed
- implementation inspection: `renderRefreshPlans` selected the summary by `mtimeMs`
- targeted regression test: `node --test scripts/agent-runtime/render-claim-status-report.test.mjs` passed after replacing mtime selection

## Root Cause

The claim freshness gate depends on git history between the claim packet commit and current HEAD.
GitHub Actions shallow checkout omitted the packet commit, so the gate could not prove that changed committed files were generated-only or content-matching claim sources.
The claim status report gate also depended on filesystem mtimes when choosing which refresh plan summary to display.
Git does not preserve maintainer worktree mtimes, so a clean checkout could render a different report for the same commit.

## Seam Risk

- Interrupt ID: release-ci-shallow-claim-freshness
- Risk Class: contract-freeze-risk
- Seam: GitHub Actions checkout history to claim freshness verification
- Disproving Observation: the same command passed in a full clone and failed in a shallow clone; a full clean clone later failed only because claim report rendering selected refresh plans by checkout-local mtime.
- What Local Reasoning Cannot Prove: whether future CI providers will default to shallow clones with enough reachable history for claim freshness checks, or whether future generated reports still depend on local filesystem metadata.
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

CI workflows that run `npm run verify` must use a full-history checkout while claim freshness depends on comparing packet and current commits.
Generated report checks must not select visible report content from filesystem metadata that source control does not preserve.
Release retries should not move failed public tags; create the next patch tag after fixing the workflow.
