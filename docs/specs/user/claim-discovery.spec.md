# Claim Discovery

Using `cautilus claim` and the bundled skill, a user can discover behavior promises from the repo docs selected for claim discovery and turn them into a reviewable next-work map.

## A user can discover declared behavior promises from selected repo docs.

`claim discover` starts from configured entry documents and linked Markdown, records the effective discovery boundary, and emits a proof plan instead of an unscoped narrative.
The latest selected status packet is projected here instead of rerunning discovery during every specdown pass.

```run:shell
# Show the discovery boundary from the latest selected claim status packet.
node -e 'const fs=require("fs"); const p=JSON.parse(fs.readFileSync(".cautilus/claims/status-summary.json","utf8")); console.log(JSON.stringify({schemaVersion:p.schemaVersion, sourceCount:p.sourceCount, candidateCount:p.candidateCount, discoveryBoundary:p.discoveryBoundary}, null, 2));'
```

> check:cautilus-json-file
| path | json_path | equals | min_number |
| --- | --- | --- | --- |
| .cautilus/claims/status-summary.json | schemaVersion | cautilus.claim_status_summary.v1 | |
| .cautilus/claims/status-summary.json | sourceCount | | 1 |
| .cautilus/claims/status-summary.json | discoveryBoundary.entries[0] | | |

## The claim packet is a proof plan, not a verdict.

The status summary keeps the non-verdict boundary visible so users do not confuse discovery with proof.

> check:cautilus-json-file
| path | json_path | includes |
| --- | --- | --- |
| .cautilus/claims/status-summary.json | nonVerdictNotice | proof plan, not proof |

## The binary routes discovered claims into next-work buckets before fixture work starts.

The latest claim evidence bundle records that `claim discover` emits source-ref-backed candidates with human-auditable, deterministic, and Cautilus-eval proof routes before any fixture writer is involved.

```run:shell
# Show the current next-work buckets from the latest selected claim status packet.
node -e 'const fs=require("fs"); const p=JSON.parse(fs.readFileSync(".cautilus/claims/status-summary.json","utf8")); console.log(JSON.stringify(p.actionSummary.primaryBuckets.map(({id,count,recommendedActor,summary})=>({id,count,recommendedActor,summary})), null, 2));'
```

> check:cautilus-json-file
| path | json_path | equals | includes |
| --- | --- | --- | --- |
| .cautilus/claims/evidence-claim-discover-proof-routing-2026-05-03.json | schemaVersion | cautilus.claim_evidence_bundle.v1 | |
| .cautilus/claims/evidence-claim-discover-proof-routing-2026-05-03.json | decision.evidenceStatus | satisfied | |
| .cautilus/claims/evidence-claim-discover-proof-routing-2026-05-03.json | summary | | proof routes |

## The bundled skill can curate the packet into a reviewable next-work map.

The latest skill evidence shows the bundled skill reading the claim packet and grouping next work by review, deterministic proof, Cautilus eval planning, alignment, and split-or-defer branches.

> check:cautilus-json-file
| path | json_path | equals | includes |
| --- | --- | --- | --- |
| .cautilus/claims/evidence-claim-packet-next-work-grouping-2026-05-03.json | decision.evidenceStatus | satisfied | |
| .cautilus/claims/evidence-claim-packet-next-work-grouping-2026-05-03.json | summary | | group next work |
| .cautilus/claims/evidence-canonical-spec-curation-flow-2026-05-03.json | decision.evidenceStatus | satisfied | |
