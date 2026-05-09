# Cautilus Agent Skill Disclosure Limit Debug
Date: 2026-05-10

## Problem

Adding `review feedback summarize` guidance to the Cautilus Agent skill made `npm run lint:skill-disclosure` fail.

## Correct Behavior

Given the Cautilus Agent core skill has a strict progressive-disclosure size budget, when a new command boundary is added to the agent guidance, then the source and packaged skill copies should stay at or below the configured 180 non-empty-line limit.

## Observed Facts

- `npm run lint:skill-disclosure` reported `skills/cautilus-agent/SKILL.md: core has 181 non-empty lines; max is 180`.
- The packaged copy under `plugins/cautilus/skills/cautilus-agent/SKILL.md` failed the same way.
- The failure appeared immediately after adding a separate sentence for `review feedback summarize`.
- The new guidance belongs near the existing `review feedback build` guidance because both commands are the same review-learning boundary.

## Reproduction

Run:

```bash
npm run lint:skill-disclosure
```

## Candidate Causes

- The new command guidance was added as a separate non-empty line instead of extending the existing review-learning instruction.
- The packaged skill copy stayed in sync with the source copy, so both crossed the same limit.
- The skill disclosure limit is intentionally tight to keep the agent surface progressively disclosed.

## Hypothesis

If the summarize guidance is merged into the existing review-feedback instruction line, then both skill copies can describe the new boundary without increasing the non-empty-line count.

## Verification

- Merged the summarize guidance into the existing review-feedback instruction in both the source and packaged skill copies.
- `npm run lint:skill-disclosure` should pass after the edit.

## Root Cause

The content was conceptually correct but violated the Cautilus Agent skill's line-budget contract.
The command belongs as a continuation of the existing review-feedback boundary, not as a new standalone disclosure line.

## Seam Risk

- Interrupt ID: cautilus-agent-skill-disclosure-limit
- Risk Class: none
- Seam: Cautilus Agent progressive-disclosure budget
- Disproving Observation: `npm run lint:skill-disclosure` passes with the source and packaged copies still synchronized.
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: none

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When adding Cautilus Agent command guidance, prefer extending the closest existing boundary instruction before adding another non-empty line.
Run `npm run lint:skill-disclosure` before broader verification whenever `skills/cautilus-agent/` changes.

## Related Prior Incidents

- [debug-2026-05-04-packaged-skill-sync.md](debug-2026-05-04-packaged-skill-sync.md): source and packaged skill copies need to remain synchronized when the agent surface changes.
