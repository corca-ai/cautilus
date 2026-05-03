# Eval Plan JQ Shape Misread Debug
Date: 2026-05-04

## Problem

After `claim plan-evals` wrote `.cautilus/claims/eval-plan-agent-reviewed-eval-2026-05-04.json`, my compact summary command failed with:

```text
jq: error (at .cautilus/claims/eval-plan-agent-reviewed-eval-2026-05-04.json:5954): Cannot iterate over null (null)
```

## Correct Behavior

Given a `cautilus.claim_eval_plan.v1` packet, when I summarize planned eval fixtures, then the summary should use the packet's actual `evalPlans` array and should not imply that Cautilus failed to plan evals.

## Observed Facts

- `./bin/cautilus claim plan-evals ... --output .cautilus/claims/eval-plan-agent-reviewed-eval-2026-05-04.json` wrote a valid packet.
- The packet has top-level `evalPlans`, not `plans`.
- My failing jq expression iterated `.plans[]`, which is null for this schema.
- A corrected expression using `.evalPlans[]` reported 4 plans and 319 skipped claims.

## Reproduction

```bash
./bin/cautilus claim plan-evals \
  --claims .cautilus/claims/evidenced-typed-runners.json \
  --output .cautilus/claims/eval-plan-agent-reviewed-eval-2026-05-04.json

jq '{planCount:(.plans|length), plans:[.plans[] | {claimId}]}' \
  .cautilus/claims/eval-plan-agent-reviewed-eval-2026-05-04.json
```

## Candidate Causes

- I reused a generic `plans` field name instead of checking the packet schema keys.
- The eval-plan packet schema could have changed without the summarizer habit changing.
- The generated packet could have been malformed or empty.

## Hypothesis

If the issue is only an operator jq shape error, then reading `keys` and summarizing `.evalPlans[]` should work without changing product code.

## Verification

```bash
jq 'keys' .cautilus/claims/eval-plan-agent-reviewed-eval-2026-05-04.json
jq '{planCount:(.evalPlans|length), skippedCount:(.skippedClaims|length), planSummary}' \
  .cautilus/claims/eval-plan-agent-reviewed-eval-2026-05-04.json
```

The corrected command succeeded and showed `planCount: 4`, `skippedCount: 319`.

## Root Cause

The summary command used `.plans[]`, but `cautilus.claim_eval_plan.v1` uses `.evalPlans[]`.
The Cautilus command output was valid; the failure was in my ad hoc packet-reading command.

## Seam Risk

- Interrupt ID: eval-plan-jq-shape-misread
- Risk Class: none
- Seam: operator-authored jq summary around generated eval-plan packets
- Disproving Observation: the packet has valid top-level keys and populated `.evalPlans`.
- What Local Reasoning Cannot Prove: whether every future ad hoc jq summary will pick the right schema field.
- Generalization Pressure: none

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

For generated Cautilus packets, inspect `schemaVersion` and `keys` before writing compact jq summaries.
For eval-plan packets, use `.evalPlans[]`, not `.plans[]`.

## Related Prior Incidents

- `charness-artifacts/debug/debug-2026-05-04-review-input-jq-shape-misread.md`: same operator habit on review-input packets.
- `charness-artifacts/debug/debug-2026-05-03-jq-summary-input-misuse.md`: prior operator-authored jq failure where generated Cautilus packets were valid but the summary expression was wrong.
