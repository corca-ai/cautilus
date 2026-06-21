# recommendedProof facet gold-set proposal (D3)

> SUPERSEDED-AS-LABELS (2026-06-19): this set was measured against packet `2a75d88c`, now 108 commits behind HEAD; ~half its sampled claimIds no longer exist at HEAD.
> Regenerated against the HEAD ratified answer key at `2026-06-19-recommendedproof-facet-gold-set-v2head.{md,json}`.
> The facet vocabulary, route discriminators, and verdict scheme carry forward as METHOD; do not ratify the labels here — ratify the regenerated set.

Status: agent-proposed, 2026-06-10, revised after bounded fresh-eye critique and a maintainer portability challenge.
Every label below is a proposal by a single agent labeler and is pending maintainer ratification, the same co-own rule that governed the sc5 semantic control.

## Why

`discover` tags each claim with one per-claim `recommendedProof`, and 259 of 375 current candidates carry that tag from a heuristic nobody has validated.
The facet-decomposition template says the tag belongs on each facet of a claim, not on the claim as a whole.
This gold set measures both at once: how accurate the heuristic per-claim tag is, and which facet routings real claims actually need.
The ratified version becomes the design input and test fixture for wiring per-facet `recommendedProof` into the `discover` schema.

## Portability (what this exercise gives consumer repos)

Portable:

- the per-facet schema and facet vocabulary (discover ships in the binary and runs on consumer docs)
- heuristic fixes for recurring claim shapes: ownership sentences, rationale bullets, rejected alternatives, definitions
- the not-a-claim / split lane

Not portable yet:

- the measured tag-accuracy rates themselves (meta-doc corpus; see externalValidity)
- the dominance tie-breaks (scoring footnotes for this report only)

## External validity caveat

This gold set is measured on Cautilus's own documentation, which is meta-documentation about evaluation; its claim-shape distribution is unusual. Consumer repos (e.g., a chatbot app) carry mostly product-behavior claims where the cautilus-eval tag may be RIGHT far more often. Pattern 1 (cautilus-eval over-assignment) is therefore a repo-local result until a consumer-shaped sample (app/chat surface claims or a real host repo's docs) replicates the measurement. Backlog: run the same 12-per-tag protocol on a consumer-shaped corpus before or alongside schema wiring.

## Method

Selection: From .cautilus/claims/latest.json claimCandidates with reviewStatus==heuristic, per recommendedProof tag: sort by claimId, pick indices round(i*(n-1)/11) for i in 0..11 (12 per tag).
Packet commit: `2a75d88c00b8f4a93a54e149e8ce87654348a886`.

Verdict vocabulary per claim, comparing the proposed facet routing against the heuristic tag:

- **exact** — every substantive facet routes to the tagged class
- **too-coarse** — the dominant facet matches the tag but at least one substantive facet routes elsewhere
- **wrong** — the dominant facet routes to a different class than the tag
- **not-a-claim** — the extracted text is not a provable behavior claim (rejected-alternative bullet, pure context); a discovery extraction issue, excluded from tag-accuracy tallies

Labeling rules:

- **dominance** — Dominance is a SCORING DEVICE for grading the legacy per-claim tag only, not a product rule. The facet decomposition is the durable output: a claim carries all its facets, each with its own route. Schema-design default (maintainer-aligned 2026-06-10): per-facet routing replaces the per-claim tag entirely; no dominant field ships in the discover schema. The 4 dominance-debatable entries are scoring footnotes (counted both ways in sensitivity), not decisions that block schema design.
- **definitions** — Vocabulary definitions are context, not facets; the facet is their enforceable projection (e.g., a badge definition is human context, the badge-to-spec link check is the deterministic facet).
- **checkerExistence** — A deterministic route asserts the facet is mechanically checkable in principle. Whether the checker already exists in this repo is recorded during schema wiring, not here; routing does not claim present-day test coverage.

## Proposed tallies (pre-ratification)

