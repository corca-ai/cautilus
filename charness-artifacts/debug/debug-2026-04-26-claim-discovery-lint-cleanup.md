# Debug Review: claim discovery lint cleanup
Date: 2026-04-26

## Problem

`npm run verify` failed during `npm run lint:go`.
The exact lint findings were:

```text
internal/runtime/claim_discovery_test.go:70:34: execCommand - name always receives "git" (unparam)
internal/runtime/claim_discovery.go:308:6: func isClaimSourceFile is unused (unused)
```

## Correct Behavior

Given the claim discovery workflow implementation changes the runtime and tests, when `npm run verify` runs, then Go lint should pass without unused helpers or over-generalized test helpers.

## Observed Facts

- The new entry-driven Markdown traversal no longer used the previous broad source-file helper.
- The new refresh-plan test introduced a generic `execCommand(workdir, name, args...)` helper, but every call passed `git`.
- `go test ./internal/runtime ./internal/app ./internal/cli` had passed before the lint run.

## Reproduction

Run:

```bash
npm run verify
```

The failure occurs in the `lint · golangci-lint` phase.

## Candidate Causes

- Dead code remained after replacing broad source tree walking with entry-driven Markdown traversal.
- The test helper was over-generalized beyond current use.
- The linter configuration changed unexpectedly.

## Hypothesis

If the dead helper is removed and the test helper is narrowed to `git`, then `npm run lint:go` should pass without changing claim discovery behavior.

## Verification

Removed the unused helper and replaced the generic test command helper with `execGit` / `execGitOutput`.
Rerun verification is part of the implementation closeout.

## Root Cause

The implementation changed the source discovery approach but left one old helper behind, and the new test helper was more general than its actual use.

## Seam Risk

- Interrupt ID: claim-discovery-lint-cleanup
- Risk Class: none
- Seam: claim discovery runtime tests and lint hygiene
- Disproving Observation: lint found dead code and an over-generalized test helper
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: none

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

After replacing source traversal strategies, run `npm run lint:go` or full `npm run verify` before treating compile-only proof as sufficient.
