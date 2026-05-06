# Evidence Gaps

Discovered or reviewed promises should not be treated as satisfied until valid evidence is attached, and missing or weak evidence should remain visible until the claim is proven, narrowed, deferred, or removed.

## A claim packet is a work plan, not a certificate.

The claim status summary keeps the proof-plan boundary visible to users.

```run:shell
# Show the non-verdict boundary from the latest selected claim status packet.
node -e 'const fs=require("fs"); const p=JSON.parse(fs.readFileSync(".cautilus/claims/status-summary.json","utf8")); console.log(JSON.stringify({schemaVersion:p.schemaVersion, candidateCount:p.candidateCount, nonVerdictNotice:p.nonVerdictNotice}, null, 2));'
```

> check:cautilus-json-file
| path | json_path | includes |
| --- | --- | --- |
| .cautilus/claims/status-summary.json | nonVerdictNotice | proof plan, not proof |

## A reviewed claim cannot become satisfied without valid evidence.

The current evidence-gap evidence records tests that keep validation summaries, evidence-gap buckets, and missing evidence visible.

```run:shell
# Show the report behaviors that keep missing and stale evidence visible.
node -e 'const fs=require("fs"); const p=JSON.parse(fs.readFileSync(".cautilus/claims/evidence-reviewable-proof-debt-reports-2026-05-03.json","utf8")); console.log(JSON.stringify({bundleId:p.bundleId, evidenceStatus:p.decision.evidenceStatus, summary:p.summary, protectedBehaviors:p.commandEvidence[0].observed.protectedBehaviors}, null, 2));'
```

> check:cautilus-json-file
| path | json_path | equals | includes |
| --- | --- | --- | --- |
| .cautilus/claims/evidence-reviewable-proof-debt-reports-2026-05-03.json | decision.evidenceStatus | satisfied | |
| .cautilus/claims/evidence-reviewable-proof-debt-reports-2026-05-03.json | summary | | missing evidence |
| .cautilus/claims/evidence-reviewable-proof-debt-reports-2026-05-03.json | commandEvidence[0].observed.protectedBehaviors[0] | | JSON packets |

## Missing or weak evidence remains visible as next work.

The current status packet exposes evidence satisfaction counts, action buckets, and stale-evidence signals instead of hiding unknown or stale proof.

```run:shell
# Show the current evidence satisfaction and next-work signals from the latest selected claim status packet.
node -e 'const fs=require("fs"); const p=JSON.parse(fs.readFileSync(".cautilus/claims/status-summary.json","utf8")); console.log(JSON.stringify({evidenceSatisfaction:p.evidenceSatisfaction, primaryBuckets:p.actionSummary.primaryBuckets.map(({id,count,recommendedActor,summary})=>({id,count,recommendedActor,summary})), crossCuttingSignals:p.actionSummary.crossCuttingSignals}, null, 2));'
```

> check:cautilus-json-file
| path | json_path | exists | min_number | includes |
| --- | --- | --- | --- | --- |
| .cautilus/claims/status-summary.json | evidenceSatisfaction.satisfiedClaimCount | | 1 | |
| .cautilus/claims/status-summary.json | actionSummary.primaryBuckets[0].id | yes | | |
| .cautilus/claims/status-summary.json | actionSummary.crossCuttingSignals[0].summary | | | Review heuristic labels |
