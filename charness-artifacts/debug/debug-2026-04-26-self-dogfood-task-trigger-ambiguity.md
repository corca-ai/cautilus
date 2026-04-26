# Debug Review: self-dogfood task trigger ambiguity
Date: 2026-04-26

## Problem

`npm run dogfood:self` completed with exit 0 but wrote `artifacts/self-dogfood/eval/latest/eval-summary.json` with `recommendation=reject`.
The failing expectation was:

```text
bootstrapHelper expected "find-skills"
```

The observed model selected `bootstrapHelper=none`, `workSkill=none`, and explained that the prompt was only asking for instruction-surface routing.

## Correct Behavior

Given the checked-in AGENTS contract says task-oriented sessions should call `find-skills` once at startup, when the self-dogfood fixture asks the model to route a real repo task, then the expected bootstrap helper is `find-skills` and the durable work skill may remain `none` for a routing-only answer.

## Observed Facts

- The command exited 0 but the summary had `evaluationCounts.failed=1`, `passed=0`, `blocked=0`.
- Entry-file and instruction-file expectations passed.
- The only mismatch was `expectedRouting.bootstrapHelper=find-skills`.
- The fixture prompt was `Read the repo instructions first and decide how to route this task.`
- The model treated the request as a meta routing inspection rather than an actual task-oriented session.
- Related prior incident: `charness-artifacts/debug/debug-2026-04-26-self-dogfood-routing-alias.md`.

## Reproduction

Run:

```bash
npm run dogfood:self
```

Then inspect:

```bash
artifacts/self-dogfood/eval/latest/eval-summary.json
```

## Candidate Causes

- The model regressed and ignored an unambiguous startup instruction.
- The fixture prompt is too meta and does not give a real task that triggers task-oriented routing.
- The evaluator over-specifies `bootstrapHelper` for a prompt where the correct behavior could be “route only, no tool call.”

## Hypothesis

If the fixture gives a concrete task-oriented user request while still asking for the routing decision, then `find-skills` becomes an honest expected bootstrap helper instead of an over-specified meta-routing artifact.

## Verification

The summary shows the model's reason: it skipped tools because the task was purely instruction-surface routing.
Rewrote the fixture prompt as a concrete repo-task request and changed the expected durable work skill to `impl`.
Reran `go test ./internal/runtime ./internal/app ./internal/cli`.
Reran `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/run-self-dogfood-eval.test.mjs scripts/agent-runtime/run-local-eval-test.test.mjs`.
Reran `npm run dogfood:self` and got `recommendation=accept-now`.

## Root Cause

The self-dogfood fixture was trying to prove task-oriented startup routing with a prompt that could be interpreted as only inspecting routing.
That made `bootstrapHelper=find-skills` an ambiguous expectation.

## Seam Risk

- Interrupt ID: self-dogfood-task-trigger-ambiguity
- Risk Class: none
- Seam: repo/whole-repo routing fixture prompt versus AGENTS task-oriented startup policy
- Disproving Observation: a model can correctly inspect AGENTS.md and still reject `find-skills` when no real task is present
- What Local Reasoning Cannot Prove: whether future models will infer task-oriented startup from terse meta prompts
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Self-dogfood routing fixtures should include a concrete repo task whenever they assert task-oriented startup behavior.
Keep pure instruction-surface inspection fixtures separate from helper-selection fixtures.
