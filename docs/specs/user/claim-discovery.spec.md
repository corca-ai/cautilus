# Claim Discovery

Using `cautilus claim` and the bundled skill, a user can discover behavior promises from selected repo truth surfaces and turn the raw candidates into a reviewable next-work map.

## A user can see where discovery looked before trusting candidates.

`claim discover` starts from configured entry documents and linked Markdown, records the effective discovery boundary, and emits a proof plan instead of an unscoped narrative.

```run:shell
$ jq -r '"packet=.cautilus/claims/status-summary.json", "provenance.inputPath=" + .inputPath, "provenance.gitCommit.present=" + ((.gitCommit // "") | length > 0 | tostring), "schema=" + .schemaVersion, "sourceBasis=" + .discoveryBoundary.sourceBasis, "entries=" + (.discoveryBoundary.entries | join(",")), "candidateCount>=1=" + (.candidateCount >= 1 | tostring)' .cautilus/claims/status-summary.json
packet=.cautilus/claims/status-summary.json
provenance.inputPath=.cautilus/claims/evidenced-typed-runners.json
provenance.gitCommit.present=true
schema=cautilus.claim_status_summary.v1
sourceBasis=entry-docs-and-linked-markdown
entries=README.md,AGENTS.md,CLAUDE.md
candidateCount>=1=true
```

> check:cautilus-json-file
| path | json_path | equals | min_number |
| --- | --- | --- | --- |
| .cautilus/claims/status-summary.json | schemaVersion | cautilus.claim_status_summary.v1 | |
| .cautilus/claims/status-summary.json | sourceCount | | 1 |
| .cautilus/claims/status-summary.json | discoveryBoundary.entries[0] | | |

The same status summary keeps the non-verdict boundary visible so users do not treat discovered promises as satisfied evidence before proof is attached.

> check:cautilus-json-file
| path | json_path | includes |
| --- | --- | --- |
| .cautilus/claims/status-summary.json | nonVerdictNotice | proof plan, not proof |

## A user can inspect the extraction heuristics before accepting the candidate list.

Discovery is deterministic enough to audit as a table: it turns Markdown blocks into candidate claims only when a line has claim-shaped language, then classifies the proof layer from product and workflow signals.

| discovery step | signal Cautilus looks for | what the packet records | current proof |
| --- | --- | --- | --- |
| source block selection | Markdown headings, bullets, numbered items, and sentence-ending paragraphs outside code fences and frontmatter | `sourceRefs[].path`, `sourceRefs[].line`, and excerpt text | `claimTextBlocks` preserves heading context and line numbers |
| usefulness filter | claim-shaped verbs such as `must`, `should`, `can`, `owns`, `emits`, `routes`, `discovers`, `evaluates`, or `validates` | candidate summaries only for useful promise-like lines | `claimLineLooksUseful` filters prompt examples, open questions, definitions, future placeholders, and overlong text |
| proof classification | deterministic test language, packet/schema language, skill/agent/model behavior, alignment language, broad scenario language, and human-readable audit language | `recommendedProof`, `verificationReadiness`, `recommendedEvalSurface`, `whyThisLayer`, and `nextAction` | `classifyClaimLine` maps those signals to deterministic, human-auditable, Cautilus eval, scenario, alignment, or blocked work |
| duplicate handling | identical normalized summary fingerprints across sources | one candidate with merged and sorted `sourceRefs` plus merged group hints | `mergeIdenticalClaimCandidates` merges by `claimFingerprint` |

```run:shell
# Show the deterministic extraction and de-duplication functions this table describes.
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

## A user can see next-work buckets after deterministic discovery.

After extraction and de-duplication, `claim show` groups the packet into work buckets so fixture work does not start before the proof route is clear.

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

## A user can require bundled-skill curation before treating discovery as review-ready.

The binary owns deterministic extraction, de-duplication, packets, and next-work buckets.
The bundled skill must then run the workflow on behalf of an agent, inspect the resulting packet, explain the extraction and duplicate-handling signals, and classify the next work without launching review, eval, edits, or commits.

This direct dev/skill proof is prepared but intentionally not executed in this slice.
Run it only after HITL approval:

```run:shell
$ jq -r '.scripts["dogfood:cautilus-claim-discovery-curation-flow:eval:codex"]' package.json
./bin/cautilus eval test --repo-root . --adapter-name self-dogfood-claim-discovery-curation-flow --runtime codex --output-dir ./artifacts/self-dogfood/cautilus-claim-discovery-curation-flow-eval-codex/latest
```

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
