# Claim Discovery

Every repo makes promises to users and maintainers: what problem it solves, how it should behave, and which workflows it protects.
Those promises usually appear in docs, but the evidence behind them is scattered across tests, code, specs, eval artifacts, and human decisions.

Using the `cautilus claim` CLI command and the `cautilus-agent` skill, a user can turn scattered repo promises into a source-referenced worklist: what Cautilus found, what looks noisy, what may be missing, and what evidence each candidate needs next.

Claim discovery is a two-pass workflow.

- Pass 1: The `cautilus` binary runs a broad deterministic scan over the selected entry and linked docs. It intentionally accepts some false positives so it does not miss declared promises inside that scan boundary, and it leaves source refs, heuristic metadata, duplicate handling, and next-action hints for an agent to inspect.
- Pass 2: Cautilus Agent curates the discovered candidate list. It reduces false positives, compares candidates with docs and code, looks for likely missing public promises, and asks whether a missing promise is intentional or under-documented.

Discovery creates candidates, not proof.
A candidate is not verified until matching evidence is attached.

Each candidate is routed toward the kind of evidence it needs next:

- deterministic test evidence, such as unit, e2e, lint, schema, build, or CI checks
- Cautilus behavior evaluation, when the claim needs an LLM-backed behavior test
- human decision, when permissions, ownership, policy, or product judgment are part of the claim

| workflow step | surface | result |
| --- | --- | --- |
| Select the source boundary | Cautilus Agent plus `claim discover` | entry docs and linked Markdown depth to scan |
| Extract broad candidates | `claim discover` | source-referenced candidates, heuristic metadata, duplicate refs, and next-action hints |
| Curate the candidate list | Cautilus Agent | false-positive reductions, possible false-negative questions, and grouped follow-up work |
| Fill evidence gaps | `claim show`, deterministic tests, `cautilus eval`, or human review | proof status changes only after valid evidence or a recorded decision |

## A user can audit the source boundary.

`claim discover` records the scan boundary and the claim-discovery engine in the saved claim JSON.
`claim show` projects that saved claim JSON into a status summary without rescanning.
If a declared promise is inside that recorded boundary and discovery misses it, that is a discovery bug.
If an important behavior only appears outside the boundary, such as in code, transcripts, issues, or private operator memory, that is a narrative or catalog gap for Cautilus Agent or a human to raise.

