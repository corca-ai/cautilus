# Debug Review: claim semantic group unparam
Date: 2026-04-30

## Problem

`npm run verify` failed during `npm run lint:go`.

## Correct Behavior

Given claim semantic grouping no longer uses `nextAction` and `why` text as grouping input, when golangci-lint runs, then the function signature should not keep unused parameters.

## Observed Facts

- `npm run verify` passed eslint, specs, archetypes, contracts, links, and skill disclosure.
- It failed at golangci-lint.
- The exact lint error was `internal/runtime/claim_discovery.go:1022:41: claimSemanticGroup - nextAction is unused (unparam)`.
- The earlier heuristic intentionally removed `nextAction` and `why` from the semantic-group haystack to prevent broad `Quality gates` contamination.

## Reproduction

```bash
npm run verify
```

The failing subcommand is:

```bash
npm run lint:go
```

## Candidate Causes

- The function signature still includes parameters that are no longer used.
- The caller may still be passing values because the old signature was left in place after the grouping change.
- golangci-lint may be reading stale generated code.

## Hypothesis

If `claimSemanticGroup` accepts only the fields it still uses, and the call site is updated accordingly, then golangci-lint should pass without reintroducing the old overbroad grouping behavior.

## Verification

After repair, rerun:

```bash
npm run lint:go
npm run verify
```

## Root Cause

The grouping heuristic change removed `nextAction` and `why` from the implementation but did not update the function boundary.

## Seam Risk

- Interrupt ID: claim-semantic-group-unparam
- Risk Class: none
- Seam: Go lint hygiene after heuristic narrowing
- Disproving Observation: lint pointed to an unused parameter, not a behavioral test failure
- What Local Reasoning Cannot Prove: whether full verify has later unrelated failures after this lint fix
- Generalization Pressure: none

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When narrowing heuristic input fields, update the helper signature in the same patch so lint catches only real regressions.
