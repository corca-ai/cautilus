# Bounded Optimization

Using `cautilus optimize` and bundled-skill guidance, a user can improve a selected behavior target while preserving intent, explicit budget, protected checks, held-out evidence, and reviewable revision artifacts.

## A user starts optimization from explicit claim, eval, and target packets rather than an open-ended retry loop.

The current optimization evidence is attached to explicit optimize input, proposal, search result, and revision artifact examples rather than to an open-ended retry loop.
The latest selected optimize evidence is projected here instead of rerunning expensive optimize work during every specdown pass.

```run:shell
# Show the selected optimize route and the packet examples that bound it.
jq -n --slurpfile evidence .cautilus/claims/evidence-optimize-held-out-route-2026-05-03.json --slurpfile input fixtures/optimize/example-input.json '{bundleId: $evidence[0].bundleId, evidenceStatus: $evidence[0].decision.evidenceStatus, optimizationTarget: $input[0].optimizationTarget, intent: $input[0].intentProfile.summary, reportRecommendation: $input[0].report.recommendation, budget: $input[0].optimizer.budget}'
```

> check:cautilus-json-file
| path | json_path | equals |
| --- | --- | --- |
| .cautilus/claims/evidence-optimize-held-out-route-2026-05-03.json | schemaVersion | cautilus.claim_evidence_bundle.v1 |
| .cautilus/claims/evidence-optimize-held-out-route-2026-05-03.json | decision.evidenceStatus | satisfied |
| fixtures/optimize/example-input.json | schemaVersion | cautilus.optimize_inputs.v1 |

## A user can improve behavior while preserving protected checks, held-out evidence, and explicit budget.

The selected on-demand evidence proves a bounded route that carries held-out results into search input and evaluates candidate mutations through eval-test backed held-out and full-gate checks.

```run:shell
# Show the protected optimize behaviors proven by the latest selected evidence bundle.
jq '[.commandEvidence[] | {command, protectedBehaviors: .observed.protectedBehaviors}]' .cautilus/claims/evidence-optimize-held-out-route-2026-05-03.json
```

> check:cautilus-json-file
| path | json_path | includes |
| --- | --- | --- |
| .cautilus/claims/evidence-optimize-held-out-route-2026-05-03.json | commandEvidence[0].observed.protectedBehaviors[1] | held-out |
| .cautilus/claims/evidence-optimize-held-out-route-2026-05-03.json | commandEvidence[0].observed.protectedBehaviors[2] | eval-test |
| .cautilus/claims/evidence-optimize-held-out-route-2026-05-03.json | summary | bounded optimize route |

## A user gets a reviewable revision artifact before applying a change.

Optimization produces a proposal and revision artifact that preserve source files, stop conditions, prioritized evidence, and follow-up checks.

```run:shell
# Show the proposal and revision fields a reviewer can reopen before applying a change.
jq -n --slurpfile proposal fixtures/optimize/example-proposal.json --slurpfile revision fixtures/optimize/example-revision-artifact.json '{proposal: {schemaVersion: $proposal[0].schemaVersion, decision: $proposal[0].decision, prioritizedEvidence: [$proposal[0].prioritizedEvidence[] | {source, key, severity}], suggestedChanges: [$proposal[0].suggestedChanges[] | {id, changeKind, target}]}, revision: {schemaVersion: $revision[0].schemaVersion, stopConditions: $revision[0].stopConditions, followUpChecks: $revision[0].followUpChecks}}'
```

> check:cautilus-json-file
| path | json_path | equals | exists |
| --- | --- | --- | --- |
| fixtures/optimize/example-proposal.json | schemaVersion | cautilus.optimize_proposal.v1 | |
| fixtures/optimize/example-revision-artifact.json | schemaVersion | cautilus.revision_artifact.v1 | |
| fixtures/optimize/example-revision-artifact.json | stopConditions | | yes |
| fixtures/optimize/example-revision-artifact.json | followUpChecks | | yes |
