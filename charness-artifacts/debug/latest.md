# Debug Review
Date: 2026-07-09

## Problem

Cycle 1 focused test failed after adding specdown generated outputs to `DEFAULT_GENERATED_ARTIFACTS`.
The failure was `ENOENT: no such file or directory, open '<tmp>/.cautilus/specdown/claim-inventory.json'`.

## Correct Behavior

`scripts/check-generated-artifact-drift.test.mjs` should create every parent directory needed by the default generated artifact list before writing fixture files.
Adding a new generated artifact path should require updating the expected list, not remembering to add another hard-coded `mkdirSync`.

## Observed Facts

- `npm run generated:drift:check` passed against the real repo.
- `node --test scripts/check-generated-artifact-drift.test.mjs` failed in `initRepo`.
- The stack trace pointed to `writeFileSync(join(root, path), ...)` for `.cautilus/specdown/claim-inventory.json`.
- `initRepo` pre-created `.cautilus/claims`, `.cautilus/audit`, and `docs/specs/generated`, but not `.cautilus/specdown`.

## Reproduction

- Run `node --test scripts/check-generated-artifact-drift.test.mjs` after adding `.cautilus/specdown/claim-inventory.json` to `DEFAULT_GENERATED_ARTIFACTS`.
- Observe the `ENOENT` failure before any drift assertion runs.

## Candidate Causes

- The real drift checker cannot handle nested generated paths.
- The new generated path is not tracked in the real repo.
- The temporary fixture repo creates only historical generated directories and not parent directories for every default path.

## Hypothesis

- If `initRepo` creates `dirname(join(root, path))` for each `DEFAULT_GENERATED_ARTIFACTS` entry before writing it, the focused tests will reach the intended drift assertions and pass.
- Disconfirmer: rerun the focused test and see another `ENOENT` for a default generated path.

## Verification

- Confirmed root cause from stack trace and `initRepo` directory setup.
- Confirmed: `node --test scripts/check-generated-artifact-drift.test.mjs` passes after deriving fixture parent directories from `DEFAULT_GENERATED_ARTIFACTS`.

## Root Cause

The fixture setup encoded a stale copy of generated artifact parent directories.
Cycle 1 correctly expanded the default path list, but the test helper did not derive its directory setup from that same list.

## Invariant Proof

- Invariant: tests that iterate `DEFAULT_GENERATED_ARTIFACTS` should derive fixture directories from `DEFAULT_GENERATED_ARTIFACTS`.
- Producer Proof: `initRepo` now calls `mkdirSync(dirname(join(root, path)), { recursive: true })` inside the loop.
- Final-Consumer Proof: focused Node tests exercise each default path through a temporary git repo.
- Interface-Shape Sibling Scan: future generated path additions should not need separate directory boilerplate.
- Non-Claims: this does not change the drift checker runtime behavior beyond the intended default path list.

## Detection Gap

- Focused Node test | fired immediately after the path-list change | smallest prevention is deriving fixture directories from the same list.

## Sibling Search

- Mental model: adding a path to the generated list only requires updating assertion arrays.
- same file: fixture parent directories | decision: derive from `DEFAULT_GENERATED_ARTIFACTS` | proof: focused test.
- same command surface: real repo `generated:drift:check` | decision: keep as runtime proof | proof: command passed before fixture fix.
- cross-file: no cross-file sibling because this was local test fixture setup around the changed constant.

## Seam Risk

- Interrupt ID: none
- Risk Class: none
- Seam: none
- Disproving Observation: failure is deterministic local fixture setup, not a host/runtime seam.
- What Local Reasoning Cannot Prove: n/a
- Generalization Pressure: none

## Interrupt Decision

- Resolution: resolved
- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep generated-artifact drift tests list-derived where possible.
When the default generated path list grows, fixture setup should compute parent directories from the list instead of maintaining another directory checklist.
