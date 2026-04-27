# Debug Review: first-scan review budget boundary
Date: 2026-04-27

## Problem

After the first-scan episode was wired, a final Codex live run executed the correct commands but failed the product audit because the agent did not clearly say that the next claim-review branch requires a review budget before reviewer launch.

## Correct Behavior

Given `$cautilus` has completed the first bounded claim scan and `claim show` has summarized the saved claim map, when the agent recommends the review branch, then the coordinator should understand that LLM-backed review is separate and budgeted before reviewer lanes, review-result application, eval planning, edits, or commits happen.

## Observed Facts

- The Codex transcript showed the expected command sequence: `agent status`, `claim discover --repo-root`, and `claim show --sample-claims`.
- The audit rejected only `missing_review_budget_boundary`.
- The agent recommended `Prepare bounded claim review clusters before drafting eval scenarios`, but did not explicitly mention LLM review or review budget.
- The Claude transcript passed because it described the branch as LLM review with a review budget.

## Reproduction

```bash
npm run dogfood:cautilus-first-scan-flow:eval:codex
jq '.' artifacts/self-dogfood/cautilus-first-scan-flow-eval-codex/latest/first-scan-flow/episode-cautilus-first-scan-flow/audit.json
```

Before the fix, the audit contained one finding: `missing_review_budget_boundary`.

## Candidate Causes

- The audit may have been too strict about exact wording.
- The bundled skill may have stated the review-budget boundary only before launching review, not when recommending the branch after first scan.
- Codex may have compressed the branch description into a generic "bounded review clusters" label that is less understandable to a coordinator.

## Hypothesis

If the bundled skill tells the agent to explain a budgeted LLM review branch when presenting review as the next choice, then the first-scan episode should pass without forcing the agent into a brittle phrase.

## Verification

Updated the bundled skill source, packaged copy, and repo-installed copy to say that a natural claim-review next branch must be presented as budgeted LLM review, and that the budget precedes reviewer lanes, result application, eval planning, edits, and commits.
Updated the binary-owned `claim show` recommended next action so agents that quote the packet still surface "bounded LLM claim review" and "review budget".
Re-ran:

```bash
npm run dogfood:cautilus-first-scan-flow:eval:codex
npm run dogfood:cautilus-first-scan-flow:eval:claude
```

Both live eval runs returned `recommendation=accept-now`, `passed=1`, `failed=0`.

## Root Cause

The existing skill boundary was correct for the moment before launching review, but too implicit for the post-scan branch menu.
The binary-owned recommended next action also used a coordinator-weak shorthand, so Codex reasonably quoted that packet text instead of the stronger skill-level guidance.
The audit encoded the stronger product requirement.

## Seam Risk

- Interrupt ID: first-scan-review-budget-boundary
- Risk Class: none
- Seam: product-skill wording to live coding-agent coordinator summaries
- Disproving Observation: command behavior was correct, but a human-facing boundary was still underspecified in the transcript
- What Local Reasoning Cannot Prove: whether all future wording variants will be equally clear to users without overfitting the prompt
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep audit-backed skill episodes checking both command behavior and coordinator-facing decision boundaries.
When an audit failure is about user-facing branch comprehension rather than literal command safety, prefer tightening the `what` and `why` in the skill over adding a command-level prohibition.
