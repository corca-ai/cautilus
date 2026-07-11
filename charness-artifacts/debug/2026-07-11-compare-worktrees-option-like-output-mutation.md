# Debug Review
Date: 2026-07-11

## Problem

The mutating `prepare-compare-worktrees` entrypoint accepts option-looking and whitespace-only tokens as required values; `--output-dir --force` succeeds and creates Git worktrees under a directory literally named `--force`.

## Correct Behavior

Given any value-taking option followed by another option token or semantic emptiness, argument parsing must fail before creating directories, adding worktrees, or changing Git worktree metadata.

## Observed Facts

- `readRequiredValue` rejects only absent or falsey tokens.
- `--output-dir --force` consumes the boolean flag as the output path, so `force` remains false.
- In a disposable repository, the command exited 0 and created `--force/baseline`, `--force/candidate`, and matching `.git/worktrees` metadata.
- The existing tests cover valid explicit, inherited, automatic, retry, and force behavior but no malformed required values.

## Reproduction

- Initialize and commit a disposable Git repository.
- From that repository, run `prepare-compare-worktrees.mjs --repo-root <repo> --output-dir --force --baseline-ref HEAD`.
- Observe exit 0 plus new `--force/baseline` and `--force/candidate` worktrees.

## Candidate Causes

- A present argv token was assumed to be a valid value.
- Dash-prefixed refs and paths were intentionally supported without an escape contract.
- Validation after `resolveRunDir` was assumed sufficient.

## Hypothesis

- Falsifiable claim: the shared `readRequiredValue` is the pre-mutation gap for every value-taking option; a subprocess table will reproduce option-like and whitespace-only acceptance on old code, and normalized/token-class rejection there will fail all cases with an untouched disposable repository | disconfirmer: run the table against old code before repair.

## Verification

- confirmed — the isolated old-code command exited 0 and materialized both worktrees under `--force`; after repair, all five malformed-value probes fail before mutation and the full 12-assertion test suite passes.

## Root Cause

The parser equated token presence with semantic validity and advanced past a real option as though it were data.
The worktree mutator therefore received a malformed path before any guard could stop filesystem and Git metadata changes.

## Invariant Proof

- Invariant: malformed required values are rejected before `resolveRunDir` or any Git worktree command.
- Producer Proof: exercise each value-taking option at the real process boundary with an option-like token, plus the output path's whitespace normalization seam.
- Final-Consumer Proof: require nonzero exit and assert that the disposable repository has no added worktree records or output directory.
- Interface-Shape Sibling Scan: all four value-taking options share `readRequiredValue`; the destructive prune sibling is tracked as the next separate slice.
- Non-Claims: this does not add `--option=value`, positional `--`, or intentional leading-dash value support.

## Detection Gap

- `prepare-compare-worktrees.test.mjs` | only valid parser shapes reached the mutator | add a table-driven process-boundary failure test with Git and filesystem side-effect assertions.

## Sibling Search

- Mental model: any present token after a value option is data.
- same layer axis: repo root, baseline ref, candidate ref, and output dir | decision: same bug, fix now | proof: one shared parser helper owns all four.
- abstraction up axis: independently executable mutating Node helpers | decision: same bug exists in prune, fix next | proof: its root parser can consume `--dry-run` before recursive deletion.
- specialization down axis: output directory creation and Git worktree registration | decision: same bug, fix now | proof: disposable reproduction observed both side effects.
- cross-file: `prune-workspace-artifacts.mjs` has the destructive sibling; `workspace-start.mjs` now demonstrates the intended required-value guard.

## Seam Risk

- Interrupt ID: compare-worktrees-option-like-output-mutation
- Risk Class: none
- Seam: CLI argument parsing to filesystem and Git worktree mutation
- Disproving Observation: five malformed subprocess probes fail and leave both the watched cwd and Git worktree list unchanged.
- What Local Reasoning Cannot Prove: all other independently executable mutating parsers.
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Reject semantic emptiness and option tokens in the shared parser before dispatch, then pin failure order at the real process boundary.
