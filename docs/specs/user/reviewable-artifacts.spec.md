# Reviewable Artifacts

After an agent runs a workflow, the user needs durable packets and readable views that another person or agent can reopen without trusting chat memory.
Using Cautilus CLI packet outputs and the `cautilus-agent` skill, every workflow should leave machine-readable state and readable projections for later review.

## A user or agent can reopen JSON packets as the audit source of truth.

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

## A user can read projected views without losing the packet source of truth.

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

## A user can see stale, blocked, and missing evidence in report views.

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
