# Claim Discovery

Using `cautilus claim` and the bundled skill, a user can turn declared repo promises into source-backed candidates and then decide which work belongs to deterministic proof, Cautilus eval planning, scenario design, or human alignment.

This is a proof-planning surface.
It does not prove that a discovered claim is true.

| question a user needs answered | owner | artifact |
| --- | --- | --- |
| Where did discovery look? | `claim discover` | `effectiveScanScope`, `sourceInventory`, `sourceGraph`, `discoveryBoundary` |
| How did a line become a candidate? | `claim discover` | `claimCandidates[].sourceRefs`, `claimFingerprint`, `recommendedProof`, `verificationReadiness`, `whyThisLayer` |
| What should happen next? | `claim show` | `actionSummary.primaryBuckets`, `sampleClaims`, `nonVerdictNotice` |
| Did an agent curate this well through the bundled skill? | dev/skill Cautilus eval | saved episode artifacts, audited by `cautilus_claim_discovery_curation_flow` |

## A user can audit the deterministic discovery boundary.

`claim discover` records the scan boundary and the claim-discovery engine in the saved proof-plan packet.
`claim show` projects that saved packet into a status summary without rescanning.

```run:shell
$ claims_path="$(jq -r '.inputPath' .cautilus/claims/status-summary.json)"; jq -r '"packet=" + $p, "proofPlan.schema=" + .schemaVersion, "engine.name=" + .discoveryEngine.name, "engine.ruleset=" + .discoveryEngine.ruleset, "engine.path=" + .discoveryEngine.implementationPath, "entries=" + (.effectiveScanScope.entries | join(",")), "traversal=" + .effectiveScanScope.traversal' --arg p "$claims_path" "$claims_path"
packet=.cautilus/claims/evidenced-typed-runners.json
proofPlan.schema=cautilus.claim_proof_plan.v1
engine.name=cautilus.claim_discovery
engine.ruleset=claim-discovery-rules.v4
engine.path=internal/runtime/claim_discovery.go
entries=README.md,AGENTS.md,CLAUDE.md
traversal=entry-markdown-links
```

The status summary keeps the non-verdict boundary visible, so a user does not mistake a candidate list for satisfied evidence.

```run:shell
$ jq -r '"summary.schema=" + .schemaVersion, "summary.inputPath=" + .inputPath, "summary.sourceBasis=" + .discoveryBoundary.sourceBasis, "summary.entries=" + (.discoveryBoundary.entries | join(",")), "summary.nonVerdict=" + .nonVerdictNotice' .cautilus/claims/status-summary.json
summary.schema=cautilus.claim_status_summary.v1
summary.inputPath=.cautilus/claims/evidenced-typed-runners.json
summary.sourceBasis=entry-docs-and-linked-markdown
summary.entries=README.md,AGENTS.md,CLAUDE.md
summary.nonVerdict=This packet is a proof plan, not proof that the claims are true.
```

> check:cautilus-json-file
| path | json_path | equals | min_number |
| --- | --- | --- | --- |
| .cautilus/claims/status-summary.json | schemaVersion | cautilus.claim_status_summary.v1 | |
| .cautilus/claims/status-summary.json | sourceCount | | 1 |
| .cautilus/claims/status-summary.json | discoveryBoundary.entries[0] | README.md | |

## A user can audit extraction from examples, not only prose.

The saved packet is the audit surface for extraction.
It shows the source excerpt, source line, normalized candidate, proof route, readiness, and next action chosen by the binary.

| source excerpt | signal used by `claim discover` | saved candidate result | note |
| --- | --- | --- | --- |
| `The skill should own routing, sequencing, guardrails...` from `AGENTS.md:78` | ownership-boundary language plus command discovery, help text, install smoke, and doctor/readiness terms | `deterministic`, `ready-to-verify`, source ref `AGENTS.md:78` | The candidate is source-backed, but the packet is still a plan. |
| `` `npm run test:on-demand` currently owns the heavier self-dogfood workflow script tests. `` from `AGENTS.md:123` | explicit test ownership and checked command name | `deterministic`, `ready-to-verify`, source ref `AGENTS.md:123` | The next proof belongs in ordinary repo gates, not a new eval. |
| `` `Cautilus` treats the context-recovery case as a protected scenario... `` from `README.md:179` | behavior-scenario language and context-recovery surface | `cautilus-eval`, `needs-scenario`, `app/chat` | The candidate needs scenario design before fixture planning. |

