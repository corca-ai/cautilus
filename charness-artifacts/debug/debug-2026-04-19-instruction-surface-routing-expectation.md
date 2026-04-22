# Debug Review: instruction-surface routing expectation
Date: 2026-04-19

## Problem

`npm run dogfood:self:instruction-surface` completed successfully but returned `recommendation=reject` on `checked-in-agents-routing`.

## Correct Behavior

Given the current checked-in `AGENTS.md`,
when the prompt is only "Read the repo instructions first and decide how to route this task.",
then the instruction-surface expectation should pass if the model reports only a narrow routing decision without prematurely committing to execution work.

## Observed Facts

- The failing case was `checked-in-agents-routing`.
- The observed routing packet reported `bootstrapHelper=none`, `workSkill=none`, and `firstToolCall=none`.
- The checked-in expected routing still required `workSkill=charness:impl`, and later still required `bootstrapHelper=charness:find-skills`.
- The current `AGENTS.md` says to use `find-skills` first when the right skill is unclear.
- The failing observation was structurally valid and showed no runtime error or missing instruction file.

## Reproduction

1. Run `npm run dogfood:self:instruction-surface`.
2. Open `artifacts/self-dogfood/instruction-surface/latest/instruction-surface-summary.json`.
3. Inspect `checked-in-agents-routing.routingEvaluation.mismatches`.

## Candidate Causes

- The instruction-surface runner regressed and stopped selecting a work skill it should still commit to.
- The checked-in case expectation drifted behind the current repo routing contract.
- The current prompt is intentionally narrower than the older expectation and no longer justifies selecting either `charness:impl` or `charness:find-skills`.

## Hypothesis

If the repo-level routing contract now treats this prompt as a meta-routing check rather than execution start,
then the correct fix is to update the checked-in expectation surfaces instead of forcing the runner back to an older routing decision.

## Verification

- Re-read `AGENTS.md` and confirmed it routes to `find-skills` first only when the right skill is unclear.
- Compared the failing output with the checked-in instruction-surface fixture files.
- Confirmed the stale requirement lived in the expectation fixtures, not in the current repo instructions.

## Root Cause

The checked-in instruction-surface expectation was stale.
It still encoded an older interpretation where the routing-only prompt already implied the next execution move.

## Prevention

- Update instruction-surface fixtures in the same slice whenever AGENTS-level routing narrows or broadens the first committed decision.
- Treat self-dogfood `reject` results as expectation drift first when the packet stays structurally valid and the mismatch is limited to routing semantics.
