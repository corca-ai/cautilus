# Bounded Improvement

When a behavior target needs improvement, the user needs bounded search that preserves intent, budget, protected checks, and reviewable changes.
Using the `cautilus improve` CLI command and the `cautilus-agent` skill, a user can improve a selected behavior target while preserving held-out evidence and revision artifacts.

## A user starts improvement from explicit claim, eval, and target packets rather than an open-ended retry loop.

The current improvement evidence is attached to explicit improve input, proposal, search result, and revision artifact examples rather than to an open-ended retry loop.
The latest selected improve evidence is shown here instead of rerunning expensive improve work during every report check.

```run:shell
# Show the selected improve route and the packet examples that bound it.
jq -n --slurpfile evidence .cautilus/claims/evidence-optimize-held-out-route-2026-05-03.json --slurpfile input fixtures/improve/example-input.json '{bundleId: $evidence[0].bundleId, evidenceStatus: $evidence[0].decision.evidenceStatus, improvementTarget: $input[0].improvementTarget, intent: $input[0].intentProfile.summary, reportRecommendation: $input[0].report.recommendation, budget: $input[0].improver.budget}'
```

> check:cautilus-json-file
| path | json_path | equals |
| --- | --- | --- |
| .cautilus/claims/evidence-optimize-held-out-route-2026-05-03.json | schemaVersion | cautilus.claim_evidence_bundle.v1 |
| .cautilus/claims/evidence-optimize-held-out-route-2026-05-03.json | decision.evidenceStatus | satisfied |
| fixtures/improve/example-input.json | schemaVersion | cautilus.improve_inputs.v1 |

## A user can improve behavior while preserving protected checks, held-out evidence, and explicit budget.

The selected on-demand evidence proves a bounded route that carries held-out results into search input and evaluates candidate mutations through eval-test backed held-out and full-gate checks.

```run:shell
# Show the protected improve behaviors proven by the latest selected evidence bundle.
jq '[.commandEvidence[] | {command, protectedBehaviors: .observed.protectedBehaviors}]' .cautilus/claims/evidence-optimize-held-out-route-2026-05-03.json
```

> check:cautilus-json-file
| path | json_path | includes |
| --- | --- | --- |
| .cautilus/claims/evidence-optimize-held-out-route-2026-05-03.json | commandEvidence[0].observed.protectedBehaviors[1] | held-out |
| .cautilus/claims/evidence-optimize-held-out-route-2026-05-03.json | commandEvidence[0].observed.protectedBehaviors[2] | eval-test |
| .cautilus/claims/evidence-optimize-held-out-route-2026-05-03.json | summary | bounded optimize route |

## A user gets a reviewable revision artifact before applying a change.

Improvement produces a proposal and revision artifact that preserve source files, stop conditions, prioritized evidence, and follow-up checks.

```run:shell
# Show the proposal and revision fields a reviewer can reopen before applying a change.
jq -n --slurpfile proposal fixtures/improve/example-proposal.json --slurpfile revision fixtures/improve/example-revision-artifact.json '{proposal: {schemaVersion: $proposal[0].schemaVersion, decision: $proposal[0].decision, prioritizedEvidence: [$proposal[0].prioritizedEvidence[] | {source, key, severity}], suggestedChanges: [$proposal[0].suggestedChanges[] | {id, changeKind, target}]}, revision: {schemaVersion: $revision[0].schemaVersion, stopConditions: $revision[0].stopConditions, followUpChecks: $revision[0].followUpChecks}}'
```

> check:cautilus-json-file
| path | json_path | equals | exists |
| --- | --- | --- | --- |
| fixtures/improve/example-proposal.json | schemaVersion | cautilus.improve_proposal.v1 | |
| fixtures/improve/example-revision-artifact.json | schemaVersion | cautilus.revision_artifact.v1 | |
| fixtures/improve/example-revision-artifact.json | stopConditions | | yes |
| fixtures/improve/example-revision-artifact.json | followUpChecks | | yes |
