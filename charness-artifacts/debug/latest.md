# Debug Review: prepare-deployment-evidence-input malformed value mutation
Date: 2026-07-11

## Problem

The deployment-evidence input preparer accepts option-looking tokens for all six required values and also accepts semantic whitespace as a path value.
With otherwise valid arguments, `--output --help` exits successfully and creates a JSON file literally named `--help`.

## Correct Behavior

Given any value-taking option followed by another option token or semantic emptiness, parsing must fail with an option-specific diagnostic before input reads, normalization, or output writes.

## Observed Facts

- `readRequiredValue` at `scripts/agent-runtime/prepare-deployment-evidence-input.mjs:24` rejects only absent or falsey tokens.
- The same helper owns `--surface`, `--runtime`, `--source-kind`, `--input`, `--pass-status`, and `--output`.
- From a disposable cwd, valid scenario input plus `--output --help` exited 0 and created a one-row JSON packet in a literal `--help` file.
- The adjacent builder had the same reproduced parser-to-write mutation and is now protected by real-process valid/malformed controls.
- Broad coverage now includes this independently executable preparer at 101 statements and 80.20%; policy classifies it as an unfloored warn-band candidate until the new process coverage is stable.

## Reproduction

- Run `node <repo>/scripts/agent-runtime/prepare-deployment-evidence-input.mjs --surface workflow --runtime codex --source-kind scenario_results --input <repo>/fixtures/scenario-results/example-results.json --output --help` from a disposable cwd.
- Observe exit 0, empty stderr, and a new `--help` JSON file.

## Candidate Causes

- A present argv token was assumed to be valid data for every value option.
- Some runtime or status identifiers were intended to begin with a dash without a positional escape contract.
- Domain normalization was expected to catch malformed argv before filesystem effects.
- Pure deployment-evidence tests were expected to cover both independently executable wrappers.

## Hypothesis

- Falsifiable claim: the shared `readRequiredValue` is the pre-side-effect gap for all six options; a real-process table will fail against old code for option-specific rejection, and semantic-empty/option-token rejection there will make every malformed case fail while preserving a valid one-row control | disconfirmer: run each option against old code and find one already rejected at the parser with the required diagnostic.

## Verification

- confirmed — before repair, the seven-case malformed table failed on the first option because old code reached domain normalization instead of the required parser diagnostic; after repair, all six option-like cases plus the whitespace output case fail before side effects, while the valid process control still writes one row.

## Root Cause

The preparer's parser equates token presence with semantic validity and advances past the consumed token.
Downstream domain normalization and filesystem checks occur too late to preserve the command's required-value failure order or prevent output mutation.

## Invariant Proof

- Invariant: malformed preparer option values are rejected before input reads, domain normalization, or output writes.
- Producer Proof: real-process probes cover all six value-taking options with option-like tokens plus the output path's whitespace-only seam; the malformed input filename is pre-seeded with valid JSON to distinguish parser rejection from a missing-file error.
- Final-Consumer Proof: each malformed invocation must exit nonzero, identify the option, and leave the watched cwd unchanged; a valid control must still write a one-row packet.
- Interface-Shape Sibling Scan: all six options share the owning helper; the adjacent builder is already fixed and provides the expected boundary shape.
- Non-Claims: this does not add `--option=value`, a positional `--` escape, or raw leading-dash values.

## Detection Gap

- `scripts/agent-runtime/deployment-evidence.test.mjs` | pure transformations and only the adjacent builder process were covered | add real-process valid/malformed controls for the independently executable preparer.
- `scripts/coverage-floor.json` | the new process tests make the wrapper visible at 80.20% | leave it in the policy-owned 80–95% advisory band until the baseline is stable rather than locking a floor from one broad sample.

## Sibling Search

- Mental model: a present token following a value option is necessarily data.
- same layer axis: all six preparer value options | decision: same bug, fix now | proof: one shared parser owns every value.
- abstraction up axis: independently executable Node JSON writers | decision: same class, diagnostic-only for this slice | proof: no action needed beyond the reproduced preparer because static syntax alone does not prove a reachable mutation.
- specialization down axis: input read and output parent/file creation | decision: same bug, fix now | proof: the output write is reproduced; seeded malformed input will distinguish the read branch.
- mental-model axis: leading-dash identifiers or paths | decision: intentional plain-text or non-rendering boundary | proof: no direct-token escape is documented and paths can use `./` or absolute spelling.
- cross-file: `scripts/agent-runtime/build-deployment-evidence.mjs` is the resolved sibling and `scripts/agent-runtime/output-files.mjs` owns the shared downstream write.

## Seam Risk

- Interrupt ID: prepare-deployment-evidence-input-malformed-value-mutation
- Risk Class: none
- Seam: CLI argument parsing to domain normalization and filesystem operations
- Disproving Observation: the seven-case malformed process table passes with unchanged watched state and the valid control still writes the expected packet.
- What Local Reasoning Cannot Prove: unreproduced copied parsers outside the deployment-evidence command pair.
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Reject semantic emptiness and option tokens at the owning parser, cover every value option at the real process boundary, and monitor the new 80.20% warn-band coverage before deciding whether it is stable enough to floor.
