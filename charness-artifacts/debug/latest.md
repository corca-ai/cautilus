# Debug Review
Date: 2026-07-08

## Problem

`node --check scripts/agent-runtime/audit-claim-evidence-hashes.mjs` failed after adding batch checked-in evidence lookup helpers.
The exact error was `SyntaxError: Unexpected token '}'` at line 401.

## Correct Behavior

Given the claim evidence audit batches checked-in evidence lookups, when helper code is inserted, then the file should remain syntactically valid before behavior tests or timing comparisons continue.

## Observed Facts

- `node --check scripts/agent-runtime/audit-claim-evidence-hashes.mjs` exited 1.
- The parser pointed at an unexpected closing brace near line 401.
- Reading lines 369-404 showed a complete new `auditCheckedInEvidence` implementation followed by a leftover tail from the previous loop body.
- The batch lookup design itself had not yet reached behavior verification.

## Reproduction

- Run `node --check scripts/agent-runtime/audit-claim-evidence-hashes.mjs` after the initial batch lookup patch.
- Observed result: syntax check fails before any runtime behavior can execute.

## Candidate Causes

- A manual patch left stale loop-body lines after replacing `auditCheckedInEvidence`.
- The new helper functions have an unbalanced brace.
- `Map.groupBy` or newer syntax is unsupported by the local Node runtime and caused a parse error.

## Hypothesis

- Falsifiable claim: the failure is a stale duplicated block after `auditCheckedInEvidence`, not unsupported syntax or a malformed helper.
- Disconfirmer: if removing the leftover lines does not make `node --check` pass, inspect helper brace balance and runtime syntax support next.

## Verification

- Result: confirmed.
- `node --check scripts/agent-runtime/audit-claim-evidence-hashes.mjs` passed after removing the stale block.
- `npx eslint scripts/agent-runtime/audit-claim-evidence-hashes.mjs scripts/agent-runtime/audit-claim-evidence-hashes.test.mjs scripts/github-actions.test.mjs` passed.
- `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/agent-runtime/audit-claim-evidence-hashes.test.mjs scripts/github-actions.test.mjs` passed.

## Root Cause

The root cause was an incomplete manual replacement of `auditCheckedInEvidence`.
The new implementation was inserted, but the old inner `if (issue)` block and return tail remained after the function, creating extra closing braces.

## Invariant Proof

- Invariant: structural rewrites of loop-owning functions should run `node --check` before behavior testing and timing claims.
- Producer Proof: `node --check` identified the syntax break before tests ran.
- Final-Consumer Proof: focused audit behavior tests and eslint passed after removing the stale block.
- Interface-Shape Sibling Scan: the stale block sat immediately after the rewritten function, not in a separate workflow boundary.
- Non-Claims: this debug note does not claim the batch lookup optimization is behavior-preserving or faster yet.

## Detection Gap

- surface: manual patch integrity | what did not fire: no edit-time structural check before reading the file | smallest change to fire it: run `node --check` immediately after replacing a function body with nested braces.

## Sibling Search

- Mental model: apply_patch replacement around a function body will remove all obsolete loop tail code.
- same-file axis: `auditCheckedInEvidence` replacement tail | decision: same bug, fix now | proof: `nl -ba` showed duplicate stale block lines after the new function.
- cross-file: parser complexity debug records in `scripts/run-verify.mjs` and `scripts/agent-runtime/scenario-proposals.mjs` | decision: same class, diagnostic-only for this slice | proof: prior records show JavaScript control-flow edits should be checked before broad gates.

## Seam Risk

- Interrupt ID: claim-evidence-batch-lookup-syntax-tail-2026-07-08
- Risk Class: none
- Seam: manual JavaScript function rewrite to syntax gate
- Disproving Observation: syntax check failed deterministically before runtime behavior was claimed.
- What Local Reasoning Cannot Prove: n/a
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

After replacing a JavaScript function that owns nested loops, run `node --check` before continuing with behavior or performance claims.
