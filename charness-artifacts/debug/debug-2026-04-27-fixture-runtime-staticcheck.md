# Debug Review: fixture runtime staticcheck
Date: 2026-04-27

## Problem

`npm run verify` failed during `npm run lint:go` after adding the public `cautilus eval test --runtime fixture` path.
The exact error was `internal/app/remaining_commands.go:624:2: QF1003: could use tagged switch on effectiveRuntime (staticcheck)`.

## Correct Behavior

Given `eval test` accepts `codex`, `claude`, and `fixture` runtimes, when the CLI maps the selected runtime to an adapter backend value, then the code should pass the repo's Go lint gate without changing the runtime contract.

## Observed Facts

- `go test ./internal/app` passed before the full verify run.
- `npm run verify` passed eslint, spec, archetype, contract, link, and skill-disclosure checks before failing in `lint:go`.
- The failing branch was a newly extended `if`/`else if` chain over `effectiveRuntime`.
- The staticcheck finding named `QF1003`, which asks for a tagged `switch` in this shape.

## Reproduction

```bash
npm run verify
```

The failure occurred in the `lint:go` phase with the staticcheck message above.

## Candidate Causes

- The new `fixture` branch made a previously small conditional look like a switch candidate to staticcheck.
- The parse-time runtime validation may have been wrong, causing a more complex control-flow problem downstream.
- A generated or synced file may have reintroduced stale runtime names into the Go path.

## Hypothesis

If the backend mapping is rewritten as a tagged `switch` over `effectiveRuntime`, then staticcheck's `QF1003` finding should disappear while the existing fixture runtime smoke test still proves the same backend value.

## Verification

Rewrote the backend mapping in `internal/app/remaining_commands.go` from `if`/`else if` to `switch effectiveRuntime`.
The fixture runtime smoke test remains responsible for proving that `--runtime fixture` maps to the adapter backend value `fixture`.

## Root Cause

The implementation extended a two-runtime conditional into a three-runtime conditional without matching the repo's staticcheck style expectations for repeated comparisons against one value.

## Seam Risk

- Interrupt ID: fixture-runtime-staticcheck
- Risk Class: none
- Seam: Go CLI runtime dispatch style
- Disproving Observation: staticcheck rejected the newly extended conditional even though functional tests passed
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: none

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Prefer a tagged `switch` when adding a third branch to CLI enum-style runtime dispatch.
Keep the CLI smoke test focused on the externally visible runtime-to-backend contract, so style repairs do not weaken behavior proof.