| heuristic tag | n | exact | too-coarse | wrong (clear) | wrong (debatable) | not-a-claim | dominant-correct |
|---|---|---|---|---|---|---|---|
| deterministic | 12 | 8 | 2 | 0 | 2 | 0 | 10/12 |
| cautilus-eval | 12 | 0 | 3 | 6 | 2 | 1 | 3/11 |
| human-auditable | 12 | 1 | 4 | 7 | 0 | 0 | 5/12 |
| **all** | 36 | 9 | 9 | 13 | 4 | 1 | 18/35 |

Dominant-correct excludes the not-a-claim entry from its denominator; wrong (debatable) rows count entries whose dominance reading goes both ways and is held as a scoring footnote, not a blocking decision.

## Patterns the proposal surfaces (to verify in review)

1. `cautilus-eval` over-assignment, decomposed honestly: of 12 sampled, 6 are clear misroutes (packet schema or CLI behavior with no model in the loop), 2 are misroutes whose dominance reading is debatable, 1 is a non-claim extraction, and only 3 are dominantly judge-shaped.
   Repo-local until replicated on a consumer-shaped corpus (see external validity caveat); if it generalizes, the claims that genuinely need an intelligence judge are far fewer than the 147/375 the tag suggests.
2. `human-auditable` often hides a deterministic dominant facet (7 of 12 clear): prose-shaped contract lines default to human even when a direct code check exists.
3. `deterministic` is the most reliable tag (10 of 12 dominant-correct); its two misses are agent-ownership claims whose dominance reading (declared ownership vs live behavior) is a scoring footnote.
4. Discovery extracts non-claims: a rejected-alternative bullet arrived as a provable claim, and a vocabulary definition needed the definition-vs-projection rule; the schema work should include a split/not-a-claim lane.
5. Every claim whose dominant facet is judge also carries deterministic facets, consistent with the facet-decomposition template's core rule.

## How to review

The durable thing under review is each entry's FACET DECOMPOSITION (the facets and their routes); dominance and tag verdicts are derived scoring.
Confirm or correct the facet list and routes; flag any facet that is missing, mislabeled, or not honestly checkable on its proposed route.
The non-claim entry needs an explicit maintainer call; the 4 dominance-debatable entries do not block anything and may be left both-ways.
Record corrections in the JSON sibling (`maintainerVerdict` per entry); tallies are recomputed after ratification, not hand-edited.

## Entries

### claim-docs-contracts-adapter-contract-md-219

`docs/contracts/adapter-contract.md:219` — heuristic tag: `deterministic`

> The binary uses these hints before portable path defaults to label review queues, while the Cautilus Agent or a human reviewer may still correct semantic edge cases.

- [deterministic] binary applies adapter hints before portable defaults when labeling review queues
- [deterministic] review-result application path accepts agent/human corrections

Proposed: dominant `deterministic`, verdict **exact**.

### claim-docs-contracts-claim-discovery-workflow-md-382

`docs/contracts/claim-discovery-workflow.md:382` — heuristic tag: `deterministic`

> The deterministic pass should emit broad candidates and grouping hints that make curation efficient:

- [deterministic] deterministic pass emits broad candidates plus groupHints
- [human-auditable] the hints actually make curation efficient

Proposed: dominant `deterministic`, verdict **too-coarse**.
Note: Efficiency-of-curation is a usability facet the tag hides.

### claim-docs-contracts-claim-discovery-workflow-md-594

`docs/contracts/claim-discovery-workflow.md:594` — heuristic tag: `deterministic` — dominance reads both ways (scoring footnote)

> In the claim discovery workflow, the Cautilus Agent owns LLM-backed claim review, review-budget explanation, and subagent orchestration.

- [deterministic] ownership assignment stated in contract and skill docs
- [cautilus-eval] agent actually performs LLM-backed review, budget explanation, and subagent orchestration in live runs

Proposed: dominant `cautilus-eval`, verdict **wrong**.
Note: whyThisLayer cites install/packaging - a visible heuristic misfire; the claim is about agent behavior.

### claim-docs-contracts-eval-judge-collaboration-md-84

`docs/contracts/eval-judge-collaboration.md:84` — heuristic tag: `deterministic`

> `scripts/agent-runtime/reasoning-soundness-judge.mjs` owns the structured rubric schema, a blind prompt builder that strips the expected label, rationale, and case kind, and a deterministic comparator with a rubber-stamp guard.

