# Debug Review
Date: 2026-05-18

## Problem

While running `npm run verify -- --runtime-signal charness-artifacts/quality/runtime-latest.json` for the setup/quality refresh, the `lint:specs` phase failed.

```text
specdown: docs/specs/evidence/claim-evidence-state.md: table must define at least one row
```

After fixing that generator issue and refreshing claim artifacts, full Specdown still failed because `docs/specs/user/claim-discovery.spec.md` expected bucket positions from the previous `.cautilus/claims/status-summary.json`.

## Correct Behavior

Given claim evidence state has zero scenario-sample rows, when the Markdown projection is rendered, then it should emit readable empty-state prose instead of a header-only table that Specdown rejects.
Given a claim source such as `README.md` or a user spec changes, when generated claim artifacts are refreshed, then executable current-data assertions should match the regenerated status packet.

## Observed Facts

- `docs/specs/evidence/claim-evidence-state.md` had a `### Scenario Samples` table with only a header and separator row.
- `scripts/agent-runtime/render-claim-evidence-state.mjs` always rendered sample sections with `table(...)`, even when the row list was empty.
- `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/agent-runtime/render-claim-evidence-state.test.mjs` passed after adding an empty-sample test.
- `npm run claims:refresh:all` regenerated `.cautilus/claims/status-summary.json` with six `actionSummary.primaryBuckets`.
- The regenerated status packet has no `agent-design-scenario` bucket because `claimSummary.byVerificationReadiness` has no `needs-scenario` entry.
- The regenerated status packet now has an `agent-add-deterministic-proof` bucket for the updated current-data assertion claim.
- `docs/specs/user/claim-discovery.spec.md` still asserted fixed index positions from an older status packet.

## Reproduction

Before the fix, `npm run lint:specs` failed in the full Specdown phase with the empty-table error.

After fixing the empty table and running `npm run claims:refresh:all`, direct `specdown run` showed the remaining stale assertion:

```text
expected: bucketCount=5
actual:   bucketCount=6
```

## Candidate Causes

- Specdown may have changed its table parser to reject header-only tables.
- The Evidence State generator may have emitted invalid Specdown Markdown for empty sample lists.
- The README cleanup may have changed claim discovery enough that generated status packets no longer include a scenario-design bucket.
- The executable spec may have mixed stable vocabulary assertions with current-data assertions.

## Hypothesis

If the root cause is generated empty-table output plus stale current-data assertions, then adding an empty-state renderer, refreshing claim artifacts, and aligning only the current-data expectation should make `npm run lint:specs` pass without changing claim-discovery bucket vocabulary.

## Verification

- Added `tableOrEmpty(...)` in `scripts/agent-runtime/render-claim-evidence-state.mjs`.
- Added a test that removes all `needs-scenario` candidates and asserts the Markdown renders empty-state prose instead of a header-only scenario sample table.
- Ran `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/agent-runtime/render-claim-evidence-state.test.mjs`: passed.
- Ran `npm run claims:refresh:all`: passed.
- Updated `docs/specs/user/claim-discovery.spec.md` to keep the vocabulary list while matching the regenerated current status summary.
- Ran `npm run lint:specs`: passed.

## Root Cause

The generated Evidence State Markdown used a table shape that is invalid when there are no sample rows.
The first repair exposed a second stale assertion: the current claim status no longer has any `needs-scenario` claims, so `agent-design-scenario` is valid vocabulary but not a present primary bucket in this repo's current status packet.
After the post-commit claim refresh, the current-data assertion itself became one deterministic-proof candidate, adding the `agent-add-deterministic-proof` bucket.

## Detection Gap

- Evidence State generator | unit tests covered populated sample tables but not zero-row sample tables | add an empty-sample renderer test.
- Claim-source refresh | current-data spec assertions can drift when claim source edits change generated packets | run `npm run claims:refresh:all` after claim source edits, then run `npm run lint:specs`.

## Sibling Search

- Mental model: generated Markdown tables are safe even when row lists are empty.
- Evidence State axis: sample lists can legitimately be empty; decision: render prose empty states instead of empty tables; proof: targeted unit test and `npm run lint:specs` pass.
- Current-data spec axis: vocabulary and current status are different claims; decision: keep the category vocabulary list but assert only buckets present in the regenerated status packet; proof: `.cautilus/claims/status-summary.json` has six primary buckets and no `agent-design-scenario` bucket.
- Claim-source axis: README and spec edits can affect generated claim status; decision: use the full claim refresh chain before treating status assertions as meaningful; proof: `npm run claims:refresh:all` passed and rewrote generated claim artifacts.

## Seam Risk

- Interrupt ID: evidence-state-empty-sample-table
- Risk Class: contract-freeze-risk
- Seam: Specdown parser consumes a generated Markdown projection.
- Disproving Observation: `npm run lint:specs` passes after the generator and current-data spec fixes.
- What Local Reasoning Cannot Prove: whether every generated Markdown projection outside Evidence State handles empty tables.
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep generated sample sections from emitting header-only tables.
After changing claim source files, run `npm run claims:refresh:all` before judging executable current-data assertions.

## Related Prior Incidents

- `debug-2026-05-17-claim-status-report-check-order.md`: claim generated artifacts require ordered refresh/check discipline.
