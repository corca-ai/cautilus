# Claim Review Sample Policy Metadata Critique
Date: 2026-07-09

## Decision Under Review

Add sample-selection policy metadata to `cautilus.claim_review_drop_summary.v1` JSON and Markdown so agents can tell that bounded dropped samples are reason-representation samples, not proportional samples.

Packet consumed: charness-artifacts/critique/2026-07-09-claim-review-sample-policy-metadata-packet.md

## Failure Angles

- Packet clarity: the added fields must describe the existing selector behavior without changing queue action semantics.
- Operator wording: Markdown must avoid implying proportionality, stale update recovery, or automatic queue readiness.
- Schema scope: avoid turning this additive diagnostic metadata into a broader schema redesign.

## Counterweight Pass

- No reviewer found an act-before-ship blocker.
- Two reviewers noted that `preservesReasonRepresentationWhenCapAllows` was too broad because the guarantee is over source recorded samples, not every aggregate reason count; the field was narrowed to `preservesSourceSampleReasonRepresentationWhenCapAllows`.
- Reviewers also asked for `Selected samples` in Markdown so source and selected sample counts do not blur when they diverge.
- Schema version bump, proportional sampling, and upstream `reviewApplication` policy provenance remain unnecessary for this slice.

## Structured Findings

- F1 | bin: bundle-anyway | evidence: strong | ref: scripts/agent-runtime/summarize-claim-review-drops.mjs | action: fix | note: Renamed the preservation flag to scope the guarantee to source recorded samples.
- F2 | bin: bundle-anyway | evidence: strong | ref: .cautilus/claims/review-drops-summary.md | action: fix | note: Added selected sample count to the Markdown packet section next to source sample count.
- F3 | bin: over-worry | evidence: strong | ref: .cautilus/claims/review-drops-summary.json | action: document | note: Do not require a packet schema version bump for additive diagnostic metadata.
- F4 | bin: valid-but-defer | evidence: moderate | ref: scripts/agent-runtime/apply-current-review-results.mjs | action: defer | note: Upstream `reviewApplication` could carry sampling policy provenance later, but the summary projection already exposes current policy and counts.

## Reviewer Tier Evidence

- Requested tier: high-leverage
- Requested spawn fields: {}
- Host exposure state: host-defaulted
- Application state: host accepted three parent-spawned reviewers with no explicit tier metadata exposed.

## Fresh-Eye Satisfaction

parent-delegated

## Boundary Ownership

- Producer: `scripts/agent-runtime/summarize-claim-review-drops.mjs`
- Consumer: `.cautilus/claims/review-drops-summary.json`, `.cautilus/claims/review-drops-summary.md`, and `npm run claims:review-drops:check`
- Owning surface: repo-local claim discovery workflow diagnostics
- Verdict: owned-correctly
