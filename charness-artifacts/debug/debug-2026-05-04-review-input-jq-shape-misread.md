# Review Input JQ Shape Misread Debug
Date: 2026-05-04

## Problem

After `claim review prepare-input` wrote `.cautilus/claims/review-input-agent-plan-cautilus-eval-2026-05-04.json`, my compact summary command failed with:

```text
jq: error (at .cautilus/claims/review-input-agent-plan-cautilus-eval-2026-05-04.json:3295): Cannot iterate over null (null)
```

## Correct Behavior

Given a `cautilus.claim_review_input.v1` packet, when I summarize clusters for reviewer assignment, then the summary should use the packet's actual cluster candidate field and should not imply that Cautilus failed to prepare review input.

## Observed Facts

- `./bin/cautilus claim review prepare-input ... --output .cautilus/claims/review-input-agent-plan-cautilus-eval-2026-05-04.json` wrote a valid packet.
- The packet has top-level `clusters`.
- Each cluster stores claim entries under `candidates`, not `claims`.
- My failing jq expression iterated `.clusters[].claims[]`, which is null for this schema.
- A corrected expression using `.clusters[] | (.candidates // [])[]` reported 6 clusters and showed the first cluster correctly.

## Reproduction

```bash
./bin/cautilus claim review prepare-input \
  --claims .cautilus/claims/evidenced-typed-runners.json \
  --action-bucket agent-plan-cautilus-eval \
  --max-clusters 6 \
  --max-claims-per-cluster 4 \
  --excerpt-chars 1200 \
  --output .cautilus/claims/review-input-agent-plan-cautilus-eval-2026-05-04.json

jq '{claimCount:([.clusters[].claims[]] | length)}' \
  .cautilus/claims/review-input-agent-plan-cautilus-eval-2026-05-04.json
```

## Candidate Causes

- I reused a review-result or older packet mental model where claim entries were called `claims`.
- The packet schema could have changed without the status/report renderer being updated.
- The generated packet could have been malformed or empty.

## Hypothesis

If the issue is only an operator jq shape error, then reading packet keys and summarizing `.clusters[].candidates` should work without changing product code.

## Verification

```bash
jq 'keys' .cautilus/claims/review-input-agent-plan-cautilus-eval-2026-05-04.json
jq '{schemaVersion, clusterCount:(.clusters|length), claimCount:([.clusters[] | (.candidates // [])[]] | length), skippedCount:(.skippedClaims|length), firstCluster:.clusters[0]}' \
  .cautilus/claims/review-input-agent-plan-cautilus-eval-2026-05-04.json
```

The corrected command succeeded and showed `schemaVersion: cautilus.claim_review_input.v1`, `clusterCount: 6`, and a populated first cluster.

## Root Cause

The summary command used `.clusters[].claims[]`, but `cautilus.claim_review_input.v1` uses `.clusters[].candidates[]`.
The Cautilus command output was valid; the failure was in my ad hoc packet-reading command.

## Seam Risk

- Interrupt ID: review-input-jq-shape-misread
- Risk Class: none
- Seam: operator-authored jq summary around generated review-input packets
- Disproving Observation: the packet has valid top-level keys and populated `.clusters[].candidates`.
- What Local Reasoning Cannot Prove: whether every future ad hoc jq summary will pick the right schema field.
- Generalization Pressure: none

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

For generated Cautilus packets, inspect `schemaVersion` and `keys` before writing compact jq summaries.
For review-input packets, use `.clusters[].candidates`, not `.clusters[].claims`.

## Related Prior Incidents

- `charness-artifacts/debug/debug-2026-05-03-jq-summary-input-misuse.md`: prior operator-authored jq failure where generated Cautilus packets were valid but the summary expression was wrong.
