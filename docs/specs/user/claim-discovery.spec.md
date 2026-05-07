# Claim Discovery

Using `cautilus claim` and the bundled skill, a user can turn declared repo promises into source-backed candidates and then decide whether each candidate needs ordinary tests, Cautilus evaluation, scenario design, or human alignment.

Discovery creates candidates.
A discovered claim is not treated as verified until matching evidence is attached.

| question a user needs answered | owner | artifact |
| --- | --- | --- |
| Where did discovery look? | `claim discover` | `effectiveScanScope`, `sourceInventory`, `sourceGraph`, `discoveryBoundary` |
| How did a line become a candidate? | `claim discover` | candidate text, source line refs, duplicate fingerprint, and recommended next work |
| What should happen next? | `claim show` | grouped next actions and sample candidates |
| Did an agent curate this well through the bundled skill? | skill-evaluation fixture | prepared episode and transcript audit, not yet executed |

## A user can audit where candidates came from.

`claim discover` records the scan boundary and the claim-discovery engine in the saved claim JSON.
`claim show` projects that saved claim JSON into a status summary without rescanning.

```run:shell
$ sh -lc 'claims_path="$(jq -r ".inputPath" .cautilus/claims/status-summary.json)"; jq -r '"'"'"claimJson=" + $p, "engine.name=" + .discoveryEngine.name, "engine.ruleset=" + .discoveryEngine.ruleset, "entries=" + (.effectiveScanScope.entries | join(",")), "traversal=" + .effectiveScanScope.traversal'"'"' --arg p "$claims_path" "$claims_path"'
claimJson=.cautilus/claims/evidenced-typed-runners.json
engine.name=cautilus.claim_discovery
engine.ruleset=claim-discovery-rules.v4
entries=README.md,AGENTS.md,CLAUDE.md
traversal=entry-markdown-links
```

Fresh discovery output says the same thing in user-facing terms: candidates are not verified until evidence is attached.

```run:shell
$ sh -lc 'tmp="$(mktemp -d)"; printf "%s\n" "# Demo" "" "Users can run deterministic checks before review." > "$tmp/README.md"; ./bin/cautilus claim discover --repo-root "$tmp" --output "$tmp/claims.json" >/dev/null; jq -r ".nonVerdictNotice" "$tmp/claims.json"'
Discovery creates candidates. A discovered claim is not verified until matching evidence is attached.
```

> check:cautilus-json-file
| path | json_path | equals | min_number |
| --- | --- | --- | --- |
| .cautilus/claims/status-summary.json | schemaVersion | cautilus.claim_status_summary.v1 | |
| .cautilus/claims/status-summary.json | sourceCount | | 1 |
| .cautilus/claims/status-summary.json | discoveryBoundary.entries[0] | README.md | |

## Cautilus uses visible heuristics to create candidates.

The examples below are representative, not a second copy of every classifier branch.
The implementation records the heuristic families it uses, and the focused Go test proves those functions work together in one discovery run.

| heuristic family | implementation function | what it decides |
| --- | --- | --- |
| Markdown text blocks | `claimTextBlocks` | Which non-code Markdown text blocks can be considered |
| Claim-shaped line filter | `claimLineLooksUseful` | Which lines look like behavior promises rather than prompt examples, questions, labels, placeholders, or noise |
| Next-work classifier | `classifyClaimLine` | Which follow-up work Cautilus recommends for the candidate |
| Duplicate text merge | `mergeIdenticalClaimCandidates` | Whether identical normalized sentences become one candidate with multiple source refs |

```run:shell
$ sh -lc 'tmp="$(mktemp -d)"; printf "%s\n" "# Demo" "" "Users can run deterministic checks before review." > "$tmp/README.md"; ./bin/cautilus claim discover --repo-root "$tmp" --output "$tmp/claims.json" >/dev/null; jq -r '"'"'.discoveryEngine.heuristics[] | .id + ":" + .implementationFunction'"'"' "$tmp/claims.json"'
markdown-text-blocks:claimTextBlocks
claim-shaped-line-filter:claimLineLooksUseful
next-work-classifier:classifyClaimLine
duplicate-summary-merge:mergeIdenticalClaimCandidates
```

```run:shell
$ go test ./internal/runtime -run TestDiscoverClaimProofPlanUsesCandidateHeuristicsTogether -count=1 >/dev/null && echo heuristic-composition-test=passed
heuristic-composition-test=passed
```

