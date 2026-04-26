# Debug Review: agent-surface next action leak
Date: 2026-04-27

## Problem

`cautilus doctor --repo-root . --scope agent-surface` returned a ready agent-surface payload that still included a repo-scope `doctor --next-action` recommendation.
That leaked the eval-readiness onboarding loop into `$cautilus` no-input bootstrap even after the skill stopped calling `doctor --next-action` directly.

## Correct Behavior

Given the user invokes `$cautilus` with no task detail, when the skill checks agent-surface readiness, then the readiness payload should confirm the bundled skill surface without prescribing repo-scope onboarding or evaluation.
Missing agent-surface state may still point to `cautilus install`.

## Observed Facts

- The first direct `$cautilus` exec after the skill-only fix did not run eval, but the final answer still mentioned `first_bounded_run`.
- After blocking `doctor --next-action`, the second direct `$cautilus` exec produced a correct final answer.
- The raw `doctor --scope agent-surface` JSON still contained `next_action.command` and `next_prompt` pointing at `doctor --next-action`.
- `buildAgentSurfaceNextAction` returned a `switch_context` action for ready agent surfaces.

## Reproduction

Run:

```bash
./bin/cautilus doctor --repo-root . --scope agent-surface
```

Before the fix, a ready payload included `next_action` and `next_prompt` for repo-scope doctor onboarding.

## Candidate Causes

- The agent-surface doctor reused the repo onboarding loop too aggressively.
- The bundled skill treated the probe menu as a startup checklist.
- The command registry exposes eval examples, so raw command output can still contain eval strings even when no eval command ran.

## Hypothesis

If ready agent-surface doctor returns no next action, then `$cautilus` no-input bootstrap can use that readiness probe without leaking repo-scope onboarding or eval-readiness instructions.

## Verification

Added a CLI smoke assertion that ready agent-surface doctor omits `next_action` and `next_prompt`.
Re-ran the direct `$cautilus` exec after the skill routing changes and confirmed the final response stayed claim/status shaped.

## Root Cause

The agent-surface doctor scope had two responsibilities mixed together: verifying local agent-consumable skill installation and continuing the repo-scope onboarding loop.
For no-input skill bootstrap, that second responsibility is counterproductive because it reintroduces `doctor --next-action` as soon as the readiness probe succeeds.

## Seam Risk

- Interrupt ID: agent-surface-next-action-leak
- Risk Class: none
- Seam: CLI readiness payloads consumed by agent routing instructions
- Disproving Observation: a same-agent final answer can look correct while raw readiness payloads still contain branch-steering text
- What Local Reasoning Cannot Prove: whether all future agent runtimes will ignore irrelevant `next_action` fields as consistently as this test run did
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep no-input skill tests checking both command execution and final summary.
When adding readiness scopes intended for agent bootstrap, avoid embedding branch-steering instructions that belong to a different workflow.
