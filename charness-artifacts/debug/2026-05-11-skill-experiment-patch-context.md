# Skill Experiment Patch Context Debug
Date: 2026-05-11

## Problem

An initial implementation patch for issue #34 failed before applying because it expected a `docs/cli-reference.md` context block that did not exist exactly in the current file.

## Correct Behavior

Given an implementation patch touches existing docs, when applying it, then the patch should anchor on verified current file context.

Given a patch fails before changing files, when continuing implementation, then the next patch should be split into smaller verified hunks instead of retrying the same broad patch.

## Observed Facts

- `apply_patch` reported `Failed to find expected lines in /home/hwidong/codes/cautilus/docs/cli-reference.md`.
- `git status --short` after the failed patch showed only the pre-existing `find-skills` inventory changes.
- A direct read of `docs/cli-reference.md` showed the evaluation section uses a different surrounding block than the failed patch expected.

## Reproduction

The failing patch attempted to insert skill-experiment CLI docs after a non-existent exact block:

```text
`cautilus eval evaluate` evaluates an already-observed packet without launching the host runner again.
The packet schema selects the preset: `dev/repo`, `dev/skill`, `app/chat`, or `app/prompt`.
```

The current file instead has the evaluation surface prose and examples arranged around line 273.

## Candidate Causes

- The patch used stale or approximated documentation context.
- The patch attempted too many unrelated file edits in one hunk, making context mismatch harder to isolate.
- The docs had changed since the remembered shape of the file.

## Hypothesis

If the failure is a context mismatch only, then reading the target blocks and applying smaller patches against verified lines should succeed without changing the implementation design.

## Verification

`git status --short` after the failed patch showed no code files added or modified.
The implementation will proceed with verified current context and smaller `apply_patch` calls.

## Root Cause

The patch was composed against an imprecise local memory of the CLI reference instead of the current checked-in text.

## Seam Risk

- Interrupt ID: skill-experiment-doc-context-mismatch
- Risk Class: none
- Seam: local patch application
- Disproving Observation: no code or docs from the failed patch were applied.
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: low

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

For broad repo changes, inspect the exact target blocks immediately before patching and split runtime, CLI, docs, and tests into separate hunks.
