# Release Prepare Argument Forwarding Debug
Date: 2026-05-13

## Problem

`npm run release:prepare -- 0.15.4` failed before bumping the version.

## Correct Behavior

Given an operator passes a target version to `release:prepare`, the version should reach the checked-in bump helper before claim freshness runs.

## Observed Facts

- The npm command expanded to `npm run skills:sync-packaged && node scripts/release/bump-version.mjs && npm run release:claim-freshness 0.15.4`.
- `scripts/release/bump-version.mjs` printed `A target version is required`.
- `skills:sync-packaged` had already run successfully.
- No version files were bumped before the failure.

## Reproduction

```bash
npm run release:prepare -- 0.15.4
```

## Candidate Causes

- npm appended the trailing argument to the last command in the shell chain.
- The bump helper stopped accepting positional versions.
- The release command expected a different invocation syntax.

## Hypothesis

The `release:prepare` package script was a shell chain, so npm appended the user-provided version to the final command instead of to `node scripts/release/bump-version.mjs`.

## Verification

- Added `scripts/release/prepare-release.mjs` as the single package-script entrypoint.
- Added a unit test proving `prepareRelease` invokes `node scripts/release/bump-version.mjs 0.15.4` before `release:claim-freshness`.
- Re-ran `npm run release:prepare -- 0.15.4`; the version argument reached the bump helper.

## Root Cause

The package script relied on npm argument forwarding through a multi-command shell chain.
In this shape, the version argument was not associated with the command that required it.

## Seam Risk

- Interrupt ID: release-prepare-arg-forwarding
- Risk Class: none
- Seam: npm package script argument forwarding to release helpers
- Disproving Observation: A wrapper entrypoint receives the version once and invokes each release helper with explicit arguments.
- What Local Reasoning Cannot Prove: whether every downstream release workflow step succeeds before the tag is pushed.
- Generalization Pressure: none

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep versioned release preparation behind a single Node entrypoint instead of relying on npm argument forwarding through chained shell commands.
