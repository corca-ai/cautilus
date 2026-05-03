# Review Input Summary Complexity Debug
Date: 2026-05-04

## Problem

`npm run lint:eslint -- scripts/agent-runtime/render-claim-review-input-summary.mjs scripts/agent-runtime/render-claim-review-input-summary.test.mjs` failed because the new review-input Markdown renderer exceeded the repo's ESLint complexity ceiling.

## Correct Behavior

Given a claim review input packet, when the summary renderer is linted, then packet-shape fallback, label fallback, and output formatting should stay in small helper functions under the configured complexity limit.

Given the renderer emits a readable review queue, when it formats the packet header and candidate entries, then it should not hide LLM/reviewer launch as part of deterministic prepare-input.

## Observed Facts

- ESLint reported `Function 'renderCandidate' has a complexity of 20. Maximum allowed is 12`.
- ESLint reported `Function 'renderHeader' has a complexity of 19. Maximum allowed is 12`.
- The first rendered Markdown also exposed a readability defect: `Source claim packet: [object Object]`.
- Focused tests passed before and after the refactor, so the failure was lint/maintainability plus one visible formatting defect rather than broken CLI execution.

## Reproduction

Run:

```bash
npm run lint:eslint -- scripts/agent-runtime/render-claim-review-input-summary.mjs scripts/agent-runtime/render-claim-review-input-summary.test.mjs
```

Before the repair, the command failed with the two complexity errors above.

## Candidate Causes

- Optional packet fallback chains in `renderCandidate` and `renderHeader` counted as branch complexity.
- Header rendering mixed source packet normalization, action-bucket fallback, count aggregation, and Markdown output.
- Candidate rendering mixed label fallback, source excerpt comparison, evidence hint counting, and Markdown output.
- The packet field `sourceClaimPacket` is an object in current review-input packets, while the renderer initially treated it like a string.

## Hypothesis

If candidate label fallback, source claim packet metadata, action bucket selection, selected-count formatting, and evidence preflight output move into helpers, then `renderCandidate` and `renderHeader` will fall below the lint complexity limit while preserving the deterministic-review-boundary text.

## Verification

- `npm run lint:eslint -- scripts/agent-runtime/render-claim-review-input-summary.mjs scripts/agent-runtime/render-claim-review-input-summary.test.mjs` passes.
- `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/agent-runtime/render-claim-review-input-summary.test.mjs` passes.
- `npm run claims:review-input-summary -- --input .cautilus/claims/review-input-agent-plan-cautilus-eval-2026-05-04b.json --output .cautilus/claims/review-input-agent-plan-cautilus-eval-2026-05-04b.md` writes Markdown with a repo-relative source claim packet path and explicit reviewer budget boundary.

## Root Cause

The initial renderer was shaped like a one-off projection script instead of a maintained operator surface.
It combined packet normalization and prose emission in two high-branch functions, and it assumed a scalar `sourceClaimPacket` where the packet records source metadata as an object.

## Seam Risk

- Interrupt ID: review-input-summary-complexity
- Risk Class: none
- Seam: operator-facing claim review packet projection
- Disproving Observation: focused ESLint caught maintainability drift before the renderer was committed.
- What Local Reasoning Cannot Prove: whether the selected launch order is the best product-review order without later reviewer or human feedback.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep packet projection helpers split by packet normalization, queue ordering, and prose output.
When a renderer is meant for constrained human review, inspect the generated artifact before treating passing tests as enough.
