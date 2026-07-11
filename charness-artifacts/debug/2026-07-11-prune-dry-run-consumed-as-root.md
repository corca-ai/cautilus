# Debug Review
Date: 2026-07-11

## Problem

The destructive `prune-workspace-artifacts` entrypoint accepts `--dry-run` as the value of `--root`, disables the intended safety flag, and deletes recognized artifacts under a literal `--dry-run` directory.

## Correct Behavior

Given a value-taking prune option followed by another option token or semantic emptiness, parsing must fail before inspecting or deleting any artifact directory.

## Observed Facts

- `readRequiredValue` rejects only absent or falsey tokens.
- `--root --dry-run --keep-last 0` consumes `--dry-run` as a root value, leaving `dryRun` false.
- In a disposable cwd containing `--dry-run/run-1/run.json`, the command exited 0 and removed `run-1` recursively.
- Numeric option parsers reject option tokens indirectly, but only after consuming them and with a type diagnostic rather than a missing-value diagnostic.

## Reproduction

- Create a disposable `--dry-run/run-1` directory containing `run.json`.
- Run `prune-workspace-artifacts.mjs --root --dry-run --keep-last 0` from its parent.
- Observe exit 0, `dryRun: false`, and deletion of the recognized run directory.

## Candidate Causes

- A present argv token was assumed to be a valid required value.
- The later root existence check was assumed to provide sufficient safety.
- The boolean `--dry-run` option was not tested adjacent to a missing root value.

## Hypothesis

- Falsifiable claim: shared required-value token classification is the only pre-deletion gap; malformed process probes fail on old code, and rejecting normalized emptiness or option tokens there makes all value-taking options fail before mutation while preserving valid pruning | disconfirmer: add and run a subprocess table against old code before repair.

## Verification

- confirmed — the isolated old-code command exited 0 and recursively deleted the recognized artifact directory; after repair, all six invalid-value probes preserve their sentinel and the full nine-test suite passes.

## Root Cause

The parser treated the safety flag as path data and advanced over it.
Because deletion policy then saw `dryRun: false`, a malformed command crossed directly into recursive removal.

## Invariant Proof

- Invariant: malformed required values fail before artifact classification or recursive removal.
- Producer Proof: process-boundary probes cover root, keep-last, and max-age-days option-token values, root whitespace, and both negative numeric diagnostics.
- Final-Consumer Proof: the recognized deletion sentinel remains present for every malformed invocation.
- Interface-Shape Sibling Scan: all three value-taking options share `readRequiredValue`; workspace-start and compare-worktrees now carry the same pre-mutation rule.
- Non-Claims: this does not add positional `--`, `--option=value`, or intentional leading-dash root support.

## Detection Gap

- `prune-workspace-artifacts.test.mjs` | valid pruning and valid dry-run were covered, but malformed adjacency never exercised the safety boundary | add a table-driven subprocess failure test with a deletion sentinel.

## Sibling Search

- Mental model: a safety flag can safely appear wherever a value token is expected.
- same layer axis: root and numeric retention values | decision: same bug, fix now | proof: one shared required-value helper owns all three.
- abstraction up axis: mutating runtime parsers | decision: fixed in the two reproduced siblings, monitor elsewhere | proof: workspace-start and compare-worktrees now reject the same shapes.
- specialization down axis: recursive `rmSync` | decision: same bug, fix now | proof: the disposable sentinel was removed on old code.
- cross-file: `workspace-start.mjs` and `prepare-compare-worktrees.mjs` demonstrate the intended guard at sibling mutating boundaries.

## Seam Risk

- Interrupt ID: prune-dry-run-consumed-as-root
- Risk Class: none
- Seam: CLI parsing to recursive artifact deletion
- Disproving Observation: six invalid-value subprocess probes fail while their recognized deletion sentinels remain.
- What Local Reasoning Cannot Prove: every parser outside the reproduced mutating helper family.
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Reject option tokens and semantic emptiness in the shared required-value helper, and keep a real-process deletion sentinel in the owning tests.