- [deterministic] module exports rubric schema, blind prompt builder, deterministic comparator, rubber-stamp guard (unit-tested)

Proposed: dominant `deterministic`, verdict **exact**.

### claim-docs-contracts-reporting-md-125

`docs/contracts/reporting.md:125` — heuristic tag: `deterministic`

> Cache-token breakdown follows the same rule: preserve it when a runtime or wrapper emits explicit machine-readable fields, and do not infer cache behavior from prose.

- [deterministic] normalizer preserves explicit machine-readable cache-token fields
- [deterministic] normalizer never infers cache fields from prose (negative fixture)

Proposed: dominant `deterministic`, verdict **exact**.

### claim-docs-contracts-runtime-fingerprint-improvement-md-188

`docs/contracts/runtime-fingerprint-improvement.md:188` — heuristic tag: `deterministic`

> A skill or evaluate fixture can pass while still reporting that the observed runtime changed from the comparison evidence.

- [deterministic] fixture result schema can express pass together with a runtime-changed report

Proposed: dominant `deterministic`, verdict **exact**.

### claim-docs-guides-evaluation-process-md-52

`docs/guides/evaluation-process.md:52` — heuristic tag: `deterministic`

> The helper emits machine-readable baseline and candidate paths you can pass back into `evaluate fixture` or `evaluate review variants`.

- [deterministic] helper emits machine-readable baseline and candidate paths
- [deterministic] emitted paths are accepted back by evaluate fixture / review variants

Proposed: dominant `deterministic`, verdict **exact**.

### claim-docs-specs-contracts-binary-skill-boundary-spec-md-20

`docs/specs/contracts/binary-skill-boundary.spec.md:20` — heuristic tag: `deterministic`

> Progressive disclosure between the binary and the Cautilus Agent stays within a deterministically checkable contract.

- [deterministic] disclosure scanner gate exists and runs green in verify

Proposed: dominant `deterministic`, verdict **exact**.
Note: The claim asserts checkability itself; the gate is the proof.

### claim-docs-specs-evidence-latest-selected-evidence-spec-md-9

`docs/specs/evidence/latest-selected-evidence.spec.md:9` — heuristic tag: `deterministic`

> Expensive eval and improve loops should be represented by durable artifacts with enough provenance to reopen them.

- [deterministic] eval/improve loops write durable artifacts carrying provenance fields
- [deterministic] provenance suffices to reopen: replay path executes from the artifact alone

Proposed: dominant `deterministic`, verdict **exact**.

### claim-docs-specs-user-claim-discovery-spec-md-160

`docs/specs/user/claim-discovery.spec.md:160` — heuristic tag: `deterministic`

> `discover claims status` owns the next-action summary over a saved discovery packet.

- [deterministic] discover claims status reads a saved packet and emits the next-action summary

Proposed: dominant `deterministic`, verdict **exact**.

### claim-docs-specs-user-reviewable-artifacts-spec-md-3

`docs/specs/user/reviewable-artifacts.spec.md:3` — heuristic tag: `deterministic`

> After an agent runs a workflow, the user needs durable packets and readable views that another person or agent can reopen without trusting chat memory.

- [deterministic] workflow runs write durable packets and readable views
- [cautilus-eval] another person or agent can actually reopen from the artifacts without chat context
- [human-auditable] reopen path is acceptable to a human operator

Proposed: dominant `deterministic`, verdict **too-coarse**.
Note: Reopenability-without-chat-memory is a behavior facet, not a schema facet.

### claim-skills-cautilus-agent-skill-md-23

`skills/cautilus-agent/SKILL.md:23` — heuristic tag: `deterministic` — dominance reads both ways (scoring footnote)

> Cautilus Agent owns routing, sequencing, user-facing decision boundaries, and LLM-backed claim review work.

- [deterministic] ownership boundary stated in SKILL.md within the disclosure gate
- [cautilus-eval] agent actually owns routing, sequencing, and decision boundaries in live runs

Proposed: dominant `cautilus-eval`, verdict **wrong**.
Note: Same misfire class as cdw-594: agent-behavior claim tagged as packaging.

### claim-docs-contracts-active-run-md-186

