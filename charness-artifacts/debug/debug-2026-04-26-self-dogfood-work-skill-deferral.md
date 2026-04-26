# Debug Review: self-dogfood work skill deferral
Date: 2026-04-26

## Problem

`npm run dogfood:self` completed with exit 0 but wrote `artifacts/self-dogfood/eval/latest/eval-summary.json` with `recommendation=reject`.
The failing expectation was:

```text
workSkill expected "impl"
```

The observed model selected `bootstrapHelper=charness:find-skills`, `workSkill=none`, and explained that it had chosen only the first routing step.

## Correct Behavior

Given the checked-in AGENTS contract says task-oriented sessions should call `find-skills` once at startup and then choose the durable work skill that matches the task, when the self-dogfood fixture gives an implementation task, then the expected routing decision is `bootstrapHelper=find-skills` and `workSkill=impl`.

## Observed Facts

- The command exited 0 but the summary had `evaluationCounts.failed=1`, `passed=0`, `blocked=0`.
- Entry-file and instruction-file expectations passed.
- The only mismatch was `expectedRouting.workSkill=impl`.
- The fixture prompt said to "decide the first routing step for this task."
- The model followed that wording literally: it chose the bootstrap helper and deferred the durable work skill.
- Related prior incidents: `debug-2026-04-26-self-dogfood-routing-alias.md` and `debug-2026-04-26-self-dogfood-task-trigger-ambiguity.md`.

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

- The model regressed and no longer identifies `impl` for implementation tasks.
- The fixture prompt over-emphasizes the first routing step, making durable work-skill selection optional.
- The evaluator over-specifies `workSkill=impl` for a prompt that asks only for the first step.

## Hypothesis

If the fixture prompt explicitly asks for both the startup bootstrap helper and the durable work skill for the implementation task, then the existing `workSkill=impl` expectation is honest and the self-dogfood run should pass.

## Verification

Updated the checked-in self-dogfood fixture prompt and matching tests/examples to ask for both fields.
Reran:

```bash
go test ./internal/runtime ./internal/app ./internal/cli
node --test --test-reporter=spec --test-reporter-destination=stdout scripts/run-self-dogfood-eval.test.mjs scripts/agent-runtime/run-local-eval-test.test.mjs
npm run dogfood:self
```

The targeted tests passed.
The rerun produced `recommendation=accept-now`.

## Root Cause

The self-dogfood fixture was trying to prove both startup helper selection and durable work-skill selection, but the prompt asked the model to decide only the first routing step.
That made `workSkill=impl` an over-specified expectation for the exact prompt wording.

## Seam Risk

- Interrupt ID: self-dogfood-work-skill-deferral
- Risk Class: none
- Seam: repo/whole-repo routing fixture prompt versus expected bootstrap/work split
- Disproving Observation: a model can correctly choose `find-skills` while leaving `workSkill=none` when the prompt asks only for the first routing step
- What Local Reasoning Cannot Prove: whether future models will infer durable work skill from "first routing step" wording
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When a routing fixture asserts both `bootstrapHelper` and `workSkill`, make the user prompt request both fields explicitly.
Keep first-step-only routing fixtures separate from durable work-skill fixtures.