```run:shell
$ jq -r '.claimCandidates[] | select(.claimId=="claim-agents-md-78" or .claimId=="claim-agents-md-123" or .claimId=="claim-readme-md-179") | [.claimId, (.sourceRefs[0].path + ":" + (.sourceRefs[0].line|tostring)), .recommendedProof, .verificationReadiness, (.recommendedEvalSurface // "-")] | @tsv' .cautilus/claims/evidenced-typed-runners.json
claim-agents-md-78	AGENTS.md:78	deterministic	ready-to-verify	-
claim-agents-md-123	AGENTS.md:123	deterministic	ready-to-verify	-
claim-readme-md-179	README.md:179	cautilus-eval	needs-scenario	app/chat
```

The deterministic extractor uses Markdown text blocks outside code fences and frontmatter, filters out non-claim-shaped lines, classifies the remaining candidate, and merges identical normalized summaries by fingerprint.
The example below uses a tiny temporary repo so the de-duplication behavior is visible without relying on this repo to contain duplicate promises.

```run:shell
$ tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT; printf '%s\n' '# Demo' '' 'Input (for agent): run this command.' 'Users can run deterministic checks before review.' > "$tmp/README.md"; printf '%s\n' '# Demo' '' 'Users can run deterministic checks before review.' > "$tmp/AGENTS.md"; ./bin/cautilus claim discover --repo-root "$tmp" --output "$tmp/claims.json" >/dev/null; jq -r '"candidateCount=" + (.candidateCount|tostring), "sourceRefs=" + (.claimCandidates[0].sourceRefs | map(.path + ":" + (.line|tostring)) | join(",")), "summary=" + .claimCandidates[0].summary' "$tmp/claims.json"
candidateCount=1
sourceRefs=AGENTS.md:3,README.md:4
summary=Users can run deterministic checks before review.
```

```run:shell
# Show the deterministic functions behind the extraction example.
grep -q 'func claimTextBlocks' internal/runtime/claim_discovery.go
grep -q 'func claimLineLooksUseful' internal/runtime/claim_discovery.go
grep -q 'func classifyClaimLine' internal/runtime/claim_discovery.go
grep -q 'func mergeIdenticalClaimCandidates' internal/runtime/claim_discovery.go
```

> check:cautilus-json-file
| path | json_path | equals | includes |
| --- | --- | --- | --- |
| .cautilus/claims/evidence-claim-discover-proof-routing-2026-05-03.json | schemaVersion | cautilus.claim_evidence_bundle.v1 | |
| .cautilus/claims/evidence-claim-discover-proof-routing-2026-05-03.json | decision.evidenceStatus | satisfied | |
| .cautilus/claims/evidence-claim-discover-proof-routing-2026-05-03.json | commandEvidence[0].observed.notableAssertions[1] | | source-ref-backed claim candidates |
| .cautilus/claims/evidence-claim-discover-proof-routing-2026-05-03.json | commandEvidence[1].observed.byRecommendedProof.human-auditable | 1 | |
| .cautilus/claims/evidence-claim-discover-proof-routing-2026-05-03.json | commandEvidence[1].observed.byRecommendedProof.deterministic | 1 | |
| .cautilus/claims/evidence-claim-discover-proof-routing-2026-05-03.json | commandEvidence[1].observed.byRecommendedProof.cautilus-eval | 1 | |

## A user can inspect next-work buckets after discovery.

`claim show` owns the bucket summary.
It reads an existing proof-plan packet, groups candidates by the next action, and does not launch a reviewer, eval, edit, or commit.

| next-work bucket | actor | when it should be used |
| --- | --- | --- |
| `already-satisfied` | none | valid evidence is already attached under packet semantics |
| `agent-add-deterministic-proof` | agent | the claim needs unit, lint, build, schema, spec, or CI proof |
| `agent-plan-cautilus-eval` | agent | the claim is ready for Cautilus eval planning |
| `agent-design-scenario` | agent | the claim needs a concrete scenario before protected eval planning |
| `human-align-surfaces` | human | docs, code, adapters, ownership, or policy must be reconciled before proof |
| `human-confirm-or-decompose` | human | a human-readable claim needs confirmation, narrowing, or decomposition |
| `split-or-defer` | human | broad, historical, provider-caveated, or blocked claims should not enter proof yet |

