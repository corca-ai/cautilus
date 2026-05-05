# Evidence Gaps

Discovered or reviewed promises should not be treated as satisfied until valid evidence is attached, and missing or weak evidence should remain visible until the claim is proven, narrowed, deferred, or removed.

## Acceptance Criteria

### A claim packet is a work plan, not a certificate.

The claim status summary keeps the proof-plan boundary visible to users.

> check:cautilus-json-file
| path | json_path | includes |
| --- | --- | --- |
| .cautilus/claims/status-summary.json | nonVerdictNotice | proof plan, not proof |

### A reviewed claim cannot become satisfied without valid evidence.

The current proof-debt evidence records tests that keep validation summaries, proof-debt buckets, and missing evidence visible.

> check:cautilus-json-file
| path | json_path | equals | includes |
| --- | --- | --- | --- |
| .cautilus/claims/evidence-reviewable-proof-debt-reports-2026-05-03.json | decision.evidenceStatus | satisfied | |
| .cautilus/claims/evidence-reviewable-proof-debt-reports-2026-05-03.json | summary | | proof debt |
| .cautilus/claims/evidence-reviewable-proof-debt-reports-2026-05-03.json | commandEvidence[0].observed.protectedBehaviors[0] | | JSON packets |

### Missing or weak evidence remains visible as next work.

The current status packet exposes evidence satisfaction counts, action buckets, and stale-evidence signals instead of hiding unknown or stale proof.

> check:cautilus-json-file
| path | json_path | exists | min_number | includes |
| --- | --- | --- | --- | --- |
| .cautilus/claims/status-summary.json | evidenceSatisfaction.satisfiedClaimCount | | 1 | |
| .cautilus/claims/status-summary.json | actionSummary.primaryBuckets[0].id | yes | | |
| .cautilus/claims/status-summary.json | actionSummary.crossCuttingSignals[0].summary | | | Review heuristic labels |
