# Packaged Skill Sync Debug
Date: 2026-05-04

## Problem

`npm run verify` failed after updating the Cautilus skill adapter contract reference because the packaged plugin skill tree no longer matched the repo-bundled skill source.

## Correct Behavior

Given a change under `skills/cautilus/`, the packaged tree under `plugins/cautilus/skills/cautilus/` should be regenerated so release and distribution tests see the same skill content, with only the expected upward-link rewriting.

## Observed Facts

The exact failing test was:

```text
packaged cautilus skill stays in sync with the repo-bundled skill source
```

The diff showed `references/adapter-contract.md` still listed `codex`, `claude`, or `fixture` in the packaged copy, while the source copy had been updated to include `product`.

## Reproduction

Run:

```bash
npm run verify
```

The node test phase fails in `scripts/release/distribution-surface.test.mjs`.

## Candidate Causes

- The source skill reference was edited without running the package sync script.
- The package sync script failed to rewrite the updated reference.
- The distribution test compared the wrong source and destination trees after a previous packaging change.

## Hypothesis

If the packaged skill tree is regenerated with the checked-in sync script, then `scripts/release/distribution-surface.test.mjs` should compare equal again.

## Verification

`npm run skills:sync-packaged` regenerated `plugins/cautilus/skills/cautilus/` from `skills/cautilus/`.
The command reported the expected source and destination directories.

## Root Cause

Manual source-skill edit without the required packaged-skill sync step.
The sync requirement is already enforced; the failure was an operator sequencing miss, not a missing product guard.

## Seam Risk

- Interrupt ID: packaged-skill-sync
- Risk Class: none
- Seam: release packaging mirror
- Disproving Observation: The distribution-surface test directly showed the stale packaged reference and `npm run skills:sync-packaged` updated the mirror.
- What Local Reasoning Cannot Prove: Whether every future skill reference edit will remember the sync step before verify; the existing test catches drift before closeout.
- Generalization Pressure: none

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

After any edit under `skills/cautilus/`, run `npm run skills:sync-packaged` before `npm run verify`.