`docs/contracts/active-run.md:186` — heuristic tag: `cautilus-eval`

> Ambiguous across parallel workflows, silently grabs yesterday's workflow across session gaps, requires a magic freshness threshold.

- [human-auditable] rejected-alternative rationale bullet; no behavior promise to prove

Proposed: dominant `human-auditable`, verdict **not-a-claim**.
Note: Discovery extracted a rejected-design bullet as a claim. This is a discovery extraction issue, not a tag misroute; excluded from tag-accuracy tallies and motivating a split/not-a-claim lane in the schema work.

### claim-docs-contracts-claim-discovery-workflow-md-200

`docs/contracts/claim-discovery-workflow.md:200` — heuristic tag: `cautilus-eval`

> After the deterministic pass, Cautilus Agent should show a separate review plan:

- [deterministic] review-plan payload computed and exposed deterministically
- [cautilus-eval] agent shows the review plan after the deterministic pass, at the right point in sequence

Proposed: dominant `cautilus-eval`, verdict **too-coarse**.

### claim-docs-contracts-claim-discovery-workflow-md-528

`docs/contracts/claim-discovery-workflow.md:528` — heuristic tag: `cautilus-eval`

> Each action bucket should include `byReviewStatus` and `byEvidenceStatus` counts so a human can tell whether the queue is already reviewed enough to spend time on or still needs agent triage first.

- [deterministic] action buckets include byReviewStatus and byEvidenceStatus counts
- [human-auditable] counts let a human triage queue readiness

Proposed: dominant `deterministic`, verdict **wrong**.
Note: Schema/packet behavior; no model in the loop.

### claim-docs-contracts-runner-readiness-md-111

`docs/contracts/runner-readiness.md:111` — heuristic tag: `cautilus-eval`

> `doctor` should not infer that a runner shares production behavior by reading arbitrary app code.

- [deterministic] doctor does not read arbitrary app code to infer runner readiness (negative behavior of the Go binary)

Proposed: dominant `deterministic`, verdict **wrong**.
Note: Doctor is deterministic Go; a negative code-path test proves this.

### claim-docs-contracts-runner-readiness-md-359

`docs/contracts/runner-readiness.md:359` — heuristic tag: `cautilus-eval`

> A simple app repo can adopt Cautilus with one headless product runner without adopting the full eval-live instance model.

- [deterministic] adapter schema accepts a single headless product runner without eval-live instances
- [deterministic] onboarding smoke passes on that minimal consumer shape
- [human-auditable] adoption is workable for a real operator

Proposed: dominant `deterministic`, verdict **wrong**.

### claim-docs-contracts-runtime-fingerprint-improvement-md-261

`docs/contracts/runtime-fingerprint-improvement.md:261` — heuristic tag: `cautilus-eval` — dominance reads both ways (scoring footnote)

> This sequence keeps the evidence honest before asking improve search to mutate prompts more aggressively.

- [human-auditable] ordering rationale: the sequence keeps evidence honest
- [deterministic] sequence is enforced before improve-search prompt mutation

Proposed: dominant `human-auditable`, verdict **wrong**.
Note: Pure rationale sentence; the heuristic has a human-auditable rationale class, so tagging it cautilus-eval is a misroute to an existing class. Dominance reading (rationale vs enforcement) flagged debatable.

### claim-docs-specs-contracts-active-run-workspace-spec-md-13

`docs/specs/contracts/active-run-workspace.spec.md:13` — heuristic tag: `cautilus-eval`

> Cautilus can allocate and remember a per-run workspace for a workflow, but command artifacts own workflow metadata; the active-run marker resumes the same bounded workflow without turning local workspace contents into product-owned behavior.

- [deterministic] per-run workspace allocation and active-run marker resume work
- [deterministic] workspace contents stay out of product-owned packets (boundary)
- [human-auditable] bounded-workflow resumption semantics match operator intent

Proposed: dominant `deterministic`, verdict **wrong**.

### claim-docs-specs-index-spec-md-12

`docs/specs/index.spec.md:12` — heuristic tag: `cautilus-eval` — dominance reads both ways (scoring footnote)

> **proven** — a checked-in executable spec runs the behavior live and asserts on the result

