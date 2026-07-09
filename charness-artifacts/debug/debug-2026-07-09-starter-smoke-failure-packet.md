# Debug Review
Date: 2026-07-09

## Problem

`npm run consumer:starters:smoke` emitted structured JSON on success but fell back to unstructured stderr when the configured Cautilus binary could not spawn.
The reproduced failure was `/tmp/cautilus-missing-bin doctor adapter --repo-root /home/hwidong/codes/cautilus/examples/starters/chatbot failed with exit 1`.

## Correct Behavior

Given the starter smoke is an operator-facing proof helper, when a starter command fails, then the helper should still emit `cautilus.starter_kit_smoke.v1` JSON with `ok:false`, the failing starter, phase, sanitized command, exit code, spawn error, and short stdout/stderr excerpts.
The failure packet must not leak repo absolute paths for repo-owned evidence.

## Observed Facts

- Reproduction: `node scripts/on-demand/smoke-starter-kits.mjs --cautilus-bin /tmp/cautilus-missing-bin ; true`.
- The script wrote one stderr line and no JSON packet.
- `runCommand` discarded `spawnSync().error`.
- `assertCommandOk` built diagnostics from raw command and args.
- The success path had already been normalized to repo-relative command evidence.

## Reproduction

- `node scripts/on-demand/smoke-starter-kits.mjs --cautilus-bin /tmp/cautilus-missing-bin ; true`
- Focused test: `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/on-demand/smoke-starter-kits.test.mjs scripts/starter-kit-parity.test.mjs`

## Candidate Causes

- The helper optimized for the all-green proof path and left command failures as thrown exceptions.
- `spawnSync().error` was treated as irrelevant because ordinary command failures already carry stderr.
- The earlier path-hygiene patch normalized only successful command summaries, not thrown diagnostics.

## Hypothesis

- Falsifiable claim: wrapping per-starter command failures into the same output schema and summarizing failed commands through the repo-relative helper will make missing-binary runs emit structured JSON without absolute repo paths.
- Disconfirmer: the missing-binary focused test still sees raw repo paths, no `spawnError`, or no `ok:false` packet.

## Verification

- Result: confirmed.
- Added failure packet construction with phase, sanitized command, spawnError, stdoutExcerpt, and stderrExcerpt.
- Added a missing-binary test that asserts all starter failures remain repo-relative and structured.
- Focused starter smoke tests passed.

## Root Cause

The smoke helper's proof output contract was only applied after successful command execution.
Failures escaped through `Error.message`, so the final consumer saw unstructured text, lost the spawn error, and received raw filesystem paths.

## Invariant Proof

- Invariant: starter smoke success and failure paths both emit agent-readable `cautilus.starter_kit_smoke.v1` packets.
- Producer Proof: `assertCommandOk` now builds failures through `buildFailurePacket` and `summarizeCommandForOutput`.
- Final-Consumer Proof: the missing-binary test and manual reproduction emit `ok:false` JSON with repo-relative evidence.
- Interface-Shape Sibling Scan: success command summaries still omit stdout/stderr and remain unchanged.
- Non-Claims: external binary paths outside the repo may remain absolute when intentionally supplied.

## Detection Gap

- starter smoke test | only covered success output | smallest change to fire it: add a missing-binary negative test.
- fresh-eye critique | caught the gap before commit | smallest change to keep it useful: keep bounded review on task-completing proof-helper slices.

## Sibling Search

- Mental model: proof helpers were treated as success-only evidence emitters.
- same-file axis: command failure diagnostics | decision: fixed now | proof: missing-binary test passed.
- same-file axis: parse failures | decision: still structured under phase `parse` | proof: generic catch builds a failure packet.
- cross-file: fresh-consumer onboarding smoke | decision: not changed in this slice | proof: it already preserves operator-witnessed capture and this defect was isolated to starter smoke.

## Seam Risk

- Interrupt ID: starter-smoke-failure-packet-2026-07-09
- Risk Class: none
- Seam: none
- Disproving Observation: none
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: none

## Interrupt Decision

- Resolution: resolved
- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When a proof helper emits structured success evidence, add at least one negative test that proves failures keep the same packet schema and path-hygiene boundary.
