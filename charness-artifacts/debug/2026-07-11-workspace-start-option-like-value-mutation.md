# Debug Review
Date: 2026-07-11

## Problem

The Node workspace-start helper accepts option-looking and whitespace-only tokens as values of `--root` or `--label`; `--root --json` and `--root "   "` can mutate the filesystem instead of rejecting before side effects.

## Correct Behavior

Given a value-taking workspace-start option followed by another option token or an all-whitespace value, when the helper parses arguments, then it must fail before creating a root, run directory, or manifest and identify the option whose value is missing.

## Observed Facts

- `readRequiredValue` rejects only falsey or absent values and returns `--json` as ordinary text.
- `applyArgument` advances past the consumed token, so the real `--json` flag is never interpreted.
- The public Go CLI rejects `init run --root --json` with `--root requires a value`, exits 1, and creates nothing.
- The direct Node helper exited 0, created `--json/<timestamp>-run/run.json`, and printed a shell export.

## Reproduction

- Run the Node helper inside a disposable cwd with `--root --json`; observe exit 0 and a new `--json` directory.
- Add subprocess tests for `--root --json` and `--label --json` that require nonzero exit and an unchanged cwd before repair.

## Candidate Causes

- Dash-prefixed path and label values were intentionally supported without a `--` separator.
- The parser treats required-value presence as JavaScript truthiness rather than option-token classification.
- Only valid CLI paths were tested, leaving parser failure order unobserved.
- The public Go parser and Node helper drifted because they do not share one argument parser.

## Hypothesis

- Falsifiable claim: `readRequiredValue` is the single pre-mutation gap for both value-taking options; option-like subprocess tests fail on old code, and rejecting leading-dash tokens there will align both options with Go while preserving valid paths/labels | disconfirmer: run the new subprocess tests against current code before repair.

## Verification

- confirmed — the focused subprocess test failed against the old parser because `--root --json` exited 0 and mutated the cwd; both option cases pass after shared required-value rejection.

## Root Cause

The shared required-value parser checked token truthiness but not normalized emptiness or whether the token was the next option.
Because parsing precedes filesystem creation but accepted malformed tokens as data, the mutator crossed its side-effect boundary with invalid arguments.

## Invariant Proof

- Invariant: workspace-start parses and rejects missing/option-looking required values before any filesystem mutation.
- Producer Proof: one process-boundary table exercises both value-taking options with option-looking and whitespace-only values and requires a `Missing value for <option>` diagnostic.
- Final-Consumer Proof: the subprocess test requires nonzero exit and an empty watched cwd for all four malformed invocations.
- Interface-Shape Sibling Scan: both value-taking options share `readRequiredValue`; the Go CLI already enforces the desired failure order.
- Non-Claims: this fix does not add `--option=value`, a `--` positional escape, or support for intentional dash-prefixed root/label values.

## Detection Gap

- `workspace-start.test.mjs` | valid invocations proved creation but no option-looking positional case checked pre-mutation safety | add subprocess failures with watched cwd state for every value-taking option.

## Sibling Search

- Mental model: a present argv token is necessarily a value rather than the next option.
- same layer axis: `--root` and `--label` through `readRequiredValue` | decision: same bug, fix now | proof: shared parser path plus direct root mutation reproduction.
- abstraction up axis: mutating Node CLI helpers with value-taking options | decision: same class, diagnostic-only for this slice | proof: current quality inventory lacks an executable side-effect contract; no action needed beyond workspace-start because this slice owns the reproduced mutator and broader contract authoring remains a separate quality move.
- specialization down axis: root/run/manifest writes after parsing | decision: same bug, fix now | proof: disposable cwd contains the new `--json` tree on old code.
- mental-model axis: intentional dash-prefixed values | decision: intentional plain-text or non-rendering boundary | proof: no documented escape contract exists and the public Go CLI rejects the same shape.
- cross-file: `internal/app/app.go` owns the safe Go parser sibling and `scripts/agent-runtime/workspace-start.mjs` owns the affected Node helper.

## Seam Risk

- Interrupt ID: workspace-start-option-like-value-mutation
- Risk Class: none
- Seam: CLI argument parsing to filesystem creation
- Disproving Observation: focused subprocess probes already reject both shapes and leave cwd unchanged.
- What Local Reasoning Cannot Prove: every other mutating helper without a declared side-effect probe contract.
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Reject option-looking required values in the shared parser helper, prove both value-taking options at the real process boundary, and consider an executable side-effect probe contract after this concrete fixture exists.
