# Debug Review
Date: 2026-05-11

## Problem

`npm run verify` failed after refreshing claim projections for fixture-runtime evidence because `.cautilus/claims/claim-status-report.md` was reported stale.

## Correct Behavior

Given `.cautilus/claims/evidenced-typed-runners.json` changes, when claim projections are refreshed, then canonical map, evidence state, status summary, and status report should be regenerated in dependency order.

Given the status report has just been regenerated from current inputs, when `npm run claims:status-report:check` runs, then it should exit 0.

## Observed Facts

- Exact failing error: `Error: .cautilus/claims/claim-status-report.md is stale; run npm run claims:status-report`.
- The failure happened inside `scripts/agent-runtime/render-claim-status-report.mjs` during the check comparison between the checked-in report and freshly rendered output.
- `package.json` shows both `claims:status-report` and `claims:status-report:check` use `.cautilus/claims/evidenced-typed-runners.json`, `.cautilus/claims/status-summary.json`, and `.cautilus/claims/claim-status-report.md`.
- The earlier refresh ran `claims:canonical-map`, `claims:evidence-state`, and `claims:status-report` in parallel, even though `claims:status-report` reads canonical-map digests and status snapshots.
- Re-running the same generation commands sequentially made `npm run claims:status-report:check` pass.

## Reproduction

The stale check reproduced with:

```bash
npm run claims:status-report:check
```

It passed after the dependency-ordered refresh:

```bash
npm run claims:canonical-map && npm run claims:evidence-state && npm run claims:status-report && npm run claims:status-report:check
```

## Candidate Causes

- The status report was rendered before the concurrently running canonical-map command finished writing its new digest.
- The evidence-state refresh changed `.cautilus/claims/status-summary.json` while the report renderer was reading the previous snapshot.
- A real rendering nondeterminism in `render-claim-status-report.mjs` made successive renders differ even with identical inputs.

## Hypothesis

If the stale report came from running dependent projection commands in parallel, then regenerating them in dependency order should produce a report that passes `claims:status-report:check` without code changes.

## Verification

`npm run claims:canonical-map && npm run claims:evidence-state && npm run claims:status-report && npm run claims:status-report:check` exited 0.

This falsifies the rendering-nondeterminism hypothesis for this incident and confirms the dependency-order explanation.

## Root Cause

The projection refresh was executed with unsafe parallelism.

`claims:status-report` depends on digests and status snapshots that are written by `claims:canonical-map` and `claims:evidence-state`, so it must run after those commands, not concurrently with them.

## Seam Risk

- Interrupt ID: claim-projection-command-order
- Risk Class: none
- Seam: manually orchestrated claim projection refresh commands
- Disproving Observation: a generated report failed its own check until the same commands were rerun sequentially.
- What Local Reasoning Cannot Prove: whether future agents will remember the dependency order when manually composing claim refresh commands.
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Do not run claim projection writers in parallel when one output is a digest or input to another projection.

Use this order after applying claim review results: `claims:apply-review-results`, `claims:canonical-map`, `claims:evidence-state`, then `claims:status-report`.

If this recurs, add a single package script that owns the dependency order.

## Related Prior Incidents

- `debug-2026-05-04-command-execution-order-gap.md`: prior workflow bug where command order mattered more than a single command's local success.
- `debug-2026-05-04-evidence-bundle-hash-cascade.md`: related claim evidence projection incident where partial refresh order produced shape-valid but semantically stale evidence refs.