- [human-auditable] the proven-badge definition is stated and stable vocabulary
- [deterministic] every badge shown as proven links to an executable spec that runs live (projection check)

Proposed: dominant `human-auditable`, verdict **wrong**.
Note: A definition line; the enforceable part is a deterministic projection check.

### claim-docs-specs-ledger-promise-ledger-spec-md-15

`docs/specs/ledger/promise-ledger.spec.md:15` — heuristic tag: `cautilus-eval`

> [Behavior Evaluation](../../docs/specs/user/evaluation.spec.md): Cautilus evaluates intentful behavior across supported `dev` and `app` surfaces.

- [deterministic] eval commands execute across dev and app surfaces
- [cautilus-eval] the evaluation actually judges intentful behavior (semantic verdicts are sound)
- [deterministic] supported-surface list matches reality

Proposed: dominant `cautilus-eval`, verdict **too-coarse**.
Note: The flagship Behavior Evaluation promise; exactly the reasoning-soundness work.

### claim-docs-specs-user-doctor-readiness-spec-md-222

`docs/specs/user/doctor-readiness.spec.md:222` — heuristic tag: `cautilus-eval`

> A user can get a safe next workflow branch before spending workflow budget.

- [deterministic] doctor emits a next workflow branch from readiness state
- [deterministic] branch catalog never recommends launching when the runner is unready (safety)

Proposed: dominant `deterministic`, verdict **wrong**.
Note: Safety is encoded in the deterministic branch catalog.

### claim-docs-specs-user-index-spec-md-22

`docs/specs/user/index.spec.md:22` — heuristic tag: `cautilus-eval`

> The shared-concern section keeps workflow-wide rules and risks visible.

- [deterministic] shared-concern section exists and enumerates workflow-wide rules
- [human-auditable] the enumerated rules are genuinely the workflow-wide ones and readable

Proposed: dominant `deterministic`, verdict **wrong**.

### claim-skills-cautilus-agent-skill-md-219

`skills/cautilus-agent/SKILL.md:219` — heuristic tag: `cautilus-eval`

> Agents should read the packet first, then cite HTML only when a browser view is the deliverable.

- [deterministic] packet-first instruction present in the skill text
- [cautilus-eval] agents actually read the packet first and cite HTML only for browser deliverables

Proposed: dominant `cautilus-eval`, verdict **too-coarse**.

### claim-docs-contracts-adapter-contract-md-407

`docs/contracts/adapter-contract.md:407` — heuristic tag: `human-auditable`

> This keeps prompt benchmarking, code-quality benchmarking, and workflow smoke tests from collapsing into one overloaded adapter file.

- [human-auditable] rationale: separation prevents one overloaded adapter file
- [deterministic] adapter schema actually separates benchmarking and smoke concerns

Proposed: dominant `human-auditable`, verdict **too-coarse**.

### claim-docs-contracts-claim-discovery-workflow-md-180

`docs/contracts/claim-discovery-workflow.md:180` — heuristic tag: `human-auditable`

> That selected map should drive status summaries and inspect/refresh branch commands, while `state_path` remains the default output path for first discovery.

- [deterministic] status/inspect/refresh commands read the selected map
- [deterministic] state_path remains the default first-discovery output

Proposed: dominant `deterministic`, verdict **wrong**.
Note: Fully deterministic CLI behavior.

### claim-docs-contracts-claim-discovery-workflow-md-262

`docs/contracts/claim-discovery-workflow.md:262` — heuristic tag: `human-auditable`

> Historical observation and provider-caveat statements can inform future scenarios, but they should stay `human-auditable` and `blocked` until promoted into a concrete regression claim.

- [deterministic] heuristic labels observation/provider-caveat statements human-auditable and blocked
- [human-auditable] promotion policy rationale

Proposed: dominant `deterministic`, verdict **wrong**.
Note: The labeling behavior itself is testable pipeline code.

### claim-docs-contracts-claim-discovery-workflow-md-558

`docs/contracts/claim-discovery-workflow.md:558` — heuristic tag: `human-auditable`

> Depth 3 must be paired with visible source, candidate, cluster, and review-budget bounds.

