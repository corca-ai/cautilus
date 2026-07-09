---
type: promise
---

# Reviewable Artifacts

After an agent runs a workflow, the user needs durable packets and readable views that another person or agent can reopen without trusting chat memory.
Using Cautilus CLI packet outputs and the `cautilus-agent` skill, every workflow should leave machine-readable state and readable reports for later review.
Each subclaim below regenerates its packet or view live on every `npm run lint:specs` and asserts on the fresh output, instead of projecting a saved evidence bundle.

Governed by [governed-by::Reviewable Artifacts](../rules/reviewable-artifacts.spec.md) and [governed-by::Packet Freshness](../rules/packet-freshness.spec.md).
Implemented by [implemented-by::Evidence State And Review Artifacts](../contracts/evidence-state-artifacts.spec.md), [implemented-by::Reporting And Review Variants](../contracts/reporting-review-variants.spec.md), and [implemented-by::Active Run And Workspace Lifecycle](../contracts/active-run-workspace.spec.md).

## A user or agent can reopen JSON packets as the audit source of truth.

Core command surfaces emit schema-versioned packets with state summaries, next branches, git state, validation state, and eval planning state.
The checks below re-run those commands live and assert on the fresh stdout packets.

```run:shell -> $canon
# Resolve this repo's canonical claim proof-plan packet (kept fresh by claims:refresh:all).
jq -r '.inputPath' .cautilus/claims/status-summary.json
```

```run:shell
# Show the four packet surfaces emitted fresh from the current repo and canonical packet.
./bin/cautilus doctor status --repo-root . --format json | jq '{schemaVersion, mode}'
./bin/cautilus discover claims status --input "${canon}" --format json | jq '{schemaVersion, candidateCount}'
./bin/cautilus discover claims validate --claims "${canon}" --format json | jq '{schemaVersion, valid}'
./bin/cautilus evaluate claims plan --claims "${canon}" --allow-stale-claims --format json | jq '{schemaVersion}'
```

### Agent orientation packet: next branches and git/claim state

> check:cautilus-json-command(command=cautilus doctor status --repo-root . --format json)
| path | equals | includes | min_number |
| --- | --- | --- | --- |
| schemaVersion | cautilus.agent_status.v1 | | |
| mode | orientation | | |
| notice | | before running discovery, evaluation, review, improvement, edits, or commits | |
| nextBranches.length | | | 1 |

### Claim status summary: state summary and git state

> check:cautilus-json-command(command=cautilus discover claims status --input ${canon} --format json)
| path | equals | includes | min_number |
| --- | --- | --- | --- |
| schemaVersion | cautilus.claim_status_summary.v1 | | |
| candidateCount | | | 1 |
| nonVerdictNotice | | Discovery creates candidates | |
| gitStateSnapshotNotice | | gitState is computed when this status packet is generated | |

### Claim validation report: validation state

> check:cautilus-json-command(command=cautilus discover claims validate --claims ${canon} --format json)
| path | equals |
| --- | --- |
| schemaVersion | cautilus.claim_validation_report.v1 |
| valid | true |

### Claim eval plan: eval planning state

> check:cautilus-json-command(command=cautilus evaluate claims plan --claims ${canon} --allow-stale-claims --format json)
| path | equals | includes |
| --- | --- | --- |
| schemaVersion | cautilus.claim_eval_plan.v1 | |
| nonWriterNotice | | plans eval fixtures but does not write host-owned fixtures |

## A user can read generated views without losing the packet source of truth.

Readable views are generated from the machine-readable packets and keep the JSON packet as the audit source rather than replacing it.
The checks below render two readable views live from the canonical packets and confirm each view states that the JSON packet remains the audit source, while the source packet stays a valid machine-readable proof plan.

```run:shell
$ sh -lc 'canon="$(jq -r ".inputPath" .cautilus/claims/status-summary.json)"; out="$(mktemp -d)"; node scripts/agent-runtime/render-claim-status-report.mjs --claims "$canon" --status .cautilus/claims/status-summary.json --output "$out/report.md" >/dev/null; grep -q "Use the JSON packets as the audit source" "$out/report.md" && echo status-report-notice-present'
status-report-notice-present
```

```run:shell
$ sh -lc 'canon="$(jq -r ".inputPath" .cautilus/claims/status-summary.json)"; out="$(mktemp -d)"; node scripts/agent-runtime/render-claim-discovery-review.mjs --claims "$canon" --status .cautilus/claims/status-summary.json --output "$out/review.md" >/dev/null; grep -q "The JSON packet is the audit source" "$out/review.md" && echo discovery-review-notice-present'
discovery-review-notice-present
```

The packet the views were rendered from is still a machine-readable proof plan, so the readable views are projections over it rather than the source of truth.

> check:cautilus-json-file
| path | json_path | equals | min_number |
| --- | --- | --- | --- |
| .cautilus/claims/evidenced-typed-runners.json | schemaVersion | cautilus.claim_proof_plan.v1 | |
| .cautilus/claims/evidenced-typed-runners.json | candidateCount | | 1 |

## A user can see stale, blocked, and missing evidence in report views.

The status report makes evidence gaps visible: stale evidence as a cross-cutting signal, blocked claims and missing-proof claims as next-action buckets.
The check below regenerates the status summary live over a packet seeded with one stale-evidence candidate (mutated from the canonical packet, which already carries blocked and missing-proof claims), so all three gap states surface in one fresh report.

```run:shell -> $stale_packet
# Seed one stale-evidence candidate so the live status report must surface a stale signal
# alongside the blocked and missing-proof states the canonical packet already carries.
out=$(mktemp -d)
jq '(.claimCandidates[0].evidenceStatus) = "stale"' "${canon}" > "$out/claims-stale.json"
printf '%s\n' "$out/claims-stale.json"
```

The rendered status report view shows the stale signal in human-readable text, not only in the packet.

```run:shell
$ sh -lc 'canon="$(jq -r ".inputPath" .cautilus/claims/status-summary.json)"; out="$(mktemp -d)"; jq "(.claimCandidates[0].evidenceStatus)=\"stale\"" "$canon" > "$out/stale.json"; ./bin/cautilus discover claims status --input "$out/stale.json" --output "$out/status.json" >/dev/null 2>&1; node scripts/agent-runtime/render-claim-status-report.mjs --claims "$out/stale.json" --status "$out/status.json" --output "$out/report.md" >/dev/null 2>&1; grep -q "Cross-cutting signal: stale-evidence" "$out/report.md" && echo report-shows-stale'
report-shows-stale
```

The status summary packet behind that view buckets all three gap states together.

> check:cautilus-json-command(command=cautilus discover claims status --input ${stale_packet} --format json)
| path | equals |
| --- | --- |
| schemaVersion | cautilus.claim_status_summary.v1 |
| actionSummary.crossCuttingSignals[id=stale-evidence].id | stale-evidence |
| actionSummary.primaryBuckets[id=split-or-defer].id | split-or-defer |
| actionSummary.primaryBuckets[id=agent-add-deterministic-proof].id | agent-add-deterministic-proof |
