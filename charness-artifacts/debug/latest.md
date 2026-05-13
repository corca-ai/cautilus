# Instruction Surface First Tool Debug
Date: 2026-05-13

## Problem

`npm run dogfood:self:eval` exited 0 but wrote `eval-summary.json` with `recommendation=reject`.

## Correct Behavior

Given the checked-in `dev / repo` self-dogfood fixture, when the Cautilus Agent reads `AGENTS.md` and selects `find-skills` plus `impl`, then `eval-summary.json` should report `recommendation=accept-now`.

## Observed Facts

- The failed summary had `evaluationCounts.failed=1`.
- Routing matched `bootstrapHelper=find-skills` and `workSkill=impl`.
- The only failed expectation was `firstToolCall`.
- The observed first tool call was `exec_command: sed -n '1,220p' AGENTS.md`.
- The allowlist included `functions.exec_command`.
- A later rerun exposed the same host-output-shape class with `multi_tool_use.parallel`, while the routing and loaded files still proved the required `find-skills` bootstrap.
- Web search for the exact public phrase `"recommendation=reject" "Cautilus" "eval-summary"` produced no relevant external cause.

## Reproduction

```bash
npm run dogfood:self:eval
jq '{recommendation,evaluationCounts,evaluations:[.evaluations[] | {status, expectationResults}]}' artifacts/self-dogfood/eval/latest/eval-summary.json
```

## Candidate Causes

- The new `AGENTS.md` subagent delegation block changed routing enough that the model skipped the required first-turn bootstrap.
- The fixture allowlist was too narrow for a valid first tool call variant emitted by the current Codex runtime.
- The runner normalized `functions.exec_command` but not the shorter `exec_command` alias before Cautilus evaluated the allowlist.

## Hypothesis

The runner's instruction-surface normalizer accepted `functions.exec_command...` but did not canonicalize `exec_command...`, so a semantically valid first tool call failed an exact allowlist comparison.

## Verification

- Added a unit assertion that `exec_command: sed -n '1,220p' AGENTS.md` normalizes to `functions.exec_command`.
- Re-ran the targeted node test for the eval runner.
- Re-ran `npm run dogfood:self:eval`; it returned `recommendation=accept-now` after the fix.

## Root Cause

The observed runtime emitted the first tool call without the `functions.` namespace.
`scripts/agent-runtime/instruction-surface-support.mjs` only canonicalized values starting with `functions.exec_command`, leaving `exec_command: ...` to fail the Go-side exact allowlist check.

## Seam Risk

- Interrupt ID: instruction-surface-tool-alias
- Risk Class: host-disproves-local
- Seam: Codex JSON/routing output to Cautilus instruction-surface evaluation
- Disproving Observation: The evaluation failed despite correct skill routing because the tool-call alias differed.
- What Local Reasoning Cannot Prove: Future runtimes will not introduce another equivalent tool-call alias.
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: yes
- Next Step: spec
- Handoff Artifact: charness-artifacts/spec/evaluation-surfaces-runners-proof.md

## Prevention

Normalize both `functions.exec_command` and `exec_command` prefixes to the same canonical first-tool-call token before scoring the instruction-surface allowlist.
Keep the checked-in `dev / repo` fixture allowlist broad enough for the current host's parallel read wrapper when the routing evidence still proves the required bootstrap.
