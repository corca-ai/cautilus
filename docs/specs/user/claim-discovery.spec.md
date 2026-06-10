# Claim Discovery

Every repo makes promises to users and maintainers: what problem it solves, how it should behave, and which workflows it protects.
Those promises usually appear in docs, but the evidence behind them is scattered across tests, code, specs, eval artifacts, and human decisions.

Using the `cautilus discover claims` CLI command and the `cautilus-agent` skill, a user can turn scattered repo promises into a source-referenced worklist: what Cautilus found, what looks noisy, what may be missing, and what evidence each candidate needs next.

Claim discovery is a two-pass workflow.

- Pass 1: `discover claims` runs a broad deterministic scan over the selected entry and linked docs. It intentionally accepts some false positives so it does not miss declared promises inside that scan boundary, and it leaves source refs, heuristic metadata, duplicate handling, and next-action hints for an agent to inspect.
- Pass 2: The `cautilus-agent` skill curates the discovered candidate list. It reduces false positives, compares candidates with docs and code, looks for likely missing public promises, and asks whether a missing promise is intentional or under-documented.

Discovery creates candidates, not proof.
A candidate is not verified until matching evidence is attached.

Each candidate is routed toward the kind of evidence it needs next:

- deterministic test evidence, such as unit, e2e, lint, schema, build, or CI checks
- Cautilus behavior evaluation, when the claim needs an LLM-backed behavior test
- human decision, when permissions, ownership, policy, or product judgment are part of the claim

| workflow step | surface | result |
| --- | --- | --- |
| Select the source boundary | `cautilus-agent` skill plus `discover claims` | entry docs and linked docs to scan |
| Extract broad candidates | `discover claims` | source-referenced candidates, heuristic metadata, duplicate refs, and next-action hints |
| Curate the candidate list | `cautilus-agent` skill | false-positive reductions, possible false-negative questions, and grouped follow-up work |
| Fill evidence gaps | `discover claims status`, deterministic tests, `cautilus evaluate`, or human review | proof status changes only after valid evidence or a recorded decision |

## A user can audit the source boundary.

Claim discovery should make one question easy to answer: which docs were actually scanned before this candidate list was created?
`discover claims` records that source boundary in the saved discovery packet.
`discover claims status` reads the saved packet and summarizes the same boundary without running discovery again.

That boundary defines responsibility.
If a declared promise appears in the selected entry and linked docs but no candidate is created, `discover claims` missed an in-scope promise.
If an important behavior appears only outside that boundary, such as in code, transcripts, issues, or private operator memory, Cautilus Agent or a human can raise it as a documentation, catalog, or alignment gap.

```run:shell
$ sh -lc 'claims_path="$(jq -r ".inputPath" .cautilus/claims/status-summary.json)"; jq -r '"'"'"savedPacket=" + $p, "selectedEntries=" + (.effectiveScanScope.entries | join(",")), "linkedDocs=" + .effectiveScanScope.traversal'"'"' --arg p "$claims_path" "$claims_path"; jq -r '"'"'"outsideBoundary=Claims not declared in selected entry and linked docs are outside deterministic discovery scope.", "statusSummaryReads=" + .inputPath'"'"' .cautilus/claims/status-summary.json'
savedPacket=.cautilus/claims/evidenced-typed-runners.json
selectedEntries=README.md,AGENTS.md,CLAUDE.md
linkedDocs=entry-markdown-links
outsideBoundary=Claims not declared in selected entry and linked docs are outside deterministic discovery scope.
statusSummaryReads=.cautilus/claims/evidenced-typed-runners.json
```

The same output also keeps candidate status clear: discovery creates candidates, not verified proof.

```run:shell
$ sh -lc 'tmp="$(mktemp -d)"; printf "%s\n" "# Demo" "" "Users can run deterministic checks before review." > "$tmp/README.md"; ./bin/cautilus discover claims --repo-root "$tmp" --output "$tmp/claims.json" >/dev/null; jq -r ".nonVerdictNotice" "$tmp/claims.json"'
Discovery creates candidates. A discovered claim is not verified until matching evidence is attached.
```

> check:cautilus-json-file
| path | json_path | equals | min_number |
| --- | --- | --- | --- |
| .cautilus/claims/status-summary.json | schemaVersion | cautilus.claim_status_summary.v1 | |
| .cautilus/claims/status-summary.json | sourceCount | | 1 |
| .cautilus/claims/status-summary.json | discoveryBoundary.entries[0] | README.md | |

