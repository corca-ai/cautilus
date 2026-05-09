# Review Feedback Skill Disclosure Debug
Date: 2026-05-09

## Problem

`npm run lint:skill-disclosure` failed after adding review feedback capture instructions to the Cautilus Agent skill.

## Correct Behavior

Given the Cautilus Agent skill is a core routing surface, when a workflow note is added, then the core `SKILL.md` body should stay within the repo's progressive-disclosure line budget and push detailed command discovery to the binary.

## Observed Facts

- The exact failure was:
  - `skills/cautilus-agent/SKILL.md: core has 199 non-empty lines; max is 180`
  - `plugins/cautilus/skills/cautilus-agent/SKILL.md: core has 199 non-empty lines; max is 180`
- The newly added section included a full multiline `review feedback build` command example.
- The skill already tells agents to use binary command discovery and `--help` instead of copying broad command lists into the answer.

## Reproduction

Run:

```bash
npm run lint:skill-disclosure
```

## Candidate Causes

- The new review feedback section added too many non-empty core lines.
- The command example duplicated detail that belongs in CLI help and command registry surfaces.
- The plugin copy and source skill copy stayed in sync, so both exceeded the same line budget.

## Hypothesis

If the review feedback section is compressed to routing and decision-boundary instructions and leaves detailed flag discovery to `cautilus review feedback build --help`, then the skill disclosure lint should pass while preserving the host-repo Agent behavior.

## Verification

- Replaced the full command block with one core routing sentence in both skill copies after the first shorter section still exceeded the budget at 185 non-empty lines.
- Re-ran `npm run lint:skill-disclosure` as part of the final verification pass.

## Root Cause

The first Agent-surface fix solved the product-boundary finding by placing too much CLI syntax in the core skill body instead of relying on the binary-owned command surface.

## Seam Risk

- Interrupt ID: review-feedback-skill-disclosure
- Risk Class: none
- Seam: Cautilus Agent core skill progressive-disclosure policy
- Disproving Observation: The command registry and CLI reference now include the detailed `review feedback build` flags.
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: none

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When updating Cautilus Agent core instructions, keep routing, sequencing, and authority boundaries in the skill and leave detailed command syntax in CLI help, registry examples, or references.
