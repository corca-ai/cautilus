# Debug Review
Date: 2026-05-03

## Problem

`npm run lint:specs` failed after adding the new specdown-backed user-facing claim specs.

## Correct Behavior

Given the new `docs/specs/user/index.spec.md` entry and Cautilus specdown adapter, when `npm run lint:specs` runs, then `check-specs` and `specdown run -quiet` should both pass.

## Observed Facts

- `node scripts/check-specs.mjs` passed with `spec checks passed (9 specs)`.
- `specdown run -quiet` failed.
- The focused reproduction was `specdown run -filter "Claim Discovery"`.
- The failing case was row 2 in `docs/specs/user/claim-discovery.spec.md`.
- The exact error was `Unexpected exit code`, expected `0`, actual `1`.
- The direct command printed `--sample-claims must be a positive integer` for `--sample-claims 0`.
- After that fix, `npm run lint:eslint` failed because `scripts/check-specs.mjs` kept an unused `validateIndexCoverage` helper and `scripts/specdown/cautilus-adapter.mjs` put too many branches in `handleCommand`.

## Reproduction

```bash
specdown run -filter "Claim Discovery"
./bin/cautilus claim show --input .cautilus/claims/evidenced-typed-runners.json --sample-claims 0
```

## Candidate Causes

- The new spec used an invalid `claim show --sample-claims 0` argument.
- The Cautilus specdown adapter might be passing table cells incorrectly.
- The checked-in claim packet might be missing or invalid.
- The new active-spec graph check left behind an obsolete helper.
- The adapter was written as one broad function instead of small validation helpers.

## Hypothesis

The spec used an invalid argument.
`claim show` requires a positive integer for `--sample-claims`, so changing the spec row to `--sample-claims 1` should make the focused spec pass without adapter changes.

## Verification

The direct command failed before any adapter-specific behavior mattered.
The spec row now uses `--sample-claims 1`; the next verification step is rerunning `npm run lint:specs`.
The lint failure is locally deterministic and should disappear after deleting the obsolete helper and extracting adapter result checks.

## Root Cause

The new user-facing claim discovery spec tried to request zero sample claims, but the CLI contract only accepts positive integers.
The follow-up lint failure came from implementation shape, not product behavior:
one old helper no longer had a caller, and the specdown adapter's command assertion path needed smaller functions.

## Seam Risk

- Interrupt ID: specdown-claim-show-sample-count
- Risk Class: none
- Seam: specdown adapter invoking Cautilus CLI
- Disproving Observation: direct `./bin/cautilus claim show ... --sample-claims 0` fails with the same argument validation message
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Prefer the smallest valid public command examples in specdown rows.
When a row is only proving command availability or packet shape, use documented positive sample counts instead of sentinel values unless the CLI explicitly supports them.
