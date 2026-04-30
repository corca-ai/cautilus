# Debug Review: runner id placeholder contract drift
Date: 2026-05-01

## Problem

Full verification failed after adding the `{runner_id}` eval runner placeholder.

## Correct Behavior

Given product code renders a new eval-test command-template placeholder, when contract lint runs, then every placeholder must be documented in the matching contract surface.

## Observed Facts

- The failing command was `npm run verify`.
- The exact error was `eval_test replacements: {runner_id} used in internal/app/remaining_commands.go but missing from docs/contracts/skill-testing.md`.
- `docs/contracts/runner-readiness.md` documented `{runner_id}` for typed runners.
- `docs/contracts/skill-testing.md` still listed only the previous eval-test placeholders.

## Reproduction

```bash
npm run verify
```

## Candidate Causes

- The new placeholder was documented in the runner-readiness contract but not the older skill-testing eval-test placeholder list.
- The contract lint scans code placeholder usage across the shared eval-test path, not only the runner-readiness contract.
- `dev/skill` still uses the same eval-test rendering path even when the placeholder is primarily useful for typed runner selection.

## Hypothesis

If `docs/contracts/skill-testing.md` documents `{runner_id}`, then contract lint should pass this drift check and full verification can continue.

## Verification

Rerun `npm run verify` after updating the placeholder list.

## Root Cause

The implementation changed the shared eval-test replacement map without synchronizing every contract document that owns that shared placeholder vocabulary.

## Seam Risk

- Interrupt ID: runner-id-placeholder-contract-drift
- Risk Class: none
- Seam: eval-test command-template contract lint
- Disproving Observation: lint reported the exact missing placeholder documentation
- What Local Reasoning Cannot Prove: whether later verification phases pass after this contract repair
- Generalization Pressure: none

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When adding eval-test placeholders, update both the specific feature contract and the shared eval-test placeholder contract before running full verification.