## `discover claims` exposes broad extraction with examples.

`discover claims` should be easy to audit from examples before a reader has to care about implementation names.
The examples below do not copy every classifier branch.
They show the behavior Cautilus must keep when it scans docs broadly: keep useful promises, filter obvious non-promises, choose a next evidence route, and merge duplicate source sentences without losing refs.

### Signal: readable docs, not fenced examples.

`discover claims` scans readable doc prose and ignores fenced examples or metadata.
In this sample, only the ordinary prose sentence becomes a candidate.

```run:shell
$ sh -lc 'tmp="$(mktemp -d)"; printf "%s\n" "---" "title: Demo" "---" "# Demo" "" "```" "Users can run this command in an example." "```" "" "Users can run deterministic checks before review." > "$tmp/README.md"; ./bin/cautilus discover claims --repo-root "$tmp" --output "$tmp/claims.json" >/dev/null; jq -r '"'"'"candidateCount=" + (.candidateCount|tostring), "candidate=" + .claimCandidates[0].summary'"'"' "$tmp/claims.json"'
candidateCount=1
candidate=Users can run deterministic checks before review.
```

### Signal: promise words point to the next evidence route.

`discover claims` uses claim text to suggest the next kind of proof work.
These examples show deterministic test evidence, a Cautilus behavior evaluation, and human-auditable policy work.

```run:shell
$ sh -lc 'tmp="$(mktemp -d)"; printf "%s\n" "# Demo" "" "Users can run deterministic checks before review." "The workflow should show scan scope before spending review budget." "Review-budget policy remains human-auditable until it is split into concrete proof targets." > "$tmp/README.md"; ./bin/cautilus discover claims --repo-root "$tmp" --output "$tmp/claims.json" >/dev/null; jq -r '"'"'.claimCandidates[] | .summary + " => " + .recommendedProof + ":" + .verificationReadiness + (if .recommendedEvalSurface then ":" + .recommendedEvalSurface else "" end)'"'"' "$tmp/claims.json"'
Users can run deterministic checks before review. => deterministic:ready-for-proof
The workflow should show scan scope before spending review budget. => cautilus-eval:ready-for-proof:dev/skill
Review-budget policy remains human-auditable until it is split into concrete proof targets. => human-auditable:ready-for-proof
```

### Signal: duplicate source sentences become one candidate.

If the same promise appears in more than one scanned doc, discovery emits one candidate and keeps both source refs.
This lets Cautilus Agent inspect duplication without asking the user to review the same promise twice.

```run:shell
$ sh -lc 'tmp="$(mktemp -d)"; printf "%s\n" "# Demo" "" "Input (for agent): run this command." "Users can run deterministic checks before review." > "$tmp/README.md"; printf "%s\n" "# AGENTS" "" "Users can run deterministic checks before review." > "$tmp/AGENTS.md"; ./bin/cautilus discover claims --repo-root "$tmp" --output "$tmp/claims.json" >/dev/null; jq -r '"'"'"sourceSentences=2", "candidateCount=" + (.candidateCount|tostring), "candidate=" + .claimCandidates[0].summary, "sourceRefs=" + (.claimCandidates[0].sourceRefs | map(.path + ":" + (.line|tostring)) | join(","))'"'"' "$tmp/claims.json"'
sourceSentences=2
candidateCount=1
candidate=Users can run deterministic checks before review.
sourceRefs=AGENTS.md:3,README.md:4
```

### Signal: adapter-declared non-claim sections are skipped.

A repo can declare section headings whose prose is never a claim candidate, such as rejected-alternatives lists, through `claim_discovery.classification_hints.non_claim_section_headings`.
Adapter headings merge with the portable default list (`Deferred Decisions`), so a deferred-decision section is filtered on every repo without adapter work.
The engine executes the hint deterministically and records the merged list in the packet's scan scope; without the adapter hint the rejected-alternative line would be extracted.

