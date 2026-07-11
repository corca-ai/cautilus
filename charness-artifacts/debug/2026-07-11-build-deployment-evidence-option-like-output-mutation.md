# Debug Review: build-deployment-evidence option-like output mutation
Date: 2026-07-11

## Problem

The independently executable deployment-evidence builder accepts option-looking or whitespace-only tokens as required path values.
With valid input, `--output --help` exits successfully and creates a file literally named `--help` in the current working directory.

## Correct Behavior

Given `--input` or `--output` followed by another option token or semantic emptiness, parsing must fail with an option-specific diagnostic before reading input or writing output.

## Observed Facts

- `readRequiredValue` at `scripts/agent-runtime/build-deployment-evidence.mjs:24` rejects only absent or falsey tokens.
- The parser consumes the next token and skips it, so `--help` is treated as an output path rather than help.
- From a disposable cwd, valid fixture input plus `--output --help` exited 0 and created a JSON packet in a literal `--help` file.
- `writeJsonOutput` resolves the accepted path, creates its parent directory, and writes without a second semantic path check.
- Existing deployment-evidence tests exercise pure preparation and aggregation behavior but not the executable parser boundary.

## Reproduction

- Run `node <repo>/scripts/agent-runtime/build-deployment-evidence.mjs --input <repo>/fixtures/deployment-evidence/example-input.json --output --help` from a disposable cwd.
- Observe exit 0, empty stderr, and a new `--help` JSON file.

## Candidate Causes

- A present argv token was assumed to be valid path data.
- Intentional leading-dash filenames were meant to be supported without a documented escape contract.
- The public caller or output writer was expected to validate direct helper invocations.
- Pure function coverage was mistaken for process-boundary parser coverage.

## Hypothesis

- Falsifiable claim: `readRequiredValue` is the sole pre-side-effect gap for both path options; process tests will reproduce option-like and whitespace-only acceptance on old code, and rejecting semantic emptiness plus option tokens there will make every case fail before cwd mutation | disconfirmer: run the process table against old code and observe that malformed output is already rejected without a file.

## Verification

- confirmed — the smallest old-code reproduction exited 0 and wrote `--help`; after repair, all four malformed process probes exit nonzero, name the affected option, and leave their watched cwd unchanged, while a valid input/output control still writes the expected two-row packet.

## Root Cause

The command's required-value contract equates token presence with semantic validity.
Because parsing is the only boundary before input resolution and output creation, malformed option tokens can cross into filesystem operations.

## Invariant Proof

- Invariant: `build-deployment-evidence` rejects malformed required path values before input reads or output writes.
- Producer Proof: real-process probes cover both `--input` and `--output` with option-like and whitespace-only tokens; malformed input filenames are pre-seeded with valid JSON so old code would reach the read branch.
- Final-Consumer Proof: every malformed invocation must exit nonzero, identify the affected option, and leave the watched cwd unchanged.
- Interface-Shape Sibling Scan: the adjacent deployment-evidence input preparer and other JSON output builders have independently copied required-value parsers; they require separate reproduction before repair.
- Non-Claims: this slice does not add `--option=value`, a positional `--` escape, or support for intentional leading-dash paths.

## Detection Gap

- `scripts/agent-runtime/deployment-evidence.test.mjs` | pure data contracts passed while the executable parser could mutate on malformed argv | add table-driven process-boundary failure tests with cwd side-effect assertions.
- `scripts/coverage-floor.json` | the previously unexecuted CLI file had no registered floor, so adding honest process coverage surfaced a 73.33% unfloored-file failure | register only this file at the policy-owned 0.25 percentage-point buffer rather than generating coverage-only cases or rewriting unrelated floors.

## Sibling Search

- Mental model: any present token after a value-taking option is necessarily data.
- same layer axis: `--input` and `--output` in `build-deployment-evidence.mjs` | decision: same bug, fix now | proof: one shared parser helper owns both.
- abstraction up axis: independently executable Node JSON writers | decision: same class, diagnostic-only for this slice | proof: static scan finds copied parsers; no action needed because copied syntax alone does not prove a reachable write mutation and this goal requires a disposable-cwd reproduction before repair.
- specialization down axis: `writeJsonOutput` parent creation and file write | decision: same bug, fix now | proof: disposable cwd contains the literal malformed output.
- mental-model axis: intentional leading-dash path values | decision: intentional plain-text or non-rendering boundary | proof: callers can spell such paths with `./` or an absolute path and no direct-token escape is documented.
- cross-file: `scripts/agent-runtime/prepare-deployment-evidence-input.mjs` is the nearest copied parser sibling; `scripts/agent-runtime/output-files.mjs` owns the downstream write.

## Seam Risk

- Interrupt ID: build-deployment-evidence-option-like-output-mutation
- Risk Class: none
- Seam: CLI argument parsing to input/output filesystem operations
- Disproving Observation: the four-case malformed process table passes while every watched cwd remains unchanged.
- What Local Reasoning Cannot Prove: all independently executable copied parser siblings.
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Reject semantic emptiness and option tokens at the owning parser boundary, pin both value-taking options with real-process no-side-effect tests, lock the newly visible CLI coverage baseline, and triage copied siblings only from fresh reproduction evidence.
