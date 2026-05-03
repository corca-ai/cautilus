# Debug: first-scan scope confirmation gap
Date: 2026-05-04

## Problem

`npm run dogfood:cautilus-first-scan-flow:eval:codex` failed after the first-scan audit was tightened to require pre-discovery entries/depth and scan-scope confirmation.

## Correct Behavior

Given no existing claim state, the skill should state the configured entry files and linked Markdown depth, ask the user to confirm or adjust that scan scope, and only then run first discovery.
It should also say LLM claim review is a separate budgeted branch.

## Observed Facts

The agent did state the configured entries and linked Markdown depth before `claim discover`.
It framed continuation as "reply with `1`" rather than explicitly asking the coordinator to confirm or adjust the scan scope.
It did not state before discovery that LLM claim review is a separate branch with its own review budget.

## Reproduction

Run `npm run dogfood:cautilus-first-scan-flow:eval:codex` with the stricter first-scan audit.
Before the skill wording change, the audit rejected the transcript for missing explicit scan-scope confirmation.

## Candidate Causes

- The bundled skill wording was too easy to compress into generic branch selection language.
- The audit expected explicit confirmation language while the skill only implied it.
- The fixture relied on numbered branch selection, which can hide whether the agent actually exposed the scan boundary.

## Hypothesis

If the skill instructs the agent to say "confirm this scan scope or adjust it" and mention the separate LLM review budget before discovery, then the first-scan dogfood should satisfy the stronger claim.

## Verification

The first-scan dogfood passes after the skill change.
The failing transcript remains useful evidence that branch selection alone is not sufficient proof of scan-scope confirmation.

## Root Cause

The skill asked for confirmation in intent but not in wording strong enough for the model to preserve under branch-selection compression.
The audit encoded the stronger product claim, so the instruction needed explicit confirmation wording.

## Prevention

Keep the first-scan audit assertion that scope confirmation must appear before discovery, not after it.