```run:shell
$ sh -lc 'tmp="$(mktemp -d)"; mkdir -p "$tmp/.agents"; printf "%s\n" "version: 1" "repo: demo" "claim_discovery:" "  classification_hints:" "    non_claim_section_headings:" "      - Rejected Alternatives" > "$tmp/.agents/cautilus-adapter.yaml"; printf "%s\n" "# Demo" "" "Users can run deterministic checks before review." "" "## Rejected Alternatives" "" "The rejected approach requires a magic freshness threshold." "" "## Deferred Decisions" "" "The state path stays adapter-owned until a maintainer decides the default." > "$tmp/README.md"; ./bin/cautilus discover claims --repo-root "$tmp" --output "$tmp/claims.json" >/dev/null; jq -r '"'"'"candidateCount=" + (.candidateCount|tostring), "nonClaimSectionHeadings=" + (.effectiveScanScope.nonClaimSectionHeadings | join(","))'"'"' "$tmp/claims.json"'
candidateCount=1
nonClaimSectionHeadings=Deferred Decisions,Rejected Alternatives
```

### Signal: adapter lexicon terms extract non-English claims.

The built-in claim-shaped-line filter carries an English verb lexicon, so a repo documented in another language extracts almost nothing by default.
A repo can declare its own claim vocabulary through `claim_discovery.classification_hints.claim_lexicon_terms`.
Adapter terms extend the built-in defaults and match as case-insensitive substrings, because agglutinative predicates such as Korean sentence endings carry no space boundaries.
Hint-matched lines that no portable routing case recognizes stay visible through a `human-auditable` fallback route instead of vanishing.
Without the hint the same document yields zero candidates, which keeps the lexicon adapter-owned rather than hardcoded.

```run:shell
$ sh -lc 'tmp="$(mktemp -d)"; printf "%s\n" "# 데모" "" "이 도구는 모든 실행에서 기계가 읽을 수 있는 결과 패킷을 기록합니다." > "$tmp/README.md"; ./bin/cautilus discover claims --repo-root "$tmp" --output "$tmp/claims.json" >/dev/null; jq -r '"'"'"baselineCandidateCount=" + (.candidateCount|tostring)'"'"' "$tmp/claims.json"; mkdir -p "$tmp/.agents"; printf "%s\n" "version: 1" "repo: demo" "claim_discovery:" "  classification_hints:" "    claim_lexicon_terms:" "      - 니다" > "$tmp/.agents/cautilus-adapter.yaml"; ./bin/cautilus discover claims --repo-root "$tmp" --from-scratch --output "$tmp/claims.json" >/dev/null; jq -r '"'"'"hintedCandidateCount=" + (.candidateCount|tostring), "route=" + .claimCandidates[0].recommendedProof + ":" + .claimCandidates[0].verificationReadiness, "claimLexiconTerms=" + (.effectiveScanScope.claimLexiconTerms | join(","))'"'"' "$tmp/claims.json"'
baselineCandidateCount=0
hintedCandidateCount=1
route=human-auditable:blocked
claimLexiconTerms=니다
```

### Implementation evidence.

The saved discovery packet records the heuristic families used for these behaviors.
The checked-in evidence bundle records that the command-level behavior is satisfied without making this user-facing spec delegate to a lower-level unit-test runner.

```run:shell
$ sh -lc 'tmp="$(mktemp -d)"; printf "%s\n" "# Demo" "" "Users can run deterministic checks before review." > "$tmp/README.md"; ./bin/cautilus discover claims --repo-root "$tmp" --output "$tmp/claims.json" >/dev/null; jq -r '"'"'.discoveryEngine.heuristics[] | .id + ":" + .implementationFunction'"'"' "$tmp/claims.json"'
markdown-text-blocks:claimTextBlocks
adapter-non-claim-section-filter:headingIsNonClaimSection
claim-shaped-line-filter:claimLineLooksUseful
next-work-classifier:classifyClaimLine
duplicate-summary-merge:mergeIdenticalClaimCandidates
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

`discover claims` intentionally leaves a broad candidate list.
The `cautilus-agent` skill is responsible for turning that packet into a useful working set before proof work starts.
That means it should inspect the saved candidates, compare them with the repo, reduce false positives, raise possible false negatives, and preserve source refs when it asks the user what to do next.

This spec checks that the dogfood fixture and audit hook are prepared to ask for that curation behavior.
It does not execute the Cautilus eval or claim that the curation episode has passed.

```run:shell
$ jq -r '.cases[0].turns[1].input as $prompt | "asks-discovery=" + ($prompt | contains("run the first claim discovery scan") | tostring), "asks-false-positive-curation=" + ($prompt | contains("false positives") | tostring), "asks-false-negative-scan=" + ($prompt | contains("false negatives") | tostring), "stops-before-review-or-eval=" + ($prompt | contains("Stop before discover claims review-input, reviewer launch, eval execution, edits, or commits") | tostring)' fixtures/eval/dev/skill/cautilus-claim-discovery-curation-flow.fixture.json
asks-discovery=true
asks-false-positive-curation=true
asks-false-negative-scan=true
stops-before-review-or-eval=true
```

```run:shell
$ node --test --test-reporter=dot --test-reporter-destination=stdout scripts/agent-runtime/audit-cautilus-claim-discovery-curation-flow-log.test.mjs >/dev/null && echo curation-audit-unit-test=passed
curation-audit-unit-test=passed
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

