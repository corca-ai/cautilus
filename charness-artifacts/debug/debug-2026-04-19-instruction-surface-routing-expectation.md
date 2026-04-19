# Problem

`npm run dogfood:self:instruction-surface` completed successfully but returned
`recommendation=reject` on `checked-in-agents-routing`.

## Correct Behavior

Given the current checked-in [AGENTS.md](../../AGENTS.md), when the prompt is
only "Read the repo instructions first and decide how to route this task.",
the instruction-surface expectation should pass if the model keeps both the
bootstrap helper and durable work skill uncommitted and reports a narrow
routing-only decision.

## Observed Facts

- The failing case was `checked-in-agents-routing`.
- The observed routing decision after re-running self-dogfood was:
  `bootstrapHelper=none`, `workSkill=none`, `firstToolCall=none`.
- The checked-in expected routing still required first
  `workSkill=charness:impl`, then after the first adjustment still required
  `bootstrapHelper=charness:find-skills`.
- The current [AGENTS.md](../../AGENTS.md) explicitly says:
  "When the right skill is unclear ... route to the shared/public charness
  skill `find-skills` first."
- The failing observation did not indicate a runtime error, schema error, or
  missing instruction file.
  It was a semantic mismatch between the stale expectation and the current
  instruction surface.

## Reproduction

1. Run `npm run dogfood:self:instruction-surface`.
2. Open
   `artifacts/self-dogfood/instruction-surface/latest/instruction-surface-summary.json`.
3. Inspect `checked-in-agents-routing.routingEvaluation.mismatches`.

## Candidate Causes

1. The instruction-surface runner regressed and stopped selecting a work skill
   it should still commit to.
2. The checked-in case expectation drifted behind the current AGENTS contract.
3. The current prompt is intentionally narrower than the old expectation and
   no longer justifies selecting either `charness:impl` or
   `charness:find-skills` before answering the routing question itself.

## Hypothesis

If the repo-level routing contract now treats this prompt as a meta-routing
check rather than execution start, then the correct fix is to update the
checked-in expectation surfaces and not to force the runner back to either
`bootstrapHelper=charness:find-skills` or `workSkill=charness:impl`.

## Verification

- Re-read [AGENTS.md](../../AGENTS.md) and confirmed that it routes to
  `find-skills` first when the right skill is unclear.
- Compared the failing self-dogfood output with
  [fixtures/instruction-surface/cases.json](../../fixtures/instruction-surface/cases.json),
  [input.json](../../fixtures/instruction-surface/input.json), and
  [fixture-results.json](../../fixtures/instruction-surface/fixture-results.json).
- Confirmed the stale requirement appears in the checked-in fixture surfaces,
  not in the current repo instructions.

## Root Cause

The checked-in instruction-surface expectation was stale.

It still encoded an older interpretation where the narrow routing-only prompt
already implied the next execution move.
The current repo instruction surface allows a narrower first decision:
answer the routing question without committing to either a bootstrap helper or
durable work skill yet.

## Prevention

- When AGENTS-level routing narrows or broadens what counts as the first
  committed decision, update the checked-in instruction-surface fixtures in the
  same slice.
- Treat self-dogfood `reject` results as expectation drift first when the
  observed packet stays structurally valid and the mismatch is limited to one
  routing field.

## Related Prior Incidents

None recorded.
