# Aggregate Review Application Provenance Spec Handoff

Date: 2026-05-04

## Context

`scripts/agent-runtime/apply-current-review-results.mjs` applies many `review-result-*.json` packets to a current claim packet by chaining `cautilus claim review apply-result`.
The final packet must be understandable without reconstructing the temp directory chain.

## Contract

- The final packet preserves ordinary `claim review apply-result` provenance enough to debug the last single apply when needed.
- The final packet also writes aggregate provenance for the wrapper run.
- Aggregate provenance records the source claim packet path, output path, all applied review-result paths, skipped review-result paths, applied/skipped result counts, kept/dropped update counts, and `provenanceMode=aggregate-current-review-results`.
- `claimIds` and `evidenceStatus` updates remain owned by the underlying `claim review apply-result` command; the wrapper only clarifies aggregate provenance.

## Checks

- `node --test scripts/agent-runtime/apply-current-review-results.test.mjs`
- `npm run claims:apply-review-results`
- `jq '.reviewApplication.aggregateReviewResultPaths, .reviewApplication.keptUpdateCount' .cautilus/claims/evidenced-typed-runners.json`
