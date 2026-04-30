# Debug Review: review-to-eval claim show order
Date: 2026-04-30

## Problem

The live Codex dogfood for `cautilus-review-to-eval-flow` completed all major commands but returned `recommendation=reject`.

## Correct Behavior

Given the bundled skill is asked to continue through the review-to-eval branch, when it runs a fresh first claim scan, then it should run `claim show` on the saved claim map before preparing review input, launching a reviewer lane, applying the review result, validating, and planning evals.

## Observed Facts

- `npm run dogfood:cautilus-review-to-eval-flow:eval:codex` exited 0 but wrote an eval summary with `recommendation=reject`.
- The audit status was `failed` with one finding: `wrong_command_order`.
- The command log showed `claim discover`, then `claim review prepare-input`, then later `claim show` only after `claim validate`.
- The run did execute `claim review apply-result`, `claim validate`, and `claim plan-evals`.
- The skill text says `claim show` is the canonical status view, but the review branch paragraph did not explicitly place it immediately between fresh discovery and `claim review prepare-input`.

## Reproduction

```bash
npm run dogfood:cautilus-review-to-eval-flow:eval:codex
```

Inspect:

```bash
jq '.findings' artifacts/self-dogfood/cautilus-review-to-eval-flow-eval-codex/latest/review-to-eval-flow/episode-cautilus-review-to-eval-flow/audit.json
```

## Candidate Causes

- The review-to-eval fixture prompt may not name the pre-review `claim show` boundary strongly enough.
- The skill review branch text may let agents infer that `claim discover` output is enough status before review preparation.
- The audit command order may be too strict if `agent status` already summarized the claim state.

## Hypothesis

If the skill branch guidance and live fixture prompt explicitly require `claim show` after fresh discovery and before `claim review prepare-input`, then the live agent should satisfy the audit without weakening the review boundary.

## Verification

Before repair, the audit returned:

```json
[
  {
    "id": "wrong_command_order"
  }
]
```

After repair, rerun:

```bash
npm run dogfood:cautilus-review-to-eval-flow:eval:codex
```

## Root Cause

The review-to-eval skill guidance relied on a general `claim show` rule instead of making it a local branch step.
The agent therefore prepared review input from a fresh claim packet without first producing the product-owned status summary that the audit treats as the review budget and queue boundary.

## Seam Risk

- Interrupt ID: review-to-eval-claim-show-order
- Risk Class: none
- Seam: bundled-skill branch sequencing versus live audited agent behavior
- Disproving Observation: the transcript contained all downstream commands; the only rejected behavior was `claim show` occurring after validation instead of before review preparation
- What Local Reasoning Cannot Prove: whether all host agents will follow the branch order without fixture wording reinforcement
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

For audited multi-command skill branches, keep the required command order local to the branch paragraph instead of relying only on general workflow guidance.
