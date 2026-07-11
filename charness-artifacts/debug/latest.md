# Debug Review: deployment semantic errors leak stacks
Date: 2026-07-11

## Problem

Deployment-evidence CLIs sanitize JSON syntax errors but allow contract-validation and output-write exceptions to escape the top-level module, printing stack frames and internal absolute paths.

## Correct Behavior

Given any expected CLI failure after argument parsing, each deployment-evidence executable must exit non-zero and emit exactly one path-bearing or contract-bearing error line without Node stack frames.

## Observed Facts

- Both executables catch JSON parsing only and invoke semantic builders outside a top-level error boundary.
- `buildDeploymentEvidence` rejects a wrong schema version with an `Error`.
- `prepareDeploymentEvidenceInput` rejects a source packet whose schema does not match `sourceKind`.
- Existing subprocess tests assert one-line syntax-error diagnostics but do not sample valid JSON with invalid contracts.

## Reproduction

- Run the builder with `{"schemaVersion":"wrong","rows":[]}` and the preparer with a syntactically valid packet incompatible with the declared source kind.
- Independent real-process reproduction confirmed both commands exited 1 with source excerpts, Node version text, five stack frames, and internal absolute paths.

## Candidate Causes

- JSON syntax was considered the only untrusted boundary requiring sanitation.
- Semantic builders were assumed to return validation packets rather than throw.
- The executable main guards rely on Node's default uncaught-exception rendering.
- Output helpers were expected to fail only in developer environments where stacks were considered useful.

## Hypothesis

- Falsifiable claim: missing top-level main error boundaries are the sole leak; real-process semantic-invalid fixtures reproduce stacks now, while wrapping the full main body and printing `error.message` will yield one line without changing valid stdout/output behavior | disconfirmer: a lower helper already converts these exceptions before they reach the module guard.

## Verification

- confirmed — semantic-invalid fixtures failed the new one-line assertions against old code.
- the first delegated review found that an output path containing CR/LF could split a caught filesystem error across physical lines.
- after sanitizing final error rendering, both executable suites pass ten real-process cases and eslint passes all four changed files.

## Root Cause

The executables sanitized only parse-time failures and left semantic builders and output writers outside any final error boundary.
Node therefore owned the final-consumer rendering for every downstream exception and emitted development stacks instead of the CLI's established one-line diagnostic contract.

## Invariant Proof

- Invariant: when a deployment semantic builder or output writer rejects input, the executable final consumer must emit one sanitized message and exit non-zero before Node renders an uncaught stack.
- Producer Proof: valid JSON with an invalid deployment schema and an incompatible scenario-results source deterministically throws from each semantic builder.
- Final-Consumer Proof: real subprocesses now emit exactly one physical line for semantic and newline-bearing write failures, omit `file://`, stack frames, and Node version text, create no output, and retain valid/syntax-invalid behavior.
- Interface-Shape Sibling Scan: builder and preparer share read/build/write executable structure and existing syntax-error sanitation.
- Non-Claims: no library error-type redesign, structured stderr schema, or suppression of successful packet output.

## Detection Gap

- deployment CLI process tests | syntax-invalid input was covered but semantic-invalid input was absent | add one real-process contract failure per executable and assert single-line stderr without stack frames.

## Sibling Search

- Mental model: catching the first parse boundary sanitizes every downstream CLI failure.
- same layer axis: both deployment executables | decision: same bug, fix now | proof: static main-guard comparison.
- abstraction up axis: semantic builder and output writer failures | decision: same bug, fix now | proof: both execute outside catch boundaries.
- specialization down axis: contract mismatch versus newline-bearing unwritable output | decision: same bug, fix now | proof: real directory-as-output fixtures cover both executables and assert one physical stderr line.
- mental-model axis: library stack usefulness versus CLI diagnostic hygiene | decision: intentional plain-text or non-rendering boundary | proof: library calls continue throwing rich errors while executables sanitize only at the final consumer.
- cross-file: `scripts/agent-runtime/build-deployment-evidence.mjs` and `scripts/agent-runtime/prepare-deployment-evidence-input.mjs` share the executable interface shape.

## Seam Risk

- Interrupt ID: deployment-semantic-error-stack-leak
- Risk Class: none
- Seam: semantic library exception to operator-facing CLI stderr
- Disproving Observation: both maintained executables produce single-line stderr for semantic failures and all existing process cases remain green.
- What Local Reasoning Cannot Prove: host-specific terminal redaction beyond the emitted stderr bytes.
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Extend the existing process-level sanitation invariant from JSON syntax to the full executable main body for both maintained deployment commands.
Keep rich library errors intact, collapse CR/LF only at executable final consumers, and pin semantic plus path-controlled write errors with real subprocesses.
