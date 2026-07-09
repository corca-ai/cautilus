# Shared Drop Sample Selection Critique
Date: 2026-07-09

## Decision Under Review

Move dropped-update reason-balanced sample selection into a shared pure helper and use it from both aggregate review replay and review-drop summary projection, including non-default `--sample-limit` paths.

Packet consumed: charness-artifacts/critique/2026-07-09-shared-drop-sample-selection-packet.md

## Failure Angles

- Shared-helper correctness: both producers must use the same bounded reason-representation policy without changing default generated output.
- Operator contract: summary `--sample-limit` must not silently reintroduce count-only debt when the cap can still represent each reason.
- Counterweight: avoid turning a small consistency fix into proportional sampling, queue planning, or public command expansion.

## Counterweight Pass

- The only act-before-ship issue was commit hygiene: the new helper file must be tracked because runtime scripts import it.
- A dedicated helper test was worth bundling because this is now a new pure function in a new file.
- Plain-object reason counts were replaced with `Map` in the helper so special reason strings remain data.
- Broader sampling priority policy remains deferred because the contract only promises representation when the cap allows it.

## Structured Findings

- F1 | bin: act-before-ship | evidence: strong | ref: scripts/agent-runtime/drop-sample-selection.mjs | action: fix | note: Include the new helper file in the final commit so runtime imports resolve.
- F2 | bin: bundle-anyway | evidence: moderate | ref: scripts/agent-runtime/drop-sample-selection.test.mjs | action: fix | note: Added direct fixture tests for the new pure helper, including cap limits and special reason keys.
- F3 | bin: over-worry | evidence: strong | ref: scripts/agent-runtime/drop-sample-selection.mjs | action: document | note: Do not expand this into proportional sampling, per-review-result fairness, queue planning, or public CLI promotion.
- F4 | bin: valid-but-defer | evidence: moderate | ref: docs/contracts/claim-discovery-workflow.md:594 | action: defer | note: If distinct dropped reasons exceed the cap, a later policy can decide priority; the current contract already scopes representation to cap-allowed cases.

## Reviewer Tier Evidence

- Requested tier: high-leverage
- Requested spawn fields: {}
- Host exposure state: host-defaulted
- Application state: host accepted three parent-spawned reviewers with no explicit tier metadata exposed.

## Fresh-Eye Satisfaction

parent-delegated

## Boundary Ownership

- Producer: `scripts/agent-runtime/drop-sample-selection.mjs`
- Consumer: `scripts/agent-runtime/apply-current-review-results.mjs`, `scripts/agent-runtime/summarize-claim-review-drops.mjs`, and `npm run claims:review-drops:check`
- Owning surface: repo-local claim discovery workflow diagnostics
- Verdict: owned-correctly
