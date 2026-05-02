# Debug Review: claim review boundary artifacts
Date: 2026-05-02

## Problem

Fresh-eye review found that the claim-review boundary fix still left two misleading surfaces:
the claim-discovery contract still had broad "binary stays deterministic" wording, and the bundled skill described global "LLM-backed review work" near the `claim`, `eval`, and `optimize` front doors.
It also found that `discovery-review.md` mixed an applied status summary with raw `latest.json` counts, and historical `review-result-*.json` packets could not be safely replayed directly after claim IDs changed.

## Correct Behavior

Given Cautilus describes product ownership, when the context is claim discovery or claim review, then it may say the binary avoids direct LLM-provider calls and the skill owns LLM-backed claim review.
Given Cautilus describes `eval` or `optimize`, then it should allow adapter-owned runners to exercise model-involving behavior.
Given a human worksheet is rendered from an applied claim packet, then the visible counts and "Claims packet" label should come from that same packet.
Given historical review-result packets are replayed into a refreshed claim map, then stale claim IDs should be filtered by an explicit helper rather than by an ad hoc shell snippet.

## Observed Facts

- `docs/contracts/claim-discovery-workflow.md` still said "The binary stays deterministic and provider-neutral" in an over-worry section.
- `skills/cautilus/SKILL.md` and `plugins/cautilus/skills/cautilus/SKILL.md` said "LLM-backed review work" in the global Product Shape section.
- `package.json` rendered `claims:review-worksheet` from `.cautilus/claims/latest.json` while the status report and HITL state used `.cautilus/claims/evidenced-typed-runners.json`.
- Historical review-result packets contain stale claim IDs, which is acceptable as audit history but unsafe for direct replay.

## Reproduction

1. Render the claim worksheet with `.cautilus/claims/latest.json` and `.cautilus/claims/status-summary.json`.
2. Compare audience counts with `.cautilus/claims/claim-status-report.md`.
3. Inspect the Product Shape section in the bundled and packaged Cautilus skill.
4. Try to apply an older review-result packet with stale claim IDs directly to the current claim map.

## Candidate Causes

- The first boundary fix narrowed the Fixed Decisions section but missed other prose claims that discovery can surface independently.
- The skill Product Shape text compressed claim review, eval, and optimize into one global ownership sentence.
- The worksheet script trusted the status packet's input path for display but grouped the claims packet passed on the command line.
- Historical review-result replay had become a local operator pattern instead of a product-owned helper.

## Hypothesis

If all global ownership prose is narrowed to claim review, and the worksheet plus review-result replay commands use the applied packet explicitly, then the next HITL reviewer sees coherent counts and no longer has to know the ad hoc stale-ID filtering trick.

## Verification

Pending after repair:
run node tests for the new helper, rerender claim artifacts, validate the claim packet, then run `npm run verify`, `npm run test:on-demand`, and `npm run hooks:check`.

## Root Cause

The prior slice corrected the exact HITL claim but did not search for equivalent standalone prose claims and operator scripts that could recreate the same misunderstanding.

## Seam Risk

- Interrupt ID: claim-review-boundary-artifacts
- Risk Class: none
- Seam: claim-review product prose and claim artifact replay
- Disproving Observation: skill and contract prose now scope LLM-backed review to claim review, worksheet counts come from the applied packet, and stale historical review-results are replayed through an explicit filter helper.
- What Local Reasoning Cannot Prove: whether future review-result packets should carry source packet fingerprints and let the binary provide first-class historical replay.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

When a HITL correction narrows a product boundary, grep for adjacent global prose and operator scripts that could restate the old boundary even if the exact claim was fixed.
