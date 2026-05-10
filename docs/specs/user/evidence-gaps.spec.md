# Evidence Gaps

When Cautilus finds or reviews a promise, the user needs to see whether evidence actually supports it or whether work is still missing.
Using the `cautilus claim show` CLI command and the `cautilus-agent` skill, discovered or reviewed promises stay unsatisfied until valid evidence is attached, and missing or weak evidence remains visible until the claim is proven, narrowed, deferred, or removed.

## A user can see that discovered promises still need evidence.

The claim status summary keeps the candidate-not-proof boundary visible to users.

```run:shell
# Show the candidate-not-proof status from the latest selected claim status packet.
jq '{schemaVersion, candidateCount, nonVerdictNotice}' .cautilus/claims/status-summary.json
```

> check:cautilus-json-file
| path | json_path | includes |
| --- | --- | --- |
| .cautilus/claims/status-summary.json | nonVerdictNotice | not proof |

## A user can see that reviewed claims still require valid evidence.

The current evidence-gap evidence records tests that keep validation summaries, evidence-gap buckets, and missing evidence visible.

```run:shell
# Show the report behaviors that keep missing and stale evidence visible.
jq '{bundleId, evidenceStatus: .decision.evidenceStatus, summary, protectedBehaviors: .commandEvidence[0].observed.protectedBehaviors}' .cautilus/claims/evidence-reviewable-proof-debt-reports-2026-05-03.json
```

> check:cautilus-json-file
| path | json_path | equals | includes |
| --- | --- | --- | --- |
| .cautilus/claims/evidence-reviewable-proof-debt-reports-2026-05-03.json | decision.evidenceStatus | satisfied | |
| .cautilus/claims/evidence-reviewable-proof-debt-reports-2026-05-03.json | summary | | missing evidence |
| .cautilus/claims/evidence-reviewable-proof-debt-reports-2026-05-03.json | commandEvidence[0].observed.protectedBehaviors[0] | | JSON packets |

## A user can keep missing or weak evidence visible as next work.

The current status packet exposes evidence satisfaction counts, action buckets, and stale-evidence signals instead of hiding unknown or stale proof.
The generated claim Evidence State projection is the human-readable view over that packet, so proof docs do not need to copy raw backlog counts by hand.

```run:shell
# Show the current evidence satisfaction and next-work signals from the latest selected claim status packet.
jq '{evidenceSatisfaction, primaryBuckets: [.actionSummary.primaryBuckets[] | {id, count, recommendedActor, summary}], crossCuttingSignals: .actionSummary.crossCuttingSignals}' .cautilus/claims/status-summary.json
```

> check:cautilus-json-file
| path | json_path | exists | min_number | includes |
| --- | --- | --- | --- | --- |
| .cautilus/claims/status-summary.json | evidenceSatisfaction.satisfiedClaimCount | | 1 | |
| .cautilus/claims/status-summary.json | actionSummary.primaryBuckets[0].id | yes | | |
| .cautilus/claims/status-summary.json | actionSummary.crossCuttingSignals[0].summary | | | Review heuristic labels |

```run:shell
# Show the generated Evidence State projection for open Cautilus proof work.
jq '{schemaVersion, sourceOfTruth, openCautilusEval}' .cautilus/claims/evidence-state.json
```

> check:cautilus-json-file
| path | json_path | equals | exists | min_number |
| --- | --- | --- | --- | --- |
| .cautilus/claims/evidence-state.json | schemaVersion | cautilus.claim_evidence_state.v1 | | |
| .cautilus/claims/evidence-state.json | sourceOfTruth.claimsPacket | .cautilus/claims/evidenced-typed-runners.json | | |
| .cautilus/claims/evidence-state.json | openCautilusEval.total | | | 1 |
| .cautilus/claims/evidence-state.json | openCautilusEval.readyForProof | | | 1 |
| .cautilus/claims/evidence-state.json | actionBuckets[0].id | | yes | |