The same test shape is visible at the sentence level: the prompt example is filtered out, the same candidate sentence appears in two files, and discovery saves one candidate with both source refs.

```run:shell
$ sh -lc 'tmp="$(mktemp -d)"; printf "%s\n" "# Demo" "" "Input (for agent): run this command." "Users can run deterministic checks before review." > "$tmp/README.md"; printf "%s\n" "# AGENTS" "" "Users can run deterministic checks before review." > "$tmp/AGENTS.md"; ./bin/cautilus claim discover --repo-root "$tmp" --output "$tmp/claims.json" >/dev/null; jq -r '"'"'"sourceSentences=2", "candidateCount=" + (.candidateCount|tostring), "candidate=" + .claimCandidates[0].summary, "sourceRefs=" + (.claimCandidates[0].sourceRefs | map(.path + ":" + (.line|tostring)) | join(","))'"'"' "$tmp/claims.json"'
sourceSentences=2
candidateCount=1
candidate=Users can run deterministic checks before review.
sourceRefs=AGENTS.md:3,README.md:4
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

## Cautilus groups candidates by recommended next action.

`claim show` owns the next-action summary.
It reads saved claim JSON, groups candidates by the next action, and does not launch a reviewer, evaluation, edit, or commit.

This is the vocabulary Cautilus can use.
The command below the table shows which categories are present in this repo's current status summary.

| next-action category | actor | when it should be used |
| --- | --- | --- |
| already verified | none | matching evidence is already attached |
| add ordinary test evidence | agent | the candidate needs unit, lint, build, schema, spec, or CI evidence |
| plan Cautilus evaluation | agent | the candidate is ready for a Cautilus evaluation plan |
| design a scenario first | agent | the candidate needs a concrete scenario before evaluation planning |
| align surfaces first | human | docs, code, adapters, ownership, or policy must be reconciled before evidence would be honest |
| confirm or split | human | the candidate needs confirmation, narrowing, or decomposition |
| split or defer | human | broad, historical, provider-caveated, or blocked candidates should not enter evidence work yet |

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
| .cautilus/claims/evidence-claim-discover-proof-routing-2026-05-03.json | commandEvidence[0].observed.notableAssertions[1] | | source-ref-backed claim candidates |

## A user can require an agent-run skill check before trusting curation.

The binary owns candidate extraction, duplicate sentence merging, saved claim JSON, and next-action summaries.
The bundled skill owns the agent-facing workflow: use the binary, inspect the saved candidates, explain source refs and duplicate fingerprints, classify next work, and stop before review, evaluation execution, edits, or commits.

This spec only verifies that the agent-run skill check is prepared.
It does not claim that the episode has passed until the Cautilus evaluation command below is approved and executed.

```run:shell
$ jq -r '.scripts["dogfood:cautilus-claim-discovery-curation-flow:eval:codex"]' package.json
./bin/cautilus eval test --repo-root . --adapter-name self-dogfood-claim-discovery-curation-flow --runtime codex --output-dir ./artifacts/self-dogfood/cautilus-claim-discovery-curation-flow-eval-codex/latest
```

| behavior to check | prepared artifact | current state |
| --- | --- | --- |
| agent invokes the bundled Cautilus workflow over this repo | `.agents/cautilus-adapters/self-dogfood-claim-discovery-curation-flow.yaml` | prepared, not executed |
| episode asks for scan scope, first discovery, saved claim inspection, extraction heuristics, duplicate fingerprints, and next-action groups | `fixtures/eval/dev/skill/cautilus-claim-discovery-curation-flow.fixture.json` | prepared, not executed |
| transcript is audited for the curation flow instead of manually trusted | `scripts/agent-runtime/audit-cautilus-claim-discovery-curation-flow-log.mjs` | prepared, not executed |

```run:shell
$ jq -r '.cases[0].turns[1].input as $prompt | "asks-discovery=" + ($prompt | contains("run the first claim discovery scan") | tostring), "asks-heuristics=" + ($prompt | contains("extraction") | tostring), "asks-duplicate-handling=" + ($prompt | contains("duplicate fingerprints") | tostring), "stops-before-review-or-eval=" + ($prompt | contains("Stop before claim review prepare-input, reviewer launch, eval execution, edits, or commits") | tostring)' fixtures/eval/dev/skill/cautilus-claim-discovery-curation-flow.fixture.json
asks-discovery=true
asks-heuristics=true
asks-duplicate-handling=true
stops-before-review-or-eval=true
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
