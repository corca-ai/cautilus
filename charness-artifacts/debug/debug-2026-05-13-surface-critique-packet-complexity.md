# Surface Critique Packet Complexity Debug
Date: 2026-05-13

## Problem

The first implementation of `scripts/prepare-surface-critique-packet.mjs` failed ESLint complexity checks.

## Correct Behavior

The surface critique packet scanner should pass the repo lint policy while keeping release-surface finding rules explicit and testable.

## Observed Facts

- `npx eslint scripts/prepare-surface-critique-packet.mjs scripts/prepare-surface-critique-packet.test.mjs scripts/release/bump-version.mjs scripts/retro-surface-trigger-contract.test.mjs` failed.
- ESLint reported `Function 'buildSurfaceCritiquePacket' has a complexity of 20. Maximum allowed is 12`.
- ESLint also reported cognitive complexity 18 where 12 is allowed.
- The scanner had already produced one useful false-positive correction: `.agents/surfaces.json` contains a manifest schema `version`, not release metadata.
- The full `npm run verify` later failed at `coverage:floor:check` because the new scanner file was covered but not registered in `scripts/coverage-floor.json`.
- The first `git push` failed in pre-push because `claims:evidence-state:check` detected generated claim-state drift after the new commit moved `HEAD`.

## Reproduction

```bash
npx eslint scripts/prepare-surface-critique-packet.mjs scripts/prepare-surface-critique-packet.test.mjs scripts/release/bump-version.mjs scripts/retro-surface-trigger-contract.test.mjs
```

## Candidate Causes

- The packet builder mixed data loading, role matrix construction, finding collection, and status calculation in one function.
- Each finding rule was expressed inline with loops and conditionals instead of as a small rule helper.
- The version-field detector treated every JSON `version` key as release metadata before excluding manifest schema versions.

## Hypothesis

If each finding family is moved into a focused helper and `.agents/surfaces.json` is excluded from release-version detection, the scanner will keep the same packet behavior while satisfying lint.

## Verification

- `npx eslint scripts/prepare-surface-critique-packet.mjs scripts/prepare-surface-critique-packet.test.mjs scripts/release/bump-version.mjs scripts/retro-surface-trigger-contract.test.mjs` passes.
- `node --test scripts/prepare-surface-critique-packet.test.mjs scripts/retro-surface-trigger-contract.test.mjs scripts/release/bump-version.test.mjs` passes.
- `npm run critique:surface-packet:check` reports `status: ready` and no findings for the current repo.
- `npm run coverage:floor:check` passes after adding the new scanner floor without raising unrelated existing floors.
- `npm run claims:evidence-state` refreshed the generated claim-state files, and `npm run claims:evidence-state:check` passes.

## Root Cause

The first implementation treated the scanner as a single procedural audit instead of a rule bundle.
That made the highest-level function exceed the repo complexity budget and made the release metadata detector too broad.
The new runtime file also crossed the coverage floor threshold, so it needed an explicit floor entry as part of the same slice.
The generated claim-state files include the current commit comparison, so committing first and pushing without refreshing left the checked-in state one commit behind.

## Seam Risk

- Interrupt ID: surface-critique-packet-complexity
- Risk Class: none
- Seam: none
- Disproving Observation: none
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep each packet finding family in a separate helper so future scanner rules do not accumulate in the top-level builder.
Keep manifest schema versions separate from release metadata rewrite detection.
When adding covered runtime scripts, add only the new coverage floor entry unless the slice intentionally raises existing floors.
After creating a commit that changes tracked generated-state inputs, refresh generated claim state before pushing.
