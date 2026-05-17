# Debug Review
Date: 2026-05-17

## Problem

`npm run lint:specs` failed after the deterministic proof queue was cleared.

## Correct Behavior

Given the current claim status packet has no remaining `agent-add-deterministic-proof` claims, when the user-facing claim-discovery spec runs, then the spec should accept the current non-empty action buckets instead of requiring an empty bucket to remain present.

## Observed Facts

The exact failing command was `npm run lint:specs`.
The exact error text was `specdown: spec run failed`.
A non-quiet reproduction showed four failures in `docs/specs/user/claim-discovery.spec.md` under "Cautilus groups candidates by recommended next action."
The spec expected `agent-add-deterministic-proof:agent` and fixed JSON indexes for later buckets.
The current `.cautilus/claims/status-summary.json` omits `agent-add-deterministic-proof` because all deterministic ready-for-proof claims are now satisfied.

## Reproduction

Run `specdown run -no-report`.
The smallest failing section is the run block and JSON table in `docs/specs/user/claim-discovery.spec.md` that hardcodes `actionSummary.primaryBuckets[1].id` as `agent-add-deterministic-proof`.

## Candidate Causes

- The status-summary renderer accidentally stopped emitting empty action buckets.
- The claim-review application incorrectly removed deterministic claims from the queue.
- The spec encoded a historical backlog state instead of the current selected status packet.

## Hypothesis

If the spec is updated to assert the current non-empty action-bucket set and no longer requires `agent-add-deterministic-proof` after the deterministic queue is empty, then `npm run lint:specs` will pass without changing status-summary generation.

## Verification

Pending after the spec update: rerun `npm run lint:specs`, then the claim evidence/status checks for this slice.

## Root Cause

The spec coupled a product contract to an incidental backlog state.
`agent-add-deterministic-proof` is an action bucket for current work, not a permanent category that must be present when no claims need deterministic proof.

## Detection Gap

- Specdown user claim-discovery check | asserted fixed bucket indexes and did not allow empty work buckets to disappear | assert the current selected bucket set or use presence checks for non-empty categories only.
- Status report closeout | verified the bucket disappeared but did not immediately rerun full specdown before the final deterministic evidence bundle was applied | keep `npm run lint:specs` in the closeout sequence after status bucket changes.
- Review-result application | correctly removed the bucket, but no preflight warned that a docs/specs fixture hardcoded the old bucket order | avoid fixed index checks when the value represents current backlog shape.

## Sibling Search

- Mental model: action bucket names looked like static vocabulary but `primaryBuckets` is a non-empty current-work projection.
- Evidence Gaps spec: checks `actionSummary.primaryBuckets[0].id` only for existence of current buckets; decision: no change; proof: current specdown passes those rows.
- Claim Discovery spec: hardcoded several bucket indexes; decision: update to current selected status; proof: failing rows identify the stale expectation.
- Status report renderer: omits zero-count buckets by design in the current packet; decision: no code change; proof: clearing deterministic claims removes only that bucket while other buckets remain.

## Seam Risk

- Interrupt ID: claim-discovery-empty-deterministic-bucket
- Risk Class: none
- Seam: docs/specs current status projection
- Disproving Observation: `agent-add-deterministic-proof` is absent because there is no remaining deterministic proof work.
- What Local Reasoning Cannot Prove: whether future maintainers want zero-count buckets represented in status summaries.
- Generalization Pressure: low

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Specs that read live status-summary packets should avoid fixed index assertions for buckets that are allowed to become empty.