- [deterministic] depth-3 discovery runs emit source, candidate, cluster, and review-budget bounds

Proposed: dominant `deterministic`, verdict **wrong**.

### claim-docs-contracts-claim-discovery-workflow-md-689

`docs/contracts/claim-discovery-workflow.md:689` — heuristic tag: `human-auditable`

> LLM-backed cluster review should come after the deterministic packet and skill control flow are stable enough to dogfood.

- [human-auditable] sequencing guidance for future review tuning (explicitly blocked until promoted)

Proposed: dominant `human-auditable`, verdict **exact**.

### claim-docs-contracts-runner-readiness-md-172

`docs/contracts/runner-readiness.md:172` — heuristic tag: `human-auditable`

> This document owns assessment existence, scope, freshness, proof class, and recommendation.

- [human-auditable] doc-ownership statement: no competing doc owns these assessment fields
- [deterministic] the named fields exist in the assessment schema

Proposed: dominant `human-auditable`, verdict **too-coarse**.

### claim-docs-contracts-scenario-proposal-sources-md-40

`docs/contracts/scenario-proposal-sources.md:40` — heuristic tag: `human-auditable`

> The proposal engine should read from four source ports.

- [deterministic] proposal engine reads from four source ports

Proposed: dominant `deterministic`, verdict **wrong**.
Note: A unit test on the engine proves this directly.

### claim-docs-specs-contracts-claim-discovery-workflow-spec-md-17

`docs/specs/contracts/claim-discovery-workflow.spec.md:17` — heuristic tag: `human-auditable`

> Discovery emits source-ref-backed candidates from configured entry documents and linked Markdown within the declared depth bounds.

- [deterministic] discovery emits source-ref-backed candidates within declared depth bounds

Proposed: dominant `deterministic`, verdict **wrong**.
Note: Lives in a spec file that can assert it executably.

### claim-docs-specs-rules-evidence-gaps-spec-md-3

`docs/specs/rules/evidence-gaps.spec.md:3` — heuristic tag: `human-auditable`

> Discovered or reviewed promises should not be treated as satisfied until valid evidence is attached, and missing or weak evidence should remain visible until the claim is proven, narrowed, deferred, or removed.

- [deterministic] evidence-state keeps missing or weak evidence visible until resolved
- [human-auditable] the do-not-treat-as-satisfied policy stance

Proposed: dominant `deterministic`, verdict **wrong**.
Note: The renderer enforces the visibility rule deterministically.

### claim-docs-specs-user-doctor-readiness-spec-md-12

`docs/specs/user/doctor-readiness.spec.md:12` — heuristic tag: `human-auditable`

> Instead, it uses a repo-owned adapter so the user can declare how Cautilus should inspect and evaluate that repo.

- [deterministic] doctor reads the repo-owned adapter instead of hardcoded inspection
- [human-auditable] a user can express inspection/eval intent through the adapter vocabulary

Proposed: dominant `deterministic`, verdict **wrong**.

### claim-docs-specs-user-ownership-spec-md-4

`docs/specs/user/ownership.spec.md:4` — heuristic tag: `human-auditable`

> Using the `cautilus init adapter`, `cautilus doctor adapter`, and `cautilus doctor` CLI commands with the `cautilus-agent` skill, a user can keep host-owned execution in place while Cautilus standardizes workflow packets and boundaries.

- [deterministic] named CLI commands exist and operate the adapter
- [human-auditable] host-owned execution is preserved (boundary audit across docs, code, adapter)
- [cautilus-eval] agent plus CLI workflow standardizes packets in practice

Proposed: dominant `human-auditable`, verdict **too-coarse**.

### claim-skills-cautilus-agent-skill-md-129

`skills/cautilus-agent/SKILL.md:129` — heuristic tag: `human-auditable`

> Maintainer-facing claims may use internal terms, but they must stay aligned with the user-facing claim specs and preserve source refs, proof route, evidence status, and next action.

- [deterministic] claim projections preserve source refs, proof route, evidence status, next action
- [human-auditable] maintainer-facing vocabulary stays aligned with user-facing claim specs

Proposed: dominant `human-auditable`, verdict **too-coarse**.
