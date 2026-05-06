# Reviewable Artifacts

Every Cautilus workflow should leave machine-readable packets and readable views that another person or agent can reopen.

## JSON packets remain the audit source of truth.

Core command surfaces emit schema-versioned packets with state summaries, next branches, git state, validation state, and eval planning state.

```run:shell
# Show durable packet surfaces from the latest selected evidence bundle.
jq '[.commandEvidence[] | {command, observed}]' .cautilus/claims/evidence-durable-packets-2026-05-03.json
```

> check:cautilus-json-file
| path | json_path | equals | includes |
| --- | --- | --- | --- |
| .cautilus/claims/evidence-durable-packets-2026-05-03.json | decision.evidenceStatus | satisfied | |
| .cautilus/claims/evidence-durable-packets-2026-05-03.json | summary | | structured Cautilus packets |

## Readable views project packet state instead of becoming a separate truth source.

The projection matrix and renderer tests cover the shipped readable artifact families and preserve JSON packets or source artifacts as the audit source.

```run:shell
# Show the readable projection behaviors proven by the latest selected evidence bundle.
jq '[.commandEvidence[] | {command, observed}]' .cautilus/claims/evidence-reviewable-artifact-projections-2026-05-03.json
```

> check:cautilus-json-file
| path | json_path | equals | includes |
| --- | --- | --- | --- |
| .cautilus/claims/evidence-reviewable-artifact-projections-2026-05-03.json | decision.evidenceStatus | satisfied | |
| .cautilus/claims/evidence-reviewable-artifact-projections-2026-05-03.json | checkedInEvidence[0].kind | reviewable-artifact-projection-matrix | |
| .cautilus/claims/evidence-reviewable-artifact-projections-2026-05-03.json | summary | | machine-readable packets |

## Report views make stale, blocked, and missing evidence visible.

The status-report evidence covers evidence-gap buckets, validation summaries, refresh-plan currentness, and separate comment packets for human review.

```run:shell
# Show the stale, blocked, and missing evidence behaviors proven by the latest selected report evidence.
jq '[.commandEvidence[] | {command, observed}]' .cautilus/claims/evidence-reviewable-proof-debt-reports-2026-05-03.json
```

> check:cautilus-json-file
| path | json_path | equals | includes |
| --- | --- | --- | --- |
| .cautilus/claims/evidence-reviewable-proof-debt-reports-2026-05-03.json | decision.evidenceStatus | satisfied | |
| .cautilus/claims/evidence-reviewable-proof-debt-reports-2026-05-03.json | commandEvidence[0].observed.protectedBehaviors[2] | | stale state |
| .cautilus/claims/evidence-reviewable-proof-debt-reports-2026-05-03.json | commandEvidence[0].observed.protectedBehaviors[5] | | separate JSON packet |
