# Debug Review
Date: 2026-05-04

## Problem

The fresh-eye repair added negative regression claims for review-budget packet and ordinary skill sequencing behavior, but the focused classifier test failed before the heuristic could be trusted.

## Correct Behavior

Given a concrete command or packet claim records review-budget confirmation, when claim discovery classifies it, then it should remain deterministic instead of becoming a skill eval claim.

Given an ordinary skill sequencing claim says the skill control flow should come after a deterministic packet, when claim discovery classifies it, then it should route to `cautilus-eval/dev/skill` unless the text is specifically premature LLM cluster-review tuning.

## Observed Facts

- `go test ./internal/runtime -run TestDiscoverClaimProofPlanAvoidsExampleAndBroadRouting` first failed because `The packet records separate review-budget confirmation before launching reviewers.` was not discovered as a claim candidate.
- After rewriting the fixture to `The command emits a packet that records separate review-budget confirmation before launching reviewers.`, the same test failed because `The skill control flow should come after the deterministic packet.` was classified as `deterministic`.
- The second failure reported `whyThisLayer=The claim names a deterministic gate or static contract that should be protected outside Cautilus eval.`

## Reproduction

Run:

```bash
go test ./internal/runtime -run TestDiscoverClaimProofPlanAvoidsExampleAndBroadRouting
```

Before the repair, the command failed on the two negative fixture cases described above.

## Candidate Causes

- The first fixture did not include a currently useful claim-extraction verb such as `should`, `must`, `emits`, `writes`, `runs`, or `uses`.
- The review-budget packet negative guard was correct, but the fixture never reached classification.
- The skill behavior classifier did not recognize `come after` as an observable sequencing verb.
- The generic deterministic token classifier ran after the skill behavior classifier and caught `deterministic packet`.

## Hypothesis

If the packet negative fixture is expressed as a concrete command-emits-packet claim, then claim extraction will include it and the deterministic packet classifier can prove the negative guard.

If `skillOrAgentBehaviorClaim` treats `come after` as skill sequencing behavior while `prematureReviewTuningClaim` remains limited to LLM cluster-review or batch-tuning language, then ordinary skill sequencing will route to `dev/skill` and premature review tuning will stay blocked.

## Verification

- `go test ./internal/runtime -run TestDiscoverClaimProofPlanAvoidsExampleAndBroadRouting` passes after the fixture rewrite and `come after` skill-behavior verb addition.

## Root Cause

The first negative fixture was not a valid claim-discovery sentence under the current high-recall extraction rules.
The second negative fixture exposed a real underbroad skill sequencing predicate: it recognized `show`, `ask`, `merge`, `select`, and similar verbs, but not `come after`, so the later generic deterministic-token rule took over.

## Seam Risk

- Interrupt ID: heuristic-negative-fixture-shape
- Risk Class: none
- Seam: deterministic claim-discovery heuristic tests
- Disproving Observation: focused classifier tests caught both the invalid negative fixture and the missing skill sequencing verb.
- What Local Reasoning Cannot Prove: whether every possible sequencing phrase should route to skill eval.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

When adding negative classifier fixtures, make sure the sentence first passes the ordinary claim extraction gate.
Pair narrow boundary guards with one positive ordinary-behavior sentence so a generic deterministic token cannot silently steal behavior claims.
