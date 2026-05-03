# Claim Discovery Script Name Debug
Date: 2026-05-04

## Problem

I tried to refresh Cautilus claim artifacts with `npm run claims:discover`, but that package script does not exist.

## Correct Behavior

Given a claim-discovery heuristic change, the operator should use the checked-in binary command to refresh `.cautilus/claims/latest.json`, then use the existing package scripts for canonical-map and status-report rendering.

## Observed Facts

The exact failure was:

```text
npm error Missing script: "claims:discover"
```

`package.json` defines `claims:apply-review-results`, `claims:canonical-map`, `claims:review-worksheet`, `claims:status-report`, and `claims:status-server`, but no `claims:discover` script.

## Reproduction

Run:

```bash
npm run claims:discover
```

## Candidate Causes

- I inferred a script name from the existing `claims:*` family instead of checking `package.json` first.
- The repo intentionally keeps discovery as a binary command rather than an npm wrapper.
- The workflow evolved and earlier session memory no longer matched the current script surface.

## Hypothesis

If I run `./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json` directly, then the claim packet can be refreshed without adding a new package script.

## Verification

`./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json` refreshed the raw claim packet with `discoveryEngine.ruleset=claim-discovery-rules.v4`.
`npm run claims:apply-review-results`, `./bin/cautilus claim show --input .cautilus/claims/evidenced-typed-runners.json --sample-claims 10 --output .cautilus/claims/status-summary.json`, `npm run claims:canonical-map`, and `npm run claims:status-report` then completed successfully.

## Root Cause

Operator command-memory drift: discovery is a binary-owned surface, while the package scripts only render or apply follow-up claim artifacts.

## Seam Risk

- Interrupt ID: claim-discovery-script-name
- Risk Class: none
- Seam: local operator command selection
- Disproving Observation: `package.json` has no `claims:discover` script.
- What Local Reasoning Cannot Prove: Whether a convenience script should be added later; this incident only proves the current command was wrong.
- Generalization Pressure: none

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Check `package.json` or `cautilus commands --json` before assuming a package-script alias exists for binary-owned workflows.