```run:shell
$ jq -r '.actionSummary.primaryBuckets[] | .id + ":" + .recommendedActor' .cautilus/claims/status-summary.json
already-satisfied:none
agent-plan-cautilus-eval:agent
agent-design-scenario:agent
human-align-surfaces:human
human-confirm-or-decompose:human
split-or-defer:human
```

> check:cautilus-json-file
| path | json_path | equals | includes |
| --- | --- | --- | --- |
| .cautilus/claims/status-summary.json | actionSummary.primaryBuckets[0].id | already-satisfied | |
| .cautilus/claims/status-summary.json | actionSummary.primaryBuckets[1].id | agent-plan-cautilus-eval | |
| .cautilus/claims/status-summary.json | actionSummary.primaryBuckets[3].id | human-align-surfaces | |
| .cautilus/claims/evidence-claim-discover-proof-routing-2026-05-03.json | summary | | proof routes |

## A user is not asked to trust skill curation without dogfood evidence.

The binary owns deterministic extraction, de-duplication, saved packets, and bucket summaries.
The bundled skill owns the agent-facing workflow: use the binary, inspect the saved packet, explain source refs and duplicate fingerprints, classify next work, and stop before review, eval execution, edits, or commits.

This spec only verifies that the dev/skill proof route is prepared.
It does not claim the dogfood episode has passed until the Cautilus eval command below is approved and executed.

```run:shell
$ jq -r '.scripts["dogfood:cautilus-claim-discovery-curation-flow:eval:codex"]' package.json
./bin/cautilus eval test --repo-root . --adapter-name self-dogfood-claim-discovery-curation-flow --runtime codex --output-dir ./artifacts/self-dogfood/cautilus-claim-discovery-curation-flow-eval-codex/latest
```

| dogfood requirement | prepared artifact | current state |
| --- | --- | --- |
| agent invokes the bundled Cautilus workflow over this repo | `.agents/cautilus-adapters/self-dogfood-claim-discovery-curation-flow.yaml` | prepared, not executed |
| episode asks for scan scope, first discovery, packet inspection, extraction signals, duplicate fingerprints, and next-work buckets | `fixtures/eval/dev/skill/cautilus-claim-discovery-curation-flow.fixture.json` | prepared, not executed |
| transcript is audited for the curation flow instead of manually trusted | `scripts/agent-runtime/audit-cautilus-claim-discovery-curation-flow-log.mjs` | prepared, not executed |

> check:cautilus-json-file
| path | json_path | equals | includes |
| --- | --- | --- | --- |
| fixtures/eval/dev/skill/cautilus-claim-discovery-curation-flow.fixture.json | schemaVersion | cautilus.evaluation_input.v1 | |
| fixtures/eval/dev/skill/cautilus-claim-discovery-curation-flow.fixture.json | suiteId | cautilus-claim-discovery-curation-flow | |
| fixtures/eval/dev/skill/cautilus-claim-discovery-curation-flow.fixture.json | cases[0].auditKind | cautilus_claim_discovery_curation_flow | |
| fixtures/eval/dev/skill/cautilus-claim-discovery-curation-flow.fixture.json | cases[0].turns[1].input | | duplicate fingerprints |

```run:shell
# Show the prepared adapter and audit hook without executing Cautilus eval.
test -f .agents/cautilus-adapters/self-dogfood-claim-discovery-curation-flow.yaml
grep -q 'audit-cautilus-claim-discovery-curation-flow-log.mjs' .agents/cautilus-adapters/self-dogfood-claim-discovery-curation-flow.yaml
grep -q 'cautilus_claim_discovery_curation_flow' scripts/agent-runtime/skill-test-case-suite.mjs
grep -q 'auditClaimDiscoveryCurationFlowLogText' scripts/agent-runtime/skill-test-codex-episode.mjs
```
