# Claim Status Report Check Order Debug
Date: 2026-05-17

## Problem

While closing the comparison-prepare claim evidence slice, `npm run claims:status-report:check` failed with:

```text
Error: .cautilus/claims/claim-status-report.md is stale; run npm run claims:status-report
```

The failure happened after launching `claims:evidence-state:check` and `claims:status-report:check` in the same parallel tool group.

## Correct Behavior

Given claim evidence has just been applied, when generated claim status artifacts are checked, then any command that refreshes `status-summary.json` should finish before `claim-status-report.md` is rendered or checked against that status file.

## Observed Facts

- `npm run claims:apply-review-results` succeeded and wrote `.cautilus/claims/evidenced-typed-runners.json`.
- `npm run claims:evidence-state` and `npm run claims:status-report` succeeded.
- A parallel check group then ran `npm run claims:evidence-state:check` and `npm run claims:status-report:check`.
- `claims:evidence-state:check` uses `--refresh-status`, so it can touch `.cautilus/claims/status-summary.json`.
- `claims:status-report:check` failed because the report no longer matched the refreshed status input.
- Running `npm run claims:status-report && npm run claims:status-report:check` serially passed.
- Running `npm run claims:evidence-state:check && npm run claims:status-report && npm run claims:status-report:check` serially also passed.

## Reproduction

After applying review results, run a status-refreshing check and a report check concurrently:

```bash
npm run claims:evidence-state:check
npm run claims:status-report:check
```

The commands are safe when ordered serially but can produce a stale-report observation when launched together.

## Candidate Causes

- `claims:status-report` may have failed to write the generated report.
- `claims:evidence-state:check --refresh-status` may have changed `status-summary.json` after the report was generated.
- The new evidence bundle may have invalid review-result data that produces nondeterministic status output.

## Hypothesis

If the failure is caused by a generated-artifact ordering race, then rerunning the status refresh first, regenerating the report second, and checking the report third should pass without product code changes.

## Verification

The serial sequence passed:

```bash
npm run claims:evidence-state:check && npm run claims:status-report && npm run claims:status-report:check
```

`claim-docs-guides-evaluation-process-md-52` remained `agent-reviewed` and `satisfied` in `.cautilus/claims/evidenced-typed-runners.json`.

## Root Cause

This was local tool orchestration error.
I parallelized generated-artifact checks even though one check refreshes `status-summary.json`, which is an input to the other check.

## Detection Gap

- Generated claim artifact closeout | no local guard prevented parallelizing a status writer with a report reader | run claim status artifact checks serially in dependency order.

## Sibling Search

- Mental model: independent `npm run ...:check` commands are safe to parallelize.
- Claim evidence axis: `claims:evidence-state:check --refresh-status` is a writer even though it is named as a check; decision: treat it as a writer; proof: serial ordering passes.
- Status report axis: `claims:status-report:check` reads both `.cautilus/claims/evidenced-typed-runners.json` and `.cautilus/claims/status-summary.json`; decision: run it after any status refresh; proof: stale error disappeared after regenerating the report.
- Prior-memory axis: this repeats the parallel writer/reader warning captured in `debug-2026-05-16-parallel-observation-output-race.md`; decision: keep dependent generated-artifact commands serial.

## Seam Risk

- Interrupt ID: claim-status-report-check-order
- Risk Class: none
- Seam: local generated-artifact command ordering
- Disproving Observation: the serial refresh, render, and check sequence passed.
- What Local Reasoning Cannot Prove: whether every historical generated claim artifact was refreshed in a race-free order.
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

For claim closeout, run `claims:evidence-state:check`, then `claims:status-report`, then `claims:status-report:check` serially.
Do not parallelize commands where one uses `--refresh-status` and another reads the refreshed status file.

## Related Prior Incidents

- `debug-2026-05-16-parallel-observation-output-race.md`: writer and reader commands launched together created a false missing-output signal.
