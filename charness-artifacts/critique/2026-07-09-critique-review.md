# Critique Review
Date: 2026-07-09

## Decision Under Review

Tighten aggregate claim review-result replay so stale dropped updates are summarized by reason, recorded in `reviewApplication`, and no longer trusted by display `claimId` when the current claim has a fingerprint.

## Failure Angles

- Diagnostic/code-correctness lens: same-display-id fingerprintless updates could still be applied to a current fingerprinted claim, which violated the "fingerprint is identity" rule.
- Operational contract lens: all-stale replays returned and warned about dropped updates but did not persist those diagnostics into the final output packet.
- Maintainer-legibility lens: the new reason counts needed explicit reason vocabulary in the contract doc.

## Counterweight Pass

- Acted before ship on the two correctness blockers: fingerprintless same-id collisions now drop, and all-stale replay outputs still project aggregate provenance.
- Bundled cheap coverage and contract fixes: mismatched-fingerprint reason assertions, stale-only end-to-end replay test, and reason vocabulary docs.
- Rejected broad fingerprintless legacy recovery as over-worry for this slice; unsafe identity inference would create a second matching path.
- Deferred stratified dropped-update sampling by reason; counts preserve the durable aggregate signal and the current sample cap is safe.

## Structured Findings

- F1 | bin: act-before-ship | evidence: strong | ref: scripts/agent-runtime/apply-current-review-results.mjs:302 | action: fix | note: require update fingerprints when current claims have fingerprints so same-id fingerprintless legacy updates drop instead of applying
- F2 | bin: act-before-ship | evidence: strong | ref: scripts/agent-runtime/apply-current-review-results.mjs:518 | action: fix | note: project aggregate provenance for stale-only replay so dropped diagnostics survive in the final packet
- F3 | bin: bundle-anyway | evidence: moderate | ref: docs/contracts/claim-discovery-workflow.md:593 | action: fix | note: define dropped-update reason vocabulary and add focused assertions for reason counts
- F4 | bin: over-worry | evidence: strong | ref: docs/contracts/claim-discovery-workflow.md:593 | action: document | note: do not recover fingerprintless legacy updates by inference in this slice
- F5 | bin: valid-but-defer | evidence: moderate | ref: .cautilus/claims/evidenced-typed-runners.json | action: defer | note: stratified dropped-update samples by reason may improve diagnostics later but is not required for safe replay

## Reviewer Tier Evidence

- Requested tier: high-leverage
- Requested spawn fields: {}
- Host exposure state: host-defaulted
- Application state: host accepted three parent-spawned reviewers; no provider-side tier application signal was exposed

## Fresh-Eye Satisfaction

parent-delegated

## Boundary Ownership

- Producer: `scripts/agent-runtime/apply-current-review-results.mjs` produces aggregate replay diagnostics and filtered review-result updates.
- Consumer: `.cautilus/claims/evidenced-typed-runners.json` and downstream claim status/evidence-state refresh consumers.
- Owning surface: claim-discovery-workflow / agent-runtime aggregate replay.
- Verdict: owned-correctly
