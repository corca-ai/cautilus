# Debug Review
Date: 2026-07-08

## Problem

The mixed-commit `git cat-file --batch` optimization regressed `claims:audit-evidence` from about 1.0s back to about 4.1s.
The audit summary reported `checkedInEvidenceBatchCount: 0` and `checkedInEvidenceFallbackLookupCount: 521`.

## Correct Behavior

Given checked-in evidence lookups are batchable across commits, when active mode resolves 521 unique `repoCommit:path` lookups, then it should use one successful batch process and avoid per-lookup fallback except for unsafe newline-delimited specs.

## Observed Facts

- `/usr/bin/time -p npm run --silent claims:audit-evidence` exited 0 but reported 521 fallback lookups and took about 4.13s.
- `/usr/bin/time -p npm run --silent claims:audit-evidence:full` exited 0 but reported 816 fallback lookups and took about 6.20s.
- A direct reproduction with the active spec set showed `spawnSync git ENOBUFS` with about 1,053,163 stdout bytes captured before failure.
- The same active spec set succeeded with `maxBuffer: 64 * 1024 * 1024` and produced about 21.5MB of output.
- The full spec set succeeded with `maxBuffer: 128 * 1024 * 1024` and produced about 31.3MB of output.

## Reproduction

- Build the active audit spec set from current-state evidence refs, then call `execFileSync("git", ["cat-file", "--batch"], { input })` with Node's default `maxBuffer`.
- Observed result: the call throws `ENOBUFS`, the audit catches it, falls back to per-lookup `git show`, and loses the intended speedup.

## Candidate Causes

- The global batch output exceeded Node's default `execFileSync` stdout buffer.
- The mixed-commit batch parser misread one header and threw.
- A malformed path or commit injected an extra batch line and poisoned the whole batch.

## Hypothesis

- Falsifiable claim: the regression is default `execFileSync` buffer exhaustion, not mixed-commit batch semantics.
- Disconfirmer: if adding an explicit batch `maxBuffer` still reports `checkedInEvidenceBatchCount: 0` or nonzero fallback count on the current repo, then parser or spec-shape handling is the real cause.

## Verification

- Result: confirmed.
- `npx eslint scripts/agent-runtime/audit-claim-evidence-hashes.mjs scripts/agent-runtime/audit-claim-evidence-hashes.test.mjs` passed.
- `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/agent-runtime/audit-claim-evidence-hashes.test.mjs` passed with mixed-commit batching and newline fallback tests.
- `/usr/bin/time -p npm run --silent claims:audit-evidence` reported one batch, zero fallbacks, and about 0.38s wall time.
- `/usr/bin/time -p npm run --silent claims:audit-evidence:full` reported one batch, zero fallbacks, and about 0.42s wall time.

## Root Cause

The root cause was moving from many smaller per-commit batch outputs to one global batch output without raising Node's synchronous child-process `maxBuffer`.
The batch itself was valid, but the parent process killed the read with `ENOBUFS`, and the safe fallback path made the command correct but slow.

## Invariant Proof

- Invariant: batch optimizations over repository blobs must size the child-process buffer to the expected output envelope or stream the output.
- Producer Proof: the direct active/full reproductions measured 21.5MB and 31.3MB batch outputs, above Node's default buffer.
- Final-Consumer Proof: focused tests and timed active/full audit commands passed after adding the explicit batch buffer.
- Interface-Shape Sibling Scan: newline-delimited commit/path specs remain excluded from batch input and are handled by `git show` fallback.
- Non-Claims: this note does not claim the local runtime budget should be tightened; recent medians still include older samples.

## Detection Gap

- surface: batch lookup runtime proof | what did not fire: focused tests used tiny fixtures whose batch output never exceeded the default buffer | smallest change to fire it: assert real command summary counts in timed active/full audit and keep newline fallback unit tests.

## Sibling Search

- Mental model: fewer batch processes is automatically faster when the input is valid.
- same-file axis: `batchGitObjectHashes` child-process call | decision: same bug, fix now | proof: default-buffer direct reproduction threw `ENOBUFS`.
- same-file axis: newline path and newline commit specs | decision: same class, diagnostic-only for this slice | proof: existing and added tests keep unsafe specs out of batch input.
- cross-file: `scripts/run-verify.mjs` runtime-signal path | decision: same class, diagnostic-only for this slice | proof: runtime signals caught the phase regression once the standing command was run.

## Seam Risk

- Interrupt ID: claim-evidence-global-batch-maxbuffer-2026-07-08
- Risk Class: none
- Seam: Git batch output to Node synchronous child-process buffer
- Disproving Observation: mixed-spec `git cat-file --batch` succeeds with a larger buffer.
- What Local Reasoning Cannot Prove: future repository growth may exceed the chosen buffer; runtime summary remains the detection surface.
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When replacing many small child-process calls with one broad child-process call, measure stdout size under current fixtures and set an explicit buffer or stream the output before claiming a speed win.
