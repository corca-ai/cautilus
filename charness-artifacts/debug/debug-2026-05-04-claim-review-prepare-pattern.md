# Claim Review Prepare Pattern Debug
Date: 2026-05-04

## Problem

`go test ./internal/runtime -run 'TestDiscoverClaimProofPlanAvoidsExampleAndBroadRouting' -count=1` failed after adding a regression case for:

```text
`claim review prepare-input` emits `cautilus.claim_review_input.v1` and records bounded clusters, skipped clusters, and skipped claims, but still does not call an LLM or merge review results.
```

The classifier still routed that claim to `cautilus-eval/dev-repo` instead of deterministic proof.

## Correct Behavior

Given a claim describes `claim review prepare-input` packet output, skipped cluster/claim accounting, and no LLM/no merge side effects, when discovery classifies it, then the claim should be deterministic because it is a CLI/schema/side-effect contract.

## Observed Facts

- The failing candidate summary started with a Markdown code span: `` `claim review prepare-input` ``.
- The new deterministic classifier branch checked for the literal substring `" claim review prepare-input"`.
- The lowercased line contains a backtick before `claim`, not a plain leading space.
- The `modelProducedStructuredOutputClaim` guard returned false for the deterministic packet branch because the sentence combines `LLM`, `emits`, and a schema name.
- The fallback eval branch matched later because the sentence includes `LLM`.

## Reproduction

```bash
go test ./internal/runtime -run 'TestDiscoverClaimProofPlanAvoidsExampleAndBroadRouting' -count=1
```

## Candidate Causes

- The new pattern required a leading plain space that code-spanned command names do not have.
- The model-produced structured-output guard was too broad for deterministic no-LLM command contracts.
- The test fixture sentence did not include the word `packet` and therefore missed other deterministic packet branches.

## Hypothesis

If the bug is the command-specific exception being behind broader model-output guards, then checking `claim review prepare-input` before `modelProducedStructuredOutputClaim` should route the claim before the broad LLM fallback.

## Verification

The focused test should pass after the pattern change.

## Root Cause

The deterministic `claim review prepare-input` classifier was both too literal about whitespace and placed behind a broader model-output guard.
Markdown code spans put a backtick before the command, and the sentence's `LLM` plus schema wording triggered the model-produced JSON guard before the command-specific deterministic branch could run.

## Seam Risk

- Interrupt ID: claim-review-prepare-pattern
- Risk Class: none
- Seam: portable claim discovery heuristic around Markdown code-spanned command names
- Disproving Observation: this was caught by a focused classifier test before generated claim artifacts were refreshed.
- What Local Reasoning Cannot Prove: whether every command-name variant is covered.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Classifier branches for command names should not require a leading plain space before a backtick-friendly command phrase.
Command-specific no-LLM/no-merge contracts should run before broad model-output guards.
