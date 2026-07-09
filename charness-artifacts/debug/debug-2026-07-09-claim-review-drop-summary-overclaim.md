# Debug Review
Date: 2026-07-09

## Problem

The new claim review drop summary projected `missing-live-fingerprint` as a queue-selectable action even when the generated packet had zero recorded samples for that reason.

## Correct Behavior

Given a drop reason that appears in `droppedUpdateReasonCounts` but not in `droppedUpdateSamples`, the summary must present it as count-level diagnostic debt only.
The packet may recommend a bounded re-review queue only for reason classes represented by recorded samples.

## Observed Facts

- Fresh-eye reviewers found the generated Markdown reported `missing-live-fingerprint: 140` with `0/140` recorded samples while the action text still told operators to use `reviewResultPath` and `claimFingerprint`.
- The JSON packet already had `sampleCoverage`, so the producer had enough information to avoid the overclaim.
- The focused tests covered represented sample classes but did not include a reason-count-without-sample fixture.

## Reproduction

- Generate `.cautilus/claims/review-drops-summary.md` from the current claim packet.
- Observe `missing-live-fingerprint: 0/140 recorded sample(s); not-represented`.
- Observe the old action text still suggested a focused queue from fields that did not exist in the recorded sample set.

## Candidate Causes

- The action-class builder consumed only aggregate reason counts, not sample coverage.
- The Markdown renderer repeated action text without surfacing whether the action was sample-backed.
- The tests encoded only the happy path where each reason count also had at least one sample.

## Hypothesis

- If action classes are built from sample coverage, unsampled reason classes will render count-level debt and no bounded queue hint; disconfirmer: generate the summary and see an unsampled reason still mention selecting a queue from this packet.
- If a regression fixture includes a counted-but-unsampled reason, future broad wording changes will fail before generated outputs drift; disconfirmer: remove the conditional action and observe the fixture still passing.

## Verification

- Confirmed: `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/agent-runtime/summarize-claim-review-drops.test.mjs scripts/run-verify.test.mjs` passes with 30 tests.
- Confirmed: `npm run claims:review-drops:check` passes after regenerating the packet.
- Confirmed: `.cautilus/claims/review-drops-summary.md` now says no bounded queue can be selected for the unsampled `missing-live-fingerprint` class.

## Root Cause

The first implementation treated aggregate reason counts as sufficient for operator action classes.
That conflated two different facts: a reason occurred in replay, and the packet contains concrete samples that can seed a bounded queue.

## Invariant Proof

- Invariant: A claim review drop summary must not recommend a bounded queue for a reason class unless the packet records at least one sample for that reason.
- Producer Proof: `buildReviewDropSummary` now derives `actionClasses` from `sampleCoverage` and records `sampleStatus` plus `recordedSampleCount`.
- Final-Consumer Proof: the Markdown renderer prints the coverage in the action class and renders a count-level debt action for unsampled reasons.
- Interface-Shape Sibling Scan: checked the package script, verify phase, generated JSON, generated Markdown, and the contract doc for the same queue-selection wording.
- Non-Claims: this does not recover stale review updates or create reason-balanced samples; it only prevents queue-selection overclaim from the current packet.

## Detection Gap

- focused unit tests | missing counted-but-unsampled reason fixture | add regression asserting `not-represented` classes cannot select a bounded queue
- generated-output check | missing stale-output negative fixture | add CLI `--check` negative test
- contract docs | queue-selection sentence was unconditional | make sample-backed queue selection explicit

## Sibling Search

- Mental model: recorded drop counts were mistaken for actionable sample coverage.
- same layer: `scripts/agent-runtime/summarize-claim-review-drops.mjs` action builder and renderer | decision: same bug, fix now | proof: local packet and Markdown proof
- abstraction up: `docs/contracts/claim-discovery-workflow.md` operator contract | decision: same bug, fix now | proof: doc sentence now gates queue selection on represented samples
- specialization down: `scripts/agent-runtime/summarize-claim-review-drops.test.mjs` fixtures | decision: same bug, fix now | proof: counted-but-unsampled regression and stale `--check` regression
- cross-file: package and verify scripts consume the generated packet through `claims:review-drops` and `claims:review-drops:check`; no other queue-selection projection was found in this slice.

## Seam Risk

- Interrupt ID: none
- Risk Class: none
- Seam: none
- Disproving Observation: focused JS tests and generated packet check exercise the producer and consumer output.
- What Local Reasoning Cannot Prove: it does not prove a future reason-balanced sampling command.
- Generalization Pressure: none

## Interrupt Decision

- Resolution: resolved
- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

Parent-delegated fresh-eye critique found the overclaim and the fix landed in the same slice.

## Prevention

Keep action wording downstream of sample coverage, not aggregate counts.
When a diagnostic packet carries both counts and bounded samples, tests must include at least one counted-but-unsampled class before operator queue language is accepted.
