# Debug Review: deterministic proof overclaim
Date: 2026-05-03

## Problem

During the remaining deterministic proof slice, the first draft evidence bundle and review result would have marked broad or indirectly covered claims as `satisfied`.
A fresh-eye reviewer reported that several boundaries were not directly proven: no-runner `eval evaluate`, missing specdown readiness, cost telemetry provenance, doctor/agent-status parity, broad reviewability, runner definition, and report command execution.

## Correct Behavior

Given a claim is marked `evidenceStatus=satisfied`, when another agent replays the evidence bundle, then the evidence must directly prove that claim boundary.
Given a claim is broad, definitional, future-facing, or only partially covered by sub-surface tests, then the claim should remain unknown, blocked, needs-alignment, or split/deferred instead of receiving a broad satisfied verdict.

## Observed Facts

- The first local draft evidence bundle included claims that the reviewer classified as partial, too broad, or requiring new guards.
- The reviewer specifically flagged overclaim risk for `claim-docs-cli-reference-md-270`, `claim-docs-specs-user-index-spec-md-25`, `claim-docs-contracts-claim-discovery-workflow-md-96`, `claim-docs-contracts-reporting-md-108`, and `claim-docs-specs-user-doctor-readiness-spec-md-12`.
- The reviewer recommended splitting or reclassifying `claim-docs-specs-user-reviewable-artifacts-spec-md-7` and `claim-docs-contracts-runner-readiness-md-55`.
- The reviewer also found that `claim-docs-contracts-reporting-md-50` had preservation proof for supplied command observations, but not end-to-end proof that Cautilus executes adapter-defined mode commands and writes those observations into report input.
- The corrected review result leaves the broad reviewability, runner-definition, report-command-execution, and future workbench chooser claims unsatisfied.

## Reproduction

The overclaim can be reproduced conceptually by applying a review result that attaches one broad bundle to the remaining deterministic claims without checking each claim boundary against direct tests.

The corrected packet was checked with:

```bash
./bin/cautilus claim review apply-result --claims .cautilus/claims/evidenced-typed-runners.json --review-result .cautilus/claims/review-result-current-deterministic-proof-batch-2026-05-03.json --output /tmp/cautilus-current-deterministic-applied.json
./bin/cautilus claim validate --input /tmp/cautilus-current-deterministic-applied.json --output /tmp/cautilus-current-deterministic-validation.json
```

## Candidate Causes

- A single broad evidence bundle made it too easy to treat adjacent proof as direct proof.
- The remaining deterministic bucket mixed narrow packet/CLI behavior claims with definitional and future-facing prose.
- Some existing tests proved nearby mechanics but not the exact wording of the claim.

## Hypothesis

If the missing direct guards are added and the broad claims are reclassified instead of satisfied, then the deterministic proof bucket should disappear without turning unproven broad claims into satisfied claims.

## Verification

- Added focused guards for no-runner `eval evaluate`, missing specdown claim-doc readiness versus raw packet validation, doctor/agent-status readiness parity, and explicit cost telemetry provenance.
- Committed those guard tests in `ed2b69618b81ea91247eafd54da7671c9315d093` before recording them as checked-in evidence.
- Rewrote `.cautilus/claims/evidence-current-deterministic-proof-batch-2026-05-03.json` to list only narrow directly proven claims.
- Rewrote `.cautilus/claims/review-result-current-deterministic-proof-batch-2026-05-03.json` so broad reviewability, runner-definition, report-command-execution, and future chooser claims remain unsatisfied or aligned/deferred.
- Replayed the corrected review result and validation; the validation report was `valid=true` with zero issues.
- Regenerated `.cautilus/claims/evidenced-typed-runners.json`, status summary, eval plan, canonical map, and claim status report.
- The `agent-add-deterministic-proof` primary action bucket is no longer present; one deterministic claim remains unknown but is `needs-alignment`, not ready deterministic proof debt.

## Root Cause

The evidence authoring pass treated a cluster of nearby deterministic checks as sufficient proof for every remaining deterministic-looking sentence.
That collapsed distinct boundaries: direct CLI packet behavior, setup/readiness behavior, report materialization ownership, broad reviewability promises, and future UI/workbench direction.

## Seam Risk

- Interrupt ID: deterministic-proof-overclaim
- Risk Class: evidence-boundary-risk
- Seam: hand-authored claim evidence bundles and review-result application
- Disproving Observation: independent review found claims whose wording required stronger proof or reclassification than the first bundle provided.
- What Local Reasoning Cannot Prove: whether future broad claim batches will always be decomposed before evidence application.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

For each new satisfied review update, ask whether the evidence proves the exact sentence or only a nearby sub-surface.
If the answer is nearby sub-surface, split the claim or leave it unknown.
When a remaining bucket mixes narrow and broad claims, use fresh-eye review before applying the result packet.

## Related Prior Incidents

- `debug-2026-05-03-claim-evidence-replay-provenance.md`: evidence bundle provenance mixed dirty-tree proof and stale replay metadata.
