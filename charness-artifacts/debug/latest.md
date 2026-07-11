# Debug Review
Date: 2026-07-11

## Problem

Quality closeout failed with `python3: can't open file '.../skills/quality/scripts/validate_quality_artifact.py': [Errno 2] No such file or directory`.

## Correct Behavior

Given a scaffolded quality artifact, when closeout validation starts, then the runner must execute the scaffold payload's emitted `validator_command` and validate the current artifact.

## Observed Facts

- The attempted path under `skills/quality/scripts/` does not exist.
- `/tmp/cautilus-quality-scaffold.json` emits `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.66.1/scripts/validate_quality_artifact.py --repo-root .`.
- The emitted validator exists under the installed package's top-level `scripts/` directory.
- Web search was skipped because the failure is a local installed-layout path mismatch and the scaffold packet is the authoritative disconfirmer.

## Reproduction

- Running the guessed skill-local validator path reproduces `[Errno 2]`; inspecting the already-emitted scaffold payload returns the existing top-level validator path.

## Candidate Causes

- The installed package omitted the validator during packaging.
- The installed 0.66.1 layout moved the validator from the skill directory to the package-level scripts directory.
- The caller ignored the scaffold payload and guessed a skill-local validator path.

## Hypothesis

- The failure is caller path guessing, not missing packaging; if true, the scaffold-emitted command points at an existing file and validates the artifact.
  Disconfirmer: read `.validator_command` from the scaffold JSON and locate matching files with `rg --files`.

## Verification

- confirmed — the emitted command points at `/home/hwidong/.codex/plugins/cache/local/charness/0.66.1/scripts/validate_quality_artifact.py`, which exists; no validator exists at the guessed skill-local path.

## Root Cause

The caller violated the skill contract by constructing a validator path from the skill directory instead of using the scaffold helper's emitted `validator_command`.

## Invariant Proof

- Invariant: artifact producers emit the canonical installed-layout validator command and consumers execute that command without path reconstruction.
- Producer Proof: `/tmp/cautilus-quality-scaffold.json` contains the existing top-level validator path.
- Final-Consumer Proof: the emitted validator command is run during this closeout and its result is recorded in the goal.
- Interface-Shape Sibling Scan: debug scaffolding follows the same emitted-command contract and also resolves its validator under package-level `scripts/`.
- Non-Claims: this does not prove every installed skill package has complete validator packaging.

## Detection Gap

- quality closeout invocation | the scaffold payload was partially displayed without its validator command, so manual path reconstruction bypassed the contract | always include and execute `.validator_command` from scaffold output.

## Sibling Search

- Mental model: a skill's helper scripts and its artifact validator share one directory.
- cross-skill axis: debug scaffold | decision: use emitted package-level validator command | proof: `/tmp/cautilus-debug-scaffold.json`.
- installed-layout axis: quality scaffold | decision: use emitted package-level validator command | proof: `/tmp/cautilus-quality-scaffold.json` plus `rg --files`.
- cross-file: `skills/debug/references/adapter-contract.md` explicitly says not to assume a consumer-local or skill-local validator path.

## Seam Risk

- Interrupt ID: quality-validator-path-guess
- Risk Class: none
- Seam: local installed skill layout
- Disproving Observation: scaffold output resolved an existing validator.
- What Local Reasoning Cannot Prove: whether other package versions preserve the same physical location; callers do not need that fact when they consume the emitted command.
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Consume scaffold payloads as contracts: surface `validator_command` in the first scaffold read and execute it verbatim instead of deriving paths from package structure.
