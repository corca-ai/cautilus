# Debug Review
Date: 2026-07-08

## Problem

During the SkillOpt runtime absorption quality pass, I ran `./scripts/run-quality.sh --read-only` and got `zsh:1: no such file or directory: ./scripts/run-quality.sh`.
This needed classification before treating quality proof as complete.

## Correct Behavior

Given the quality planner emits a conditional gate packet, when the repo does not expose that exact command, the operator should use the repo's equivalent standing gates and record the missing conditional command as not applicable rather than as a product regression.

## Observed Facts

- `plan_quality_run.py --repo-root . --json` listed `./scripts/run-quality.sh --read-only` with `run_when: repo exposes this repo-native command or an equivalent standing quality gate`.
- `./scripts/run-quality.sh --read-only` exited 127 because the file does not exist.
- `rg -n "run-quality|quality.*read-only|read-only" scripts package.json .agents/quality-adapter.yaml` found no `run-quality.sh` script.
- The quality adapter's standing gates are `npm run verify` and `npm run dogfood:self`, and this slice already ran `npm run verify`.
- `npm run verify` and `npm run hooks:check` passed after the runtime absorption changes and claim refresh.

## Reproduction

- From repo root, run `./scripts/run-quality.sh --read-only`.
- Observed result: shell exits 127 with `no such file or directory`.

## Candidate Causes

- The repo used to have `scripts/run-quality.sh` and accidentally deleted it.
- The quality adapter is stale and should name a repo-owned quality command that no longer exists.
- The planner emits a portable conditional packet, and I executed it without first checking whether the repo exposes the named command.

## Hypothesis

- Falsifiable claim: this is an operator misuse of a conditional planner packet, not a missing required repo gate.
- Disconfirmer: if `.agents/quality-adapter.yaml`, `package.json`, or docs declare `scripts/run-quality.sh` as a required Cautilus gate, then the repo is missing a required command.

## Verification

- Result: confirmed.
- The planner text itself scopes the command to repos that expose it or an equivalent standing quality gate.
- The Cautilus repo exposes and passed the equivalent standing gate `npm run verify`.
- No checked-in command reference found that makes `scripts/run-quality.sh` a required Cautilus command.

## Root Cause

The root cause was applying a conditional portable quality gate as if it were unconditionally repo-owned.
The repo did not regress; the applicable standing quality proof for this slice is `npm run verify` plus the focused CLI/schema tests and `npm run hooks:check`.

## Invariant Proof

- Invariant: conditional planner gate packets must be checked against the resolved repo adapter before execution is treated as required proof.
- Producer Proof: `plan_quality_run.py` marks the read-only quality command with a `run_when` condition.
- Final-Consumer Proof: `npm run verify` and `npm run hooks:check` passed as the actual Cautilus standing gates.
- Interface-Shape Sibling Scan: quality gate packets that name optional repo commands need applicability judgment before execution.
- Non-Claims: this does not prove `npm run dogfood:self`; that broader dogfood gate was not required for this local runtime absorption slice.

## Detection Gap

- surface: operator quality workflow | what did not fire: no automatic guard prevented me from executing an inapplicable conditional gate | smallest change to fire it: not worth adding; the planner already labels `run_when`, and the correct response is operator judgment.

## Sibling Search

- Mental model: every gate packet command is mandatory.
- gate-applicability axis: `run_when` field | decision: read and apply the condition before running | proof: planner JSON includes the condition.
- standing-gate axis: repo-owned equivalent gate | decision: use `npm run verify` for this slice | proof: verify passed.
- cross-file: `.agents/quality-adapter.yaml` and `package.json` define actual Cautilus gates, not `scripts/run-quality.sh`.

## Seam Risk

- Interrupt ID: quality-conditional-gate-misread-2026-07-08
- Risk Class: none
- Seam: quality planner packet to repo-specific gate execution
- Disproving Observation: planner explicitly labels the command conditional and the repo equivalent gate passed
- What Local Reasoning Cannot Prove: n/a
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

For this goal closeout, record `./scripts/run-quality.sh --read-only` as not applicable because the repo does not expose it.
Use the passing `npm run verify`, focused tests, CLI discovery probes, and `npm run hooks:check` as the quality evidence.
