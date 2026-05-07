# Claim Discovery Specdown Debug
Date: 2026-05-07

## Problem

Focused specdown failed for `docs/specs/user/claim-discovery.spec.md` after rewriting the Claim Discovery spec to use temp repos and extraction-heuristic evidence.

## Correct Behavior

Given the focused Claim Discovery spec, `npm run lint:specs -- docs/specs/user/claim-discovery.spec.md` should pass both static spec checks and the focused specdown run.
The spec should prove the prepared skill-evaluation fixture asks for discovery, extraction heuristics, duplicate handling, and stopping before review or eval execution.

## Observed Facts

- First failure: doctest lines used `$tmp` and `$claims_path` across separate `$` commands, but those variables were empty in later commands.
- Detailed specdown output showed errors such as `jq: error: Could not open file : No such file or directory`, `cannot create /README.md: Permission denied`, and `--repo-root requires a value`.
- After wrapping variable-dependent commands in single `sh -lc` invocations, the remaining failure was `asks-heuristics=false`.
- The fixture prompt said `entry-doc signals` but did not contain `extraction`.

## Reproduction

Run:

```bash
npm run lint:specs -- docs/specs/user/claim-discovery.spec.md
```

## Candidate Causes

- Specdown doctest commands might not share shell state across `$` prompts.
- The fixture prompt might not include the behavior terms asserted by the spec.
- The new code output might not include heuristic metadata in `discoveryEngine`.

## Hypothesis

If each variable-dependent doctest is collapsed into one shell invocation and the fixture explicitly asks for extraction heuristics, the focused specdown run should pass.

## Verification

- `go test ./internal/runtime -run 'TestDiscoverClaimProofPlanUsesCandidateHeuristicsTogether|TestDiscoverClaimProofPlanMergesIdenticalClaimsAcrossDistinctSources|TestDiscoverClaimProofPlanClassifiesFixtureClaims' -count=1` passed.
- `npm run lint:specs -- docs/specs/user/claim-discovery.spec.md` passed after the doctest and fixture fixes.

## Root Cause

The spec assumed doctest prompt lines shared shell variables.
They do not in this adapter path, so `$tmp` and `$claims_path` were empty in later commands.
The final fixture assertion also outpaced the checked-in fixture wording: the fixture asked for entry-doc signals but not extraction heuristics.

## Seam Risk

- Interrupt ID: claim-discovery-specdown-doctest-state
- Risk Class: none
- Seam: specdown doctest command state
- Disproving Observation: Focused specdown passes with single-command shell invocations and explicit fixture wording.
- What Local Reasoning Cannot Prove: Nothing remains for this incident; the adapter behavior is now encoded in the spec shape.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Use single `sh -lc` commands or ordinary shell blocks when a spec example needs temp paths or shared shell state.
When a spec checks prepared evaluator behavior, assert against the exact fixture prompt and update the fixture wording with the product requirement.
