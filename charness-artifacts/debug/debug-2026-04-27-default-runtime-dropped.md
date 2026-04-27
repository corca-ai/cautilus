# Debug Review: default runtime dropped
Date: 2026-04-27

## Problem

`npm run dogfood:app-chat:fixture` and `npm run dogfood:app-prompt:fixture` failed even though their named adapters declared `default_runtime: fixture`.
The observed `eval test` banner still printed `runtime=codex`, and the app fixture runner received `--backend codex_exec`.

## Correct Behavior

Given a named adapter declares `default_runtime: fixture`, when `cautilus eval test --adapter-name <name>` runs without an explicit `--runtime`, then the CLI should use the adapter default runtime and pass `{backend}=fixture` to the adapter command template.

## Observed Facts

- The app smoke adapters had `default_runtime: fixture`.
- `eval test` still chose `runtime=codex`.
- The runner failed before producing `eval-observed.json` because it only accepts `--backend fixture`.
- `runtime.LoadAdapter` validated known string fields through `adapterStringFields`.
- `default_runtime` was documented in adapter contracts but was missing from the Go adapter normalizer's string field list.

## Reproduction

```bash
npm run dogfood:app-chat:fixture
npm run dogfood:app-prompt:fixture
```

Before the fix, both commands failed with `{backend}=codex_exec`.

## Candidate Causes

- The named adapter resolver may have selected the wrong adapter file.
- `parseEvalTestArgs` may have overwritten the runtime after adapter resolution.
- The adapter normalizer may have dropped `default_runtime` from the payload read by `eval test`.

## Hypothesis

If `default_runtime` is preserved by the Go adapter normalizer, then `eval test` will use `runtime=fixture` for named adapters that declare it, and both app fixture smoke runs will pass without an explicit `--runtime`.

## Verification

Added `default_runtime` to the Go adapter string fields and changed the CLI smoke test so fixture runtime selection is proven through adapter default runtime, not only an explicit CLI flag.
Reran `go test ./internal/runtime ./internal/app`.
Reran `npm run dogfood:app-chat:fixture` and `npm run dogfood:app-prompt:fixture`; both completed with `recommendation=accept-now`.

## Root Cause

The adapter contract and docs had gained `default_runtime`, but the Go adapter normalizer did not preserve that field.
`runEvalTestPipeline` therefore saw an empty adapter default and fell back to `codex`.

## Seam Risk

- Interrupt ID: default-runtime-dropped
- Risk Class: none
- Seam: adapter contract docs to Go adapter normalizer
- Disproving Observation: a named adapter declared `default_runtime: fixture`, but `eval test` still selected `runtime=codex`
- What Local Reasoning Cannot Prove: whether future adapter fields are added to docs without matching runtime normalization
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep CLI smoke coverage on adapter-default behavior as well as explicit flag behavior when adding adapter-owned defaults.
Consider a future contract drift check that compares documented adapter fields with the Go normalizer's accepted fields.
