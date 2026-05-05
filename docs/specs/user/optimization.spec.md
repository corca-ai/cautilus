# Bounded Optimization

Using `cautilus optimize` and bundled-skill guidance, a user can improve a selected behavior target while preserving intent, explicit budget, protected checks, held-out evidence, and reviewable revision artifacts.

## Acceptance Criteria

### Optimization starts only after the claim and eval proof surface are explicit.

The current optimization evidence is attached to explicit optimize input, proposal, search result, and revision artifact examples rather than to an open-ended retry loop.

> check:cautilus-json-file
| path | json_path | equals |
| --- | --- | --- |
| .cautilus/claims/evidence-optimize-held-out-route-2026-05-03.json | schemaVersion | cautilus.claim_evidence_bundle.v1 |
| .cautilus/claims/evidence-optimize-held-out-route-2026-05-03.json | decision.evidenceStatus | satisfied |
| fixtures/optimize/example-input.json | schemaVersion | cautilus.optimize_inputs.v1 |

### The improvement loop preserves protected checks and held-out evidence.

The selected on-demand evidence proves a bounded route that carries held-out results into search input and evaluates candidate mutations through eval-test backed held-out and full-gate checks.

> check:cautilus-json-file
| path | json_path | includes |
| --- | --- | --- |
| .cautilus/claims/evidence-optimize-held-out-route-2026-05-03.json | commandEvidence[0].observed.protectedBehaviors[1] | held-out |
| .cautilus/claims/evidence-optimize-held-out-route-2026-05-03.json | commandEvidence[0].observed.protectedBehaviors[2] | eval-test |
| .cautilus/claims/evidence-optimize-held-out-route-2026-05-03.json | summary | bounded optimize route |

### The user gets a reviewable revision artifact before applying a change.

Optimization produces a proposal and revision artifact that preserve source files, stop conditions, prioritized evidence, and follow-up checks.

> check:cautilus-json-file
| path | json_path | equals | exists |
| --- | --- | --- | --- |
| fixtures/optimize/example-proposal.json | schemaVersion | cautilus.optimize_proposal.v1 | |
| fixtures/optimize/example-revision-artifact.json | schemaVersion | cautilus.revision_artifact.v1 | |
| fixtures/optimize/example-revision-artifact.json | stopConditions | | yes |
| fixtures/optimize/example-revision-artifact.json | followUpChecks | | yes |
