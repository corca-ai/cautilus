# Debug Review: deployment-evidence invalid JSON stack traces
Date: 2026-07-11

## Problem

Both independently executable deployment-evidence wrappers expose raw JavaScript `SyntaxError` stack traces when an existing input file is not valid JSON.
The output is implementation-heavy, omits a stable path-bearing CLI diagnostic prefix, and leaks internal frames to operators and agents.

## Correct Behavior

Given an existing but malformed JSON input, each wrapper must exit nonzero with one concise input-path-bearing diagnostic, omit stack frames, and leave the requested output absent.

## Observed Facts

- Running either wrapper against existing empty `/dev/null` exits 1 and emits `SyntaxError: Unexpected end of JSON input` plus `JSON.parse`, wrapper, module-loader, and async entrypoint frames.
- Neither failed invocation wrote its requested output file.
- Both wrappers call `JSON.parse(readFileSync(...))` directly in their local `readJson` helper.
- Missing files already route through the wrappers' concise `fail` function, so malformed existing files are the inconsistent branch.
- Valid and malformed argv behavior is process-tested in executable-owned test files after the preceding test-layout slice.
- Fresh-eye review showed Node parse messages can echo malformed input fragments and embedded newlines, so forwarding `error.message` would turn a stack-trace cleanup into a content-disclosure regression.

## Reproduction

- Run `build-deployment-evidence.mjs --input /dev/null --output <temp>/build.json`.
- Run `prepare-deployment-evidence-input.mjs` with valid domain options, `--input /dev/null`, and `--output <temp>/prepare.json`.
- Observe exit 1, raw stack traces, and no output packets.

## Candidate Causes

- The wrappers assumed checked-in or generated inputs were always syntactically valid.
- Raw `JSON.parse` errors were considered sufficient CLI diagnostics.
- A global uncaught-exception handler was expected to normalize direct helper failures.
- Domain validators were expected to own syntax errors even though parsing precedes them.

## Hypothesis

- Falsifiable claim: the only diagnostic gap is unhandled `JSON.parse` in each local `readJson`; catching parse errors there and routing them through `fail` will produce one concise path-bearing line without changing missing-file, valid-input, or domain-validation behavior | disconfirmer: add real-process malformed-file tests and observe another uncaught frame after the local catch.

## Verification

- confirmed — both old-code commands reproduced the same raw stack-trace boundary; after repair, both executable-owned sentinel/newline tests emit exactly one path-bearing line without the sentinel, `SyntaxError`, or stack frames and leave outputs absent, while their valid and malformed-argv controls still pass.

## Root Cause

The CLI boundary distinguishes missing files but does not translate JSON syntax failures into its operator-facing error contract.
Because `JSON.parse` throws before packet construction, Node's default uncaught-exception renderer becomes the accidental diagnostic surface.

## Invariant Proof

- Invariant: existing malformed JSON input fails through the wrapper's concise path-bearing diagnostic before packet construction or output writing.
- Producer Proof: real-process malformed-file probes for both wrappers use a sentinel plus embedded newline that Node's raw parser message can echo.
- Final-Consumer Proof: each command exits nonzero, names the resolved input path, emits no stack frame, and leaves the requested output absent.
- Interface-Shape Sibling Scan: both deployment-evidence wrappers share the direct `JSON.parse` boundary; broader JSON consumers require independent operator-contract evidence.
- Non-Claims: this does not normalize schema/domain errors, introduce a shared JSON CLI framework, or diagnose every direct Node JSON reader.

## Detection Gap

- executable-owned CLI tests | valid, malformed argv, and side-effect ordering were covered, but existing malformed JSON was not sampled | add one real-process syntax-failure control per wrapper.

## Sibling Search

- Mental model: an existing input file is parseable because it came from a trusted workflow.
- same layer axis: builder and preparer local `readJson` helpers | decision: same bug, fix now | proof: both reproduce identical raw stack traces.
- abstraction up axis: direct Node JSON consumers | decision: same class, diagnostic-only for this slice | proof: no action needed because CLI error ownership and output side effects differ and are not established by syntax search.
- specialization down axis: syntax failure before packet construction/output | decision: same bug, fix now | proof: both outputs remain absent in the reproduction.
- mental-model axis: raw exception text as operator guidance | decision: same bug, fix now | proof: omit parser reason text because it can echo malformed input content; retain only the resolved path.
- cross-file: `scripts/agent-runtime/build-deployment-evidence.mjs` and `scripts/agent-runtime/prepare-deployment-evidence-input.mjs` are the two reproduced producers; their executable-owned tests are the final consumers.

## Seam Risk

- Interrupt ID: deployment-evidence-invalid-json-stack-traces
- Risk Class: none
- Seam: filesystem input read to CLI error rendering
- Disproving Observation: both malformed-file process tests pass with single-line path-bearing stderr and absent outputs.
- What Local Reasoning Cannot Prove: error contracts of unrelated direct JSON consumers.
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Translate syntax failures at each owning CLI read boundary and pin the user-visible diagnostic and no-output invariant with real-process tests.
