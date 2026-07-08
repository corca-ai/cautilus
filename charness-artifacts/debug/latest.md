# Debug Review
Date: 2026-07-08

## Problem

`./scripts/run-quality.sh --read-only` returned `zsh:1: no such file or directory: ./scripts/run-quality.sh` during closeout quality planning.

## Correct Behavior

Given the quality planner emits a gate packet, when the command is not present in this repo, then the run should classify the packet as unavailable and fall back to the repo-owned canonical gates rather than inventing a replacement.
The closeout should keep `npm run verify`, `npm run hooks:check`, and claim freshness checks as the authoritative local evidence for this documentation-design slice.

## Observed Facts

The attempted command failed exactly as:

```text
zsh:1: no such file or directory: ./scripts/run-quality.sh
```

`test -e scripts/run-quality.sh` returned exit code 1.
`rg --files scripts | rg 'quality|verify|hooks'` found `scripts/coverage-floor-quality-gate.sh`, `scripts/run-verify.mjs`, and hook scripts, but no `scripts/run-quality.sh`.
`package.json` exposes the standing `verify` and coverage-floor gates instead.

## Reproduction

Run:

```bash
./scripts/run-quality.sh --read-only
```

The shell returns exit 127 because the file is absent.

## Candidate Causes

- The portable quality planner includes a generic read-only quality command that this repo does not implement.
- The repo intentionally centralizes the broad gate in `npm run verify` and hook readiness in `npm run hooks:check`.
- The adapter's `gate_script_pattern: "*-quality-gate.sh"` covers focused quality-gate scripts such as coverage floor, not a monolithic `run-quality.sh`.

## Hypothesis

If `scripts/run-quality.sh` is absent and the repo's package scripts name `verify` as the canonical broad gate, then the correct closeout action is to record the quality packet as unavailable and cite the successfully run repo-owned gates.
Disconfirmer: `test -e scripts/run-quality.sh` returning 0, or `rg --files scripts | rg '^scripts/run-quality\\.sh$'` finding the command, would refute the missing-command hypothesis.

## Verification

Confirmed.
The file does not exist, and repo search found the actual quality-related gate surfaces under `scripts/run-verify.mjs`, `scripts/coverage-floor-quality-gate.sh`, and `package.json`.
No product code change is required for the SkillOpt absorption documentation goal.

## Root Cause

The portable quality skill planner advertised a generic gate packet that is not implemented by this repo.
This is an unavailable optional quality packet for this closeout, not a failure of the Cautilus product surface being changed.

## Invariant Proof

- Invariant: closeout quality evidence must come from commands that exist in the repo or from an explicit unavailable-gate note.
- Producer Proof: `test -e scripts/run-quality.sh` returned exit code 1.
- Final-Consumer Proof: `npm run verify` and `npm run hooks:check` are recorded as the actual broad closeout gates in the goal artifact.
- Interface-Shape Sibling Scan: the existing `coverage-floor-quality-gate.sh` is focused coverage policy, not a substitute for a missing monolithic read-only quality runner.
- Non-Claims: this does not fix or change the portable quality planner's generic packet list.

## Detection Gap

- quality planner packet | command availability was discovered only when the command was executed | smallest change to fire it: record unavailable packet in closeout and rely on repo-owned gates
- repo scripts | no monolithic `run-quality.sh` exists | smallest change to fire it: no change in this goal because the standing command is `npm run verify`

## Sibling Search

- Mental model: every quality planner packet command is implemented by the consumer repo.
- same-surface: `scripts/run-quality.sh` is absent | decision: classify packet unavailable for this closeout | proof: `test -e` exit code 1 and script inventory
- cross-file: `package.json` already owns `verify` | decision: use existing standing gate | proof: prior `npm run verify` passed

## Seam Risk

- Interrupt ID: quality-planner-missing-run-quality
- Risk Class: none
- Seam: portable quality planner to repo-owned gate inventory
- Disproving Observation: advertised command is absent from repo scripts
- What Local Reasoning Cannot Prove: whether other repos using this planner expect `run-quality.sh`
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: no
- Next Step: achieve-closeout
- Handoff Artifact: none

## Prevention

Closeout should cite unavailable optional quality packets explicitly instead of implying they ran.
For this repo, keep `npm run verify`, `npm run hooks:check`, and claim freshness checks as the maintained broad closeout evidence unless a future slice adds a real read-only quality runner.

## Related Prior Incidents

- none directly related
