# Claim Review Reason-Balanced Samples Critique
Date: 2026-07-09

## Decision Under Review

Change aggregate claim-review replay sampling so bounded dropped-update samples preserve reason representation when the sample cap allows it, then project those samples into the checked-in review drop summary.

Packet consumed: charness-artifacts/critique/2026-07-09-claim-review-reason-balanced-samples-packet.md

## Failure Angles

- Root-cause correctness: the sampler must fix the reason-representation gap without changing dropped-update counts or reviving unsafe identity inference.
- Operator contract: the Markdown and contract doc must make represented samples actionable without implying statistical representativeness or automatic recovery.
- Counterweight: avoid expanding this slice into public CLI promotion, proportional sampling, or stale-update reconstruction.

## Counterweight Pass

- No reviewer found an act-before-ship blocker.
- The cheap bundle was to add a summary-renderer regression proving all bounded samples render into Markdown, so a late represented reason is visible to humans.
- The product path stays repo-local; promoting this to the binary or adding full proportional sampling would be premature.
- Future policy for more distinct reasons than the sample cap is real but deferred; the contract already says representation is guaranteed only when the cap allows it.

## Structured Findings

- F1 | bin: bundle-anyway | evidence: strong | ref: scripts/agent-runtime/summarize-claim-review-drops.test.mjs | action: fix | note: Added a renderer regression that proves all bounded samples, including entries past ten, appear in Markdown.
- F2 | bin: over-worry | evidence: strong | ref: package.json | action: document | note: Reason-balanced sampling should remain inside aggregate replay and repo-local summary checks rather than becoming a new public binary command.
- F3 | bin: over-worry | evidence: moderate | ref: scripts/agent-runtime/apply-current-review-results.mjs | action: document | note: Full proportional sampling or review-result fairness is beyond the promised minimum reason representation.
- F4 | bin: valid-but-defer | evidence: moderate | ref: docs/contracts/claim-discovery-workflow.md:594 | action: defer | note: If distinct dropped reasons ever exceed the sample cap, a separate priority policy or reason-targeted diagnostic can define which reasons get represented.

## Reviewer Tier Evidence

- Requested tier: high-leverage
- Requested spawn fields: {}
- Host exposure state: host-defaulted
- Application state: host accepted three parent-spawned reviewers with no explicit tier metadata exposed.

## Fresh-Eye Satisfaction

parent-delegated

## Boundary Ownership

- Producer: `scripts/agent-runtime/apply-current-review-results.mjs`
- Consumer: `.cautilus/claims/review-drops-summary.json`, `.cautilus/claims/review-drops-summary.md`, and `npm run claims:review-drops:check`
- Owning surface: repo-local claim discovery workflow diagnostics
- Verdict: owned-correctly