```run:shell
$ sh -lc 'claims_path="$(jq -r ".inputPath" .cautilus/claims/status-summary.json)"; jq -r '"'"'"claimJson=" + $p, "engine.name=" + .discoveryEngine.name, "engine.ruleset=" + .discoveryEngine.ruleset, "entries=" + (.effectiveScanScope.entries | join(",")), "traversal=" + .effectiveScanScope.traversal'"'"' --arg p "$claims_path" "$claims_path"; jq -r '"'"'"boundary=" + .discoveryBoundary.sourceBasis, "omission=" + .discoveryBoundary.omissionPolicy'"'"' .cautilus/claims/status-summary.json'
claimJson=.cautilus/claims/evidenced-typed-runners.json
engine.name=cautilus.claim_discovery
engine.ruleset=claim-discovery-rules.v4
entries=README.md,AGENTS.md,CLAUDE.md
traversal=entry-markdown-links
boundary=entry-docs-and-linked-markdown
omission=Claims not declared in configured entry documents or linked Markdown are outside deterministic discovery scope.
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

## The binary exposes the heuristics behind broad extraction.

The examples below are representative, not a second copy of every classifier branch.
They show the contract Cautilus must keep: scan readable Markdown prose, reject obvious prompt or placeholder noise, classify the next evidence route, and merge identical normalized sentences while preserving every source ref.
The implementation records the heuristic families it uses, and the focused Go test proves those functions work together in one discovery run.

| source signal | what the binary does with it | code path |
| --- | --- | --- |
| Markdown prose outside fenced code | breaks source docs into candidate text blocks | `claimTextBlocks` |
| claim-shaped sentence, such as "Users can run deterministic checks before review." | keeps behavior-like promises and filters prompt examples, questions, labels, placeholders, and noise | `claimLineLooksUseful` |
| proof words, behavior words, command names, and alignment words | recommends the next evidence route for the candidate | `classifyClaimLine` |
| same normalized sentence in more than one source | emits one candidate with multiple source refs instead of separate duplicates | `mergeIdenticalClaimCandidates` |

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

The same behavior is visible at the sentence level.
The prompt example is filtered out, the same candidate sentence appears in two files, and discovery saves one candidate with both source refs.

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

## Cautilus Agent curates candidates before proof work.

Binary discovery intentionally leaves a broad candidate list.
Cautilus Agent is responsible for turning that packet into a useful working set before proof work starts.
That means it should inspect the saved candidates, compare them with the repo, reduce false positives, raise possible false negatives, and preserve source refs when it asks the user what to do next.

This spec verifies that the prepared dogfood episode and audit expect that curation behavior.
It does not execute the Cautilus eval.

```run:shell
$ jq -r '.cases[0].turns[1].input as $prompt | "asks-discovery=" + ($prompt | contains("run the first claim discovery scan") | tostring), "asks-false-positive-curation=" + ($prompt | contains("false positives") | tostring), "asks-false-negative-scan=" + ($prompt | contains("false negatives") | tostring), "stops-before-review-or-eval=" + ($prompt | contains("Stop before claim review prepare-input, reviewer launch, eval execution, edits, or commits") | tostring)' fixtures/eval/dev/skill/cautilus-claim-discovery-curation-flow.fixture.json
asks-discovery=true
asks-false-positive-curation=true
asks-false-negative-scan=true
stops-before-review-or-eval=true
```

```run:shell
$ node --test --test-reporter=dot --test-reporter-destination=stdout scripts/agent-runtime/audit-cautilus-claim-discovery-curation-flow-log.test.mjs >/dev/null && echo curation-audit-test=passed
curation-audit-test=passed
```

> check:cautilus-json-file
| path | json_path | equals | includes |
| --- | --- | --- | --- |
| fixtures/eval/dev/skill/cautilus-claim-discovery-curation-flow.fixture.json | schemaVersion | cautilus.evaluation_input.v1 | |
| fixtures/eval/dev/skill/cautilus-claim-discovery-curation-flow.fixture.json | suiteId | cautilus-claim-discovery-curation-flow | |
| fixtures/eval/dev/skill/cautilus-claim-discovery-curation-flow.fixture.json | cases[0].auditKind | cautilus_claim_discovery_curation_flow | |
| fixtures/eval/dev/skill/cautilus-claim-discovery-curation-flow.fixture.json | cases[0].turns[1].input | | false positives |
| fixtures/eval/dev/skill/cautilus-claim-discovery-curation-flow.fixture.json | cases[0].turns[1].input | | false negatives |

## Cautilus groups candidates by recommended next action.

`claim show` owns the next-action summary over a saved claim packet.
It groups candidates by the next route and does not launch a reviewer, evaluation, edit, or commit.

This is the vocabulary Cautilus can use.
The command below the table shows which categories are present in this repo's current status summary.

| next-action category | actor | when it should be used |
| --- | --- | --- |
| already verified | none | matching evidence is already attached |
| add deterministic test evidence | agent | the candidate needs unit, e2e, lint, build, schema, spec, or CI evidence |
| plan Cautilus behavior evaluation | agent | the candidate is ready for an LLM-backed behavior evaluation plan |
| design an evaluable scenario first | agent | the behavior is real but not concrete enough for an eval fixture yet |
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

## The prepared skill evaluation is a later proof step.

The binary owns candidate extraction, duplicate sentence merging, saved claim JSON, and next-action summaries.
Cautilus Agent owns the agent-facing curation workflow: use the binary, inspect the saved candidates, explain source refs and duplicate fingerprints, reduce false positives, raise possible false negatives, classify next work, and stop before review, evaluation execution, edits, or commits.

This spec only verifies that the agent-run skill check is prepared.
It does not claim that the episode has passed until the Cautilus evaluation command below is approved and executed.

```run:shell
$ jq -r '.scripts["dogfood:cautilus-claim-discovery-curation-flow:eval:codex"]' package.json
./bin/cautilus eval test --repo-root . --adapter-name self-dogfood-claim-discovery-curation-flow --runtime codex --output-dir ./artifacts/self-dogfood/cautilus-claim-discovery-curation-flow-eval-codex/latest
```

| behavior to check | prepared artifact | current state |
| --- | --- | --- |
| agent invokes Cautilus Agent over this repo | `.agents/cautilus-adapters/self-dogfood-claim-discovery-curation-flow.yaml` | prepared, not executed |
| episode asks for scan scope, first discovery, saved claim inspection, extraction heuristics, duplicate fingerprints, false-positive curation, possible false-negative scan, and next-action groups | `fixtures/eval/dev/skill/cautilus-claim-discovery-curation-flow.fixture.json` | prepared, not executed |
| transcript is audited for the curation flow instead of manually trusted | `scripts/agent-runtime/audit-cautilus-claim-discovery-curation-flow-log.mjs` | prepared, not executed |

```run:shell
$ jq -r '.cases[0].turns[1].input as $prompt | "asks-discovery=" + ($prompt | contains("run the first claim discovery scan") | tostring), "asks-heuristics=" + ($prompt | contains("extraction") | tostring), "asks-duplicate-handling=" + ($prompt | contains("duplicate fingerprints") | tostring), "asks-false-positive-curation=" + ($prompt | contains("false positives") | tostring), "asks-false-negative-scan=" + ($prompt | contains("false negatives") | tostring), "stops-before-review-or-eval=" + ($prompt | contains("Stop before claim review prepare-input, reviewer launch, eval execution, edits, or commits") | tostring)' fixtures/eval/dev/skill/cautilus-claim-discovery-curation-flow.fixture.json
asks-discovery=true
asks-heuristics=true
asks-duplicate-handling=true
asks-false-positive-curation=true
asks-false-negative-scan=true
stops-before-review-or-eval=true
```

> check:cautilus-json-file
| path | json_path | equals | includes |
| --- | --- | --- | --- |
| fixtures/eval/dev/skill/cautilus-claim-discovery-curation-flow.fixture.json | schemaVersion | cautilus.evaluation_input.v1 | |
| fixtures/eval/dev/skill/cautilus-claim-discovery-curation-flow.fixture.json | suiteId | cautilus-claim-discovery-curation-flow | |
| fixtures/eval/dev/skill/cautilus-claim-discovery-curation-flow.fixture.json | cases[0].auditKind | cautilus_claim_discovery_curation_flow | |
| fixtures/eval/dev/skill/cautilus-claim-discovery-curation-flow.fixture.json | cases[0].turns[1].input | | duplicate fingerprints |
| fixtures/eval/dev/skill/cautilus-claim-discovery-curation-flow.fixture.json | cases[0].turns[1].input | | false negatives |

```run:shell
# Show the prepared adapter and audit hook without executing Cautilus eval.
test -f .agents/cautilus-adapters/self-dogfood-claim-discovery-curation-flow.yaml
grep -q 'audit-cautilus-claim-discovery-curation-flow-log.mjs' .agents/cautilus-adapters/self-dogfood-claim-discovery-curation-flow.yaml
grep -q 'cautilus_claim_discovery_curation_flow' scripts/agent-runtime/skill-test-case-suite.mjs
grep -q 'auditClaimDiscoveryCurationFlowLogText' scripts/agent-runtime/skill-test-codex-episode.mjs
```