`discover claims status` owns the next-action summary over a saved discovery packet.
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
$ jq -r '"bucketCount=" + (.actionSummary.primaryBuckets | length | tostring), (.actionSummary.primaryBuckets[] | .id + ":" + .recommendedActor)' .cautilus/claims/status-summary.json
bucketCount=6
already-satisfied:none
agent-add-deterministic-proof:agent
agent-plan-cautilus-eval:agent
human-align-surfaces:human
human-confirm-or-decompose:human
split-or-defer:human
```

> check:cautilus-json-file
| path | json_path | equals | includes |
| --- | --- | --- | --- |
| .cautilus/claims/status-summary.json | actionSummary.primaryBuckets[0].id | already-satisfied | |
| .cautilus/claims/status-summary.json | actionSummary.primaryBuckets[1].id | agent-add-deterministic-proof | |
| .cautilus/claims/status-summary.json | actionSummary.primaryBuckets[2].id | agent-plan-cautilus-eval | |
| .cautilus/claims/status-summary.json | actionSummary.primaryBuckets[3].id | human-align-surfaces | |
| .cautilus/claims/status-summary.json | actionSummary.primaryBuckets[4].id | human-confirm-or-decompose | |
| .cautilus/claims/evidence-claim-discover-proof-routing-2026-05-03.json | commandEvidence[0].observed.notableAssertions[1] | | source-ref-backed claim candidates |

## The prepared skill evaluation is a later proof step.

`discover claims` owns candidate extraction, duplicate sentence merging, and the saved discovery packet.
`discover claims status` owns next-action summaries over that saved packet.
Cautilus Agent owns the agent-facing curation workflow: run those commands, inspect the saved candidates, explain source refs and duplicate fingerprints, reduce false positives, raise possible false negatives, classify next work, and stop before review, evaluation execution, edits, or commits.

This spec only verifies that the agent-run skill check is prepared.
It does not claim that the episode has passed until the Cautilus evaluation command below is approved and executed.

```run:shell
$ jq -r '.scripts["dogfood:cautilus-claim-discovery-curation-flow:eval:codex"]' package.json
./bin/cautilus evaluate fixture --repo-root . --adapter-name self-dogfood-claim-discovery-curation-flow --runtime codex --output-dir ./artifacts/self-dogfood/cautilus-claim-discovery-curation-flow-eval-codex/latest
```

| behavior to check | prepared artifact | current state |
| --- | --- | --- |
| agent invokes Cautilus Agent over this repo | `.agents/cautilus-adapters/self-dogfood-claim-discovery-curation-flow.yaml` | prepared, not executed |
| episode asks for scan scope, first discovery, saved claim inspection, extraction heuristics, duplicate fingerprints, false-positive curation, possible false-negative scan, and next-action groups | `fixtures/eval/dev/skill/cautilus-claim-discovery-curation-flow.fixture.json` | prepared, not executed |
| transcript is audited for the curation flow instead of manually trusted | `scripts/agent-runtime/audit-cautilus-claim-discovery-curation-flow-log.mjs` | prepared, not executed |

```run:shell
$ jq -r '.cases[0].turns[1].input as $prompt | "asks-discovery=" + ($prompt | contains("run the first claim discovery scan") | tostring), "asks-heuristics=" + ($prompt | contains("extraction") | tostring), "asks-duplicate-handling=" + ($prompt | contains("duplicate fingerprints") | tostring), "asks-false-positive-curation=" + ($prompt | contains("false positives") | tostring), "asks-false-negative-scan=" + ($prompt | contains("false negatives") | tostring), "stops-before-review-or-eval=" + ($prompt | contains("Stop before discover claims review-input, reviewer launch, eval execution, edits, or commits") | tostring)' fixtures/eval/dev/skill/cautilus-claim-discovery-curation-flow.fixture.json
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
