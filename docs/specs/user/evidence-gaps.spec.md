# Evidence Gaps

Discovered or reviewed promises should not be treated as satisfied until valid evidence is attached, and missing or weak evidence should remain visible until the claim is proven, narrowed, deferred, or removed.

## A user can see that discovered promises still need evidence.

The claim status summary keeps the proof-plan boundary visible to users.

```run:shell
# Show the non-verdict boundary from the latest selected claim status packet.
jq '{schemaVersion, candidateCount, nonVerdictNotice}' .cautilus/claims/status-summary.json
```

> check:cautilus-json-file
| path | json_path | includes |
| --- | --- | --- |
| .cautilus/claims/status-summary.json | nonVerdictNotice | proof plan, not proof |

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
