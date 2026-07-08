# Debug Review
Date: 2026-07-08

## Problem

During a quality run, the planned broad gate command `./scripts/run-quality.sh --read-only` failed with `zsh:1: no such file or directory: ./scripts/run-quality.sh`.

## Correct Behavior

Given Cautilus has a canonical standing quality gate, when a quality review needs broad deterministic evidence, then the run should use the repo-owned gate that exists and can emit runtime evidence.
For this repo that gate is `npm run verify`, backed by `scripts/run-verify.mjs`.

## Observed Facts

- `./scripts/run-quality.sh --read-only` exited 127 because `scripts/run-quality.sh` does not exist.
- `package.json` defines `verify` as `node scripts/run-verify.mjs`.
- `scripts/run-verify.mjs` owns ordered phase labels and supports `--runtime-signal <file>`.
- `.githooks/pre-push` already routes through `node scripts/guard-worktree-unchanged.mjs -- npm run verify`.
- The quality planner also detected `scripts/run-verify.mjs` and the package `verify` script as final gates in its maintainer-local-enforcement brief.
- Related prior incident `2026-06-22-verify-live-codex-exec.md` established `npm run verify` as the release/standing proof surface.

## Reproduction

- Run `./scripts/run-quality.sh --read-only` from repo root.
- Observe shell exit 127 and `no such file or directory`.
- Run `sed -n '1,220p' package.json` and `sed -n '1,220p' scripts/run-verify.mjs` to confirm the actual standing gate.

## Candidate Causes

- The quality gate packet names a portable/generic `run-quality.sh` command that this repo never adopted.
- The repo renamed or consolidated quality execution into `scripts/run-verify.mjs` without preserving a compatibility wrapper.
- The quality adapter's `gate_commands` still lists `npm run verify`, but the planner packet is generic and requires the operator to choose the equivalent existing gate.

## Hypothesis

- If the review treats `npm run verify -- --runtime-signal .charness/quality/runtime-signals.json` as the equivalent standing quality gate, then broad deterministic evidence and runtime timing can be collected without adding an unowned command.
  disconfirmer: if `package.json`, `.githooks/pre-push`, or `scripts/run-verify.mjs` do not point to `npm run verify` as the existing standing gate, then the hypothesis is false and a wrapper or adapter repair is required first.

## Verification

- Confirmed current repo command surface from `package.json`, `.githooks/pre-push`, and `scripts/run-verify.mjs`.
- Next verification in the quality run is to execute `npm run verify -- --runtime-signal .charness/quality/runtime-signals.json` instead of the missing generic script.

## Root Cause

The failure was a gate-name mismatch between a portable quality planner packet and Cautilus's actual repo-owned standing gate.
Cautilus currently owns `verify` through `scripts/run-verify.mjs`, not a `scripts/run-quality.sh` wrapper.

## Invariant Proof

- Invariant: quality review must use a repo-owned existing standing gate when the generic packet command is absent.
- Producer Proof: `package.json` maps `verify` to `node scripts/run-verify.mjs`.
- Final-Consumer Proof: `.githooks/pre-push` invokes `npm run verify` through the worktree guard.
- Interface-Shape Sibling Scan: `scripts/run-verify.mjs` exposes `--runtime-signal`, which satisfies the runtime evidence need without a separate shell wrapper.
- Non-Claims: this does not prove the full `npm run verify` result for this quality run; that belongs to the resumed quality gate execution.

## Detection Gap

- quality planner packet | missing generic command was only discovered at execution time | record the repo-specific equivalent gate in the quality artifact and prefer the existing `verify` command for this run
- repo command surface | no compatibility `scripts/run-quality.sh` wrapper exists | defer wrapper addition unless repeated operator runs need the alias

## Sibling Search

- Mental model: a planner-provided portable command is directly runnable in every consumer repo.
- same-surface: `gate_commands` names `npm run verify` while packet command names `./scripts/run-quality.sh --read-only` | decision: use `npm run verify` as the equivalent gate | proof: package and hook surfaces point there
- cross-file: `.githooks/pre-push` routes through `npm run verify`, not `run-quality.sh` | decision: no hook change in this debug slice | proof: hook content inspected

## Seam Risk

- Interrupt ID: quality-generic-gate-mismatch
- Risk Class: none
- Seam: installed quality planner packet to repo-local gate command naming
- Disproving Observation: shell exit 127 for `./scripts/run-quality.sh --read-only`
- What Local Reasoning Cannot Prove: whether the upstream quality planner should suppress this generic command when a repo-specific `gate_commands` field exists
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Continue the quality run through `npm run verify -- --runtime-signal .charness/quality/runtime-signals.json`.
If future quality runs repeatedly trip on the same generic command, add a repo-owned wrapper or adjust the quality adapter/planner contract in a separate slice.
