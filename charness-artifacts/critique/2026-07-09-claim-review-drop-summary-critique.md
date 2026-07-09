# Claim Review Drop Summary Critique
Date: 2026-07-09

## Decision Under Review

Add a repo-local claim review drop summary command that projects aggregate replay drop diagnostics into JSON and Markdown, wires the check into `verify`, and commits the generated packet.

Packet consumed: charness-artifacts/critique/2026-07-09-claim-review-drop-summary-packet.md

## Failure Angles

- Code and packet correctness: the summary must not imply dropped review updates are recovered or infer-matchable.
- Operator contract: the Markdown must distinguish aggregate counts from sample-backed queues.
- Counterweight: keep the surface repo-local and generated instead of promoting it to the public binary before operators prove repeated use.

## Counterweight Pass

- The generated files should be committed because they are current claim state, not disposable build output.
- A binary command would be premature; the package script is enough for this repo-local diagnostic.
- Reason-balanced replay sampling is real follow-up work, but it should not block a summary that accurately labels current count-only debt.

## Structured Findings

- F1 | bin: act-before-ship | evidence: strong | ref: .cautilus/claims/review-drops-summary.md | action: fix | note: Unsampled `missing-live-fingerprint` counts were originally described with queue-selection language; action wording now depends on `sampleCoverage`.
- F2 | bin: bundle-anyway | evidence: moderate | ref: scripts/agent-runtime/summarize-claim-review-drops.test.mjs | action: fix | note: Added counted-but-unsampled and stale `--check` regressions so this operator overclaim fails locally.
- F3 | bin: valid-but-defer | evidence: strong | ref: scripts/agent-runtime/apply-current-review-results.mjs | action: defer | note: Upstream reason-balanced dropped-update sampling remains a replay diagnostics improvement, not required for the summary to be honest.
- F4 | bin: over-worry | evidence: moderate | ref: package.json | action: document | note: Promoting this to `bin/cautilus` now would expand the public surface before repo-local use proves the contract.

## Reviewer Tier Evidence

- requested tier: high-leverage
- requested spawn fields: {}
- host exposure state: host-defaulted
- application state: host accepted three parent-spawned reviewers with no explicit tier metadata exposed.

## Fresh-Eye Satisfaction

parent-delegated

## Boundary Ownership

- Producer: `scripts/agent-runtime/summarize-claim-review-drops.mjs`
- Consumer: `.cautilus/claims/review-drops-summary.json`, `.cautilus/claims/review-drops-summary.md`, and `npm run verify`
- Owning surface: repo-local claim discovery workflow diagnostics
- Verdict: owned-correctly
