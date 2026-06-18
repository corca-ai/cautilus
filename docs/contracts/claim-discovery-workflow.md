# Claim Discovery Workflow

## Problem

`cautilus discover claims` currently emits a deterministic, source-ref-backed proof-plan skeleton.
That is useful as a fast inventory, but it is not yet the workflow users expect when they ask an agent to "use Cautilus" on a repo.
A real user wants to know which declared behavior claims exist, which ones are already covered by deterministic tests or existing Cautilus evidence, which ones still need evaluator-backed scenarios, and which surfaces must be aligned before verification is honest.

The product should preserve a simple user-facing entry point while keeping the product boundary clean:
for claim discovery and claim review, the binary owns deterministic packet production and state transitions, and the Cautilus Agent owns agent orchestration, LLM-backed claim review, subagent fanout, user confirmation, and next-action conversation.

## Current Slice

This contract defines the claim-discovery workflow boundary around four decisions:

- `discover` remains the one high-level user action for initial claim discovery.
- The binary owns deterministic packet production: scan traversal, extraction-input packets, anchoring validation, and state transitions.
- The Cautilus Agent owns claim extraction (following the product-owned extraction template), evidence reconciliation, and user-facing status.
- Existing claim state refresh is selected by Cautilus Agent when it detects a prior JSON packet, but the refresh plan and state transition must be recorded in deterministic packets or helper output.
  It does not require a separate binary `claim refresh` command.

## User Workflow

The primary user flow starts from an agent session, not from a human reading a CLI manual.

1. User invokes the Cautilus Agent with no specific input or with a broad request such as "use Cautilus on this repo."
2. Cautilus Agent checks adapter availability, current claim-state artifacts, and recent git history.
3. If no useful prior claim state exists, Cautilus Agent proposes a scan scope before starting.
4. The user confirms or adjusts the deterministic scan scope.
5. Cautilus Agent calls `discover claims extraction-input` to emit the deterministic extraction-input packet: sources with content hashes, the embedded extraction template, and bounds.
6. Cautilus Agent shows the extraction budget: source count, content size, excerpt bounds, the batch plan with expected batch count, and stop reasons.
7. The user confirms or adjusts the extraction budget separately from the scan scope.
8. Cautilus Agent extracts claims by following the embedded template over the packet sources, in bounded batches.
9. Cautilus Agent calls `discover claims apply-extraction`, which anchors every verbatim excerpt, rejects unanchored claims into the extraction audit, and composes the proof-plan packet.
10. Cautilus Agent reconciles likely existing evidence from tests, specs, eval summaries, and checked artifacts.
11. Cautilus Agent summarizes status and asks which next action to take.

Running `discover claims` directly, without the Cautilus Agent, emits the deterministic heuristic baseline (`extractionMode: heuristic`) with no model calls; this is the reproducible floor for no-model environments, CI regeneration, and control tests.

If prior claim state exists, step 5 becomes a diff-aware refresh selected by Cautilus Agent:
Cautilus Agent uses the previous packet, the previous commit recorded in that packet, and a deterministic refresh plan to decide which sources need rescanning or re-review.
The public binary does not need a separate `claim refresh` command for this.

## Product Boundary

### Binary Responsibilities

The binary should own deterministic behavior that can be rerun without model access:

- resolve the repo root and adapter
- read adapter-owned claim discovery configuration
- enumerate the configured entry sources
- follow repo-local Markdown links up to the configured depth
- emit a source-ref-backed claim skeleton
- preserve stable source inventory, discovered source graph, claim IDs, and source hashes
- perform cheap deterministic evidence preflight when the evidence path is mechanical
- resolve claim-state paths from adapter policy
- produce refresh plans from prior packets and git diffs when Cautilus Agent asks for them
- validate and normalize claim-state packets

The binary must not own LLM provider selection, subagent scheduling, model prompts, review policy, or human conversation.
Those belong to Cautilus Agent and the host agent runtime.

### Skill Responsibilities

The Cautilus Agent should own orchestration that depends on an agent:

- decide whether to run first discovery, refresh prior state, or show current status
- explain the scan scope to the user and ask for confirmation before broad discovery
- call `cautilus discover claims extraction-input` with the agreed scope
- show the extraction budget and ask separately before extracting
- extract claims by following the product-owned extraction template, with verbatim source excerpts, classification routing, and a bounded output schema
- submit the extraction result to `apply-extraction` so the binary anchors excerpts and composes the proof plan
- reconcile existing deterministic and evaluator evidence
- summarize status for the user
- offer next actions such as generating eval scenario drafts, adding deterministic tests, resolving alignment work, or showing a full report

This keeps the product agent-first without making the binary a host-specific agent runtime.
The extraction seam contract — template, packet schemas, anchoring, and fingerprint semantics — lives in [claim-extraction-template.md](./claim-extraction-template.md).

### Canonical Claim Specs

Claim packets are high-recall proof-planning inputs.
They are not the primary human review surface once the maintainer is judging product meaning, duplication, audience fit, or next-action grouping.

When packet claims are too granular to review directly, the Cautilus Agent should curate two canonical claim indexes before continuing HITL:

- a user-facing spec index in plain product language that explains what the repo promises to a reader
- a maintainer-facing spec index that may use internal vocabulary but maps back to the user-facing claims

For a product with clear top-level jobs, the user-facing spec index should order claims by the user's feature mental model before cross-cutting implementation promises.
In this repo's Cautilus spec tree, that means `claim`, `eval`, `improve`, then `doctor` or readiness, followed by supporting promises such as portability, packet/reporting surfaces, and proof-debt visibility.
In other repos, the same rule should be driven by the repo's adapter, README, and source docs rather than by Cautilus-specific command names.
The user-facing index should stay short and link to one spec page per major claim.
Each claim spec page should keep subclaims, source references, intended proof route, evidence status, and the next action needed to prove or repair the claim.
Review packets and machine-readable curation artifacts should preserve absorbed raw claim ids and fingerprints when available.
The spec tree is a manually maintained or review-applied source document, not a generated status report block.
It may be part of the next discovery entry graph through README links, while volatile generated reports and JSON packets remain evidence or state artifacts.
When a repo maintains canonical catalogs, it should also keep a machine-readable mapping artifact that projects raw claim ids onto canonical user-facing or maintainer-facing claim ids.
That artifact is audit evidence for compression quality: it should show how many raw user claims were absorbed by the user-facing spec tree, which canonical claim absorbed each raw claim, and which raw claims still need catalog review.
The binary may validate packet shape, render summaries, and expose command help, but semantic normalization, duplicate merging, and audience-aligned wording remain Cautilus Agent or reviewer work.
This avoids asking humans to approve hundreds of sentence-level candidates when the real decision is the smaller promise map.

## Scan Scope

Default discovery starts from entry surfaces and follows only repo-local Markdown links.
The default entry set is:

- `README.md`
- `AGENTS.md`
- `CLAUDE.md` when it exists as a distinct instruction surface.
  A symlink alias to the same canonical file is not a separate source.
- adapter-configured `claim_discovery.entries`

The default Markdown link depth is `3`.
Depth counts only links from discovered Markdown sources to other repo-local Markdown sources.
It does not traverse arbitrary source files, generated artifacts, binary files, dependency directories, or external URLs.
Discovery also honors the repo's `.gitignore` for every path selection route, including default entries, adapter entries, explicit `--source` paths, linked docs, and include globs.
This keeps generated spec reports and latest artifact bundles out of the source claim graph without inventing a Cautilus-specific generated-block marker.
When different real files declare the same normalized claim text, discovery should emit one claim candidate and preserve every declaration location in `sourceRefs`.
Semantic duplicates with different wording are grouping/review work, not deterministic source dedupe.

This entry-surface boundary is also the product's false-negative boundary.
`discover claims` is expected to find declared claims in README-like entry documents and linked docs, not every latent user-facing behavior hidden in code, transcripts, issue threads, or private operator memory.
If a declared claim is inside the configured entry documents or their linked docs graph and deterministic discovery misses it, that is a `discover claims` false-negative bug.
If a core user-facing feature is not stated in that graph, deterministic discovery may miss it without being wrong.
That out-of-scope miss is a product signal that the repo's public narrative or adoption surface is underspecified.
The Cautilus Agent, `charness:quality`, `charness:narrative`, or a human reviewer may still explore the codebase and discover such missing public claims.
Those findings should be recorded as narrative, catalog, alignment, or documentation work before expecting `discover claims` to emit them by default.

The adapter may override entries, depth, include globs, and exclude globs:

```yaml
claim_discovery:
  entries:
    - README.md
    - AGENTS.md
  linked_doc_depth: 3
  include:
    - docs/**/*.md
  exclude:
    - artifacts/**
    - node_modules/**
    - docs/specs/old/**
    - docs/maintainers/**
    - docs/internal/handoff.md
    - docs/internal/research/**
  state_path: .cautilus/claims/latest.json
  related_state_paths:
    - role: reviewed
      path: .cautilus/claims/reviewed.json
    - role: evidenced
      path: .cautilus/claims/evidenced.json
  evidence_roots:
    - .cautilus/claims
    - docs/specs
  audience_hints:
    user:
      - README.md
      - docs/guides/**
    developer:
      - AGENTS.md
      - docs/internal/**
  classification_hints:
    non_claim_section_headings:
      - Rejected Alternatives
    claim_lexicon_terms:
      - 니다
      - 한다
  semantic_groups:
    - label: Product promises
      terms:
        - user
        - promise
        - behavior
```

`audience_hints` is adapter-owned because user-versus-developer meaning depends on the repo's documentation layout.
When hints are absent, the binary applies portable path defaults: `README.md` and user/spec/guide paths are `user`, `AGENTS.md`, `CLAUDE.md`, `docs/**`, `specs/**`, `skills/**`, `plugins/**`, and `.agents/**` are `developer`, and unfamiliar paths remain `unclear`.
The binary only understands the portable labels `user`, `developer`, and `unclear`; richer semantic grouping remains review work for Cautilus Agent and reviewer loop.
`semantic_groups` is also adapter-owned because product areas differ across repos.
When the adapter omits semantic groups, the binary emits `General product behavior` instead of using a Cautilus-specific taxonomy.
`classification_hints.non_claim_section_headings` is adapter-owned for the same reason: which headings mark non-claim prose (rejected alternatives, non-goals, out-of-scope lists) is a repo documentation convention, not a product constant.
The binary ships a portable default list (currently `Deferred Decisions`, generalized from this repo's measured misextraction) and merges adapter headings into it; defaults are unioned, never replaced, and the merged list is what `effectiveScanScope.nonClaimSectionHeadings` reports.
The binary applies the merged headings deterministically during extraction; lines under a matching heading are dropped before claim-shaped filtering.
Matching is case-insensitive against the heading text as written, so a hint must mirror any markdown emphasis or punctuation the heading carries.
The filter covers lines directly under the configured heading only; a nested subsection introduces its own heading and is not filtered, so keep non-claim sections flat or list each subsection heading explicitly.
`classification_hints.claim_lexicon_terms` is the second adapter-owned hint family: repo-owned claim vocabulary that extends (never replaces) the built-in English claim-verb lexicon during claim-shaped filtering.
Adapter terms match as case-insensitive substrings rather than space-padded tokens, because agglutinative predicates (for example Korean sentence-final endings such as `니다`, `한다`, `해야`) carry no space boundaries; the built-in English defaults keep token matching to avoid short-word false positives.
Claim-shaped length bounds count runes, not bytes, so multibyte scripts get the same 20–260 sentence budget as ASCII.
A line that matched only an adapter lexicon term and that no portable routing case in the classifier recognizes is not dropped: it routes through a portable fallback (`recommendedProof=human-auditable`, `verificationReadiness=blocked`, `reviewStatus=heuristic`) so non-English claims stay visible for agent or human review instead of silently vanishing inside the English routing switch.
The configured terms are reported in `effectiveScanScope.claimLexiconTerms`.
For measurement and hint dry-runs on a repo the operator cannot or should not write to, `discover claims --adapter <adapter.yaml>` applies an explicit adapter file without touching the scanned repo; ratified hints still belong in the consumer repo's own adapter.
Seeding these hints is Cautilus Agent onboarding work: scan the entry documents for rejected-alternative and non-goal section conventions and for the repo's claim vocabulary, propose the hint lists with before/after extraction counts, and let the maintainer ratify them into the adapter before the first broad discovery, so repo-specific classification knowledge lives in the adapter instead of accumulating as hardcoded engine rules.

A classification behavior is promoted from engine hardcoding to an adapter-owned hint family only when all three hold: it encodes a repo documentation convention that genuinely varies across repos, a gold-set-style measurement shows the hardcoded form misclassifies, and the Cautilus Agent can propose it for maintainer ratification.
Extraction mechanics (code-fence and frontmatter skipping, heading tracking, duplicate merge) stay product-owned and never become hints; unbounded knob growth is itself a failure mode the adapter contract rejects.
The frozen-defaults golden test (`TestClaimClassificationPortableDefaultsAreFrozen`) pins the portable default lexicon and non-claim headings, so any new hardcoded default surfaces as a test diff that forces a matching contract update here.
Claim extraction and proof routing are agent-primary: the Cautilus Agent extracts claims by following a product-owned extraction template — the claim definition, the repo's non-claim conventions sourced from the same `classification_hints`, mandatory verbatim source excerpts with source refs, and a bounded output schema.
The binary anchors and audits: it keeps traversal and scan scope, verifies that every quoted excerpt actually exists at its claimed source ref, computes claim fingerprints from the verbatim excerpts, owns refresh planning and carry-forward, and rejects unanchored claims during validation.
Recorded git commits plus per-source hashes bound re-extraction cost: unchanged sources carry forward deterministically and only git-diff-changed sources return to the agent, per the existing refresh design.
The deterministic heuristic extractor is the explicitly labeled baseline mode (`extractionMode` in the packet), so no-model environments, CI regeneration, and adapter-not-hardcoded control tests keep a reproducible floor.
The maintainer-ratified gold set is the eval fixture that measures agent extraction quality against those labels.
The detailed extraction template and packet contract live in [claim-extraction-template.md](./claim-extraction-template.md).
`state_path` is the writable discovery baseline for `discover claims`; `related_state_paths` are read-only orientation hints for reviewed, evidenced, or promoted claim packets that `doctor status` can summarize without making them the next discovery target.
`doctor status` should use the most advanced non-stale related claim packet as the selected orientation map when it is more useful than the writable baseline.
That selected map should drive status summaries and inspect/refresh branch commands, while `state_path` remains the default output path for first discovery.
`evidence_roots` are read-only roots for deterministic possible-evidence preflight; they may add `possibleEvidenceRefs` to review input, but they never mark claims satisfied.
Repos should use this split to keep executable specs and maintainer appendices out of ordinary prose claim discovery when those files are proof or operator evidence rather than public promises.
For example, `docs/specs/old/**` can be excluded from claim sources while the active claim spec tree remains linked from README and old proof specs remain evidence or archive material.

Before running a first broad scan, Cautilus Agent should say which entries and depth it will use.
It should also show the deterministic bounds that will be applied:

- maximum sources
- maximum claims per source
- maximum excerpt characters
- excluded paths or globs
- whether dirty working-tree files are in scope

Cautilus Agent should ask the user to confirm or adjust that scope.
After confirmation, the binary should record the effective scope in the packet so a future agent can reproduce or refresh the run.

## Model-Spend Confirmation

Scope confirmation never authorizes model spend.
Each stage that spends model budget shows its own plan and gets its own confirmation; scan-scope confirmation covers reading the configured sources and emitting deterministic packets, nothing more.
If the user already delegated autonomous continuation, Cautilus Agent may proceed within the recorded budget, but the budget still must be written to the packet.

### Extraction budget confirmation

On the primary path, after `extraction-input` emits the deterministic packet, Cautilus Agent shows the extraction budget before extracting:

- source count
- content size
- excerpt bounds (`maxClaimsPerSource`, `maxExcerptChars`)
- batch plan and expected batch count
- stop reasons

The user confirms or adjusts that budget before the Cautilus Agent extracts, and the applied packet records it.

### Review budget confirmation

When the review seam runs — stale-evidence re-entry, human-review upgrade queues, or LLM review over heuristic-mode packets — Cautilus Agent shows the review plan before launching subagents or other LLM-backed review:

- claims selected for review and the selection policy
- cluster count and skipped clusters with reasons
- maximum subagents or parallel review lanes
- maximum clusters per subagent
- maximum excerpt characters or tokens per cluster
- retry policy and stop reasons

The user confirms or adjusts that review budget before review starts, and the packet records it with its source.

## Claim Model

The packet separates proof mechanism, verification readiness, evidence status, review status, and lifecycle into distinct fields:

```json
{
  "claimId": "claim-readme-md-9",
  "summary": "Commands should emit durable packets with enough state for the next agent to resume.",
  "sourceRefs": [],
  "claimFingerprint": "sha256:...",
  "recommendedProof": "cautilus-eval",
  "recommendedEvalSurface": "dev/repo",
  "verificationReadiness": "ready-for-proof",
  "evidenceStatus": "missing",
  "reviewStatus": "agent-reviewed",
  "lifecycle": "new",
  "claimAudience": "user",
  "claimSemanticGroup": "Packets and reporting",
  "groups": ["agent-first-packets"],
  "evidenceRefs": [],
  "nextActions": []
}
```

`recommendedProof` answers how the claim should be proven:

- `human-auditable`
- `deterministic`
- `cautilus-eval`

`human-auditable` does not mean human-only or evidence-free.
It means an agent should not mark the claim satisfied without human judgment, but the judgment still needs at least one concrete support item such as a source comparison, command output, test, spec, fixture result, eval summary, reviewed transcript, or explicit counterexample search.
If no concrete evidence could make the judgment more honest, the text is probably philosophy, roadmap, or positioning rather than a proof target and should be split or deferred instead of marked satisfied.

Broad positioning or aggregate product promises should stay `human-auditable` and `verificationReadiness=blocked` until they are decomposed into concrete deterministic checks, scenario candidates, or Cautilus eval claims.
The claim should remain visible in the packet, but it should not become a fixture plan by default because one passing fixture would overclaim the umbrella promise.
Product-direction statements and operator-policy rules follow the same boundary.
They may be important durable guidance, but they are not ready eval targets until they are split into concrete behavior, deterministic gate, or audited-process claims.
Markdown glossary bullets that only define a code-styled label, such as `` `alignment-work`: ... ``, should not become claim candidates by default.
Ownership-boundary explanations, such as product-owned versus adapter-owned responsibilities, should stay `human-auditable` and `needs-alignment` until the matching docs, code, adapters, and tests are reconciled.
YAML frontmatter is metadata, not claim prose.
Command, packet, runner, and readiness statements should prefer deterministic proof unless they explicitly depend on model or agent behavior.
CLI summary packets that mention bounded candidate examples, `gitState`, or schema names are still deterministic packet contracts, even when the summary says agents use those candidates for branch selection.
Review-prompt render, path, prompt-input, schema, compare-question, report-artifact, and durable-boundary contracts are deterministic unless the claim is about the model's judgment or a skill's review workflow behavior.
Historical observation and provider-caveat statements can inform future scenarios, but they should stay `human-auditable` and `blocked` until promoted into a concrete regression claim.

`claimId` is a display handle and packet reference.
Refresh matching should use `claimFingerprint`, not source line number alone.
The fingerprint is the sha256 of the normalized primary verbatim excerpt (ratified 2026-06-10); in heuristic mode the stored excerpt equals the normalized summary, so this matches the shipped implementation, and the full rule lives in [claim-extraction-template.md](./claim-extraction-template.md).
Line number is a locator, not identity.

`verificationReadiness` answers whether verification can start:

- `ready-for-proof`
- `needs-scenario`
- `needs-alignment`
- `blocked`

`evidenceStatus` answers whether the repo already has proof:

- `satisfied`
- `missing`
- `partial`
- `stale`
- `unknown`

`reviewStatus` answers how far the label has been reviewed:

- `heuristic`
- `agent-reviewed`
- `human-reviewed`

`lifecycle` answers how this claim relates to prior state:

- `new`
- `carried-forward`
- `changed`
- `retired`

`claimAudience` answers who would most directly rely on the claim:

- `user`
- `developer`
- `unclear`

Review results may update `claimAudience` when agent or human review finds that the configured source hint was too narrow.
For example, adapter-author or operator-facing contracts are still user-facing when the Cautilus user is the repo maintainer creating the adapter.
When `discover claims apply-review` applies such an update, `claimAudienceSource` becomes `review-result`.

`claimSemanticGroup` is a deterministic review-batching hint.
It is not a final taxonomy; the Cautilus Agent or human reviewer may correct it during review.

Agents and validators read these split fields directly; there is no derived compatibility label.

## Packet Semantics

The packet must not imply proof from weak evidence.
The first valid-state rules are:

- `evidenceStatus=satisfied` requires at least one `evidenceRefs[]` entry with `matchKind=verified` or `matchKind=direct`, a source commit or source hash, and an evidence commit or content hash.
- `evidenceStatus=satisfied` also requires `reviewStatus=agent-reviewed` or `reviewStatus=human-reviewed`.
- `matchKind=possible` can produce only `evidenceStatus=unknown` or `evidenceStatus=partial`.
- `verificationReadiness=ready-for-proof` with `evidenceStatus=missing` means proof is absent but a test, fixture, or human-auditable check can now be created or run.
- `verificationReadiness=needs-scenario` means the claim is not ready for a protected eval fixture yet.
- `verificationReadiness=needs-alignment` means at least two truth surfaces must be reconciled before proof would be honest.
- `lifecycle=changed` describes changed claim source or claim meaning.
- `evidenceStatus=stale` describes changed evidence anchors, commits, hashes, or validity.
- Human review can accept a claim's framing or proof route, but it does not by itself satisfy the claim unless a direct or verified evidence ref also supports that claim.

`evidenceRefs[]` should use a minimum inspectable shape:

```json
{
  "refId": "evidence-spec-command-surfaces-1",
  "kind": "spec | test | fixture | eval-summary | eval-observed | report | human-note | cautilus-claim-evidence-bundle",
  "path": "docs/specs/user/claim-discovery.spec.md",
  "line": 36,
  "artifactSchemaVersion": "cautilus.evaluation_summary.v1",
  "commit": "abc123",
  "contentHash": "sha256:...",
  "matchKind": "possible",
  "supportsClaimIds": ["claim-readme-md-9"],
  "reviewedBy": "heuristic",
  "reviewedAt": "2026-04-26T00:00:00Z"
}
```

Use `eval-summary` for the bounded Cautilus decision packet.
Use `eval-observed` for the runner-written observed packet such as `eval-observed.json`.
Use `fixture` only for a checked-in fixture or scenario input, not for the observed output produced by a runner.

`matchKind` values are:

- `possible`
- `verified`
- `direct`
- `contradictory`
- `superseded`

## Evidence Reconciliation

`discover` should eventually produce status, not only candidates.
The binary can do cheap deterministic preflight, but Cautilus Agent owns final interpretation.

Deterministic preflight may inspect:

- checked-in test files and fixture names
- `docs/specs/*.spec.md` executable proof blocks
- adapter-declared Cautilus eval summary roots
- explicit packet references
- active-run conventions that the adapter or command output records
- command registry examples and schema fixtures

The preflight should never assert that a claim is satisfied solely because a filename looks related.
It may attach candidate `evidenceRefs` with `matchKind=possible`.
Cautilus Agent review can upgrade them to `satisfied`, `partial`, `stale`, or `missing` only when the packet semantics above are met.

`stale` should be used when an evidence ref or evidence commit/hash changed since the last reviewed claim-state packet.
`unknown` should be used when the workflow did not inspect enough evidence to make an honest statement.

## Review Seam

Agent extraction labels claims as it extracts, so agent-extracted claims arrive `agent-reviewed` and the review seam serves the queues that still need review afterward: stale-evidence re-entry, human-review upgrades through HITL and `apply-review`, and LLM review over heuristic-mode packets.
Review runs over bounded clusters, and claim packets carry grouping hints that make cluster selection efficient:

- source path
- source section
- recommended proof
- recommended eval surface
- repeated noun phrases or command names
- source graph neighborhood

Cautilus Agent reviews clusters in priority order:

1. entry-surface claims from README and AGENTS
2. `cautilus-eval` candidates
3. `needs-alignment` candidates
4. claims touching command families, skill routing, adapter contracts, or release/install surfaces
5. deterministic and human-auditable claims with weak or missing evidence refs
6. lower-priority duplicate or long-tail doc claims

Subagents receive clusters with source excerpts, source refs, candidate labels, possible evidence refs, and a bounded output schema.
They return merged claims, corrected labels, false-positive removals, possible false-negative questions, evidence-status judgments, and unresolved questions.
The parent Cautilus Agent merges results and keeps review provenance in the packet.

The review seam uses versioned packets:

- `cautilus.claim_review_input.v1`
- `cautilus.claim_review_result.v1`

Those packets record cluster IDs, candidate IDs, source refs, prompt/reference hashes, runtime/model identity when available, merge decisions, label changes, evidence-status reasons, unresolved questions, and skipped clusters.

## Stored State

The binary should resolve the repo-owned checked or ignored state path from adapter policy.
The default design target is:

```text
.cautilus/claims/latest.json
```

The packet should record:

- schema version
- source root
- git commit reviewed
- effective scan scope
- source inventory
- source graph
- state path resolution
- extraction mode and candidate count
- claim records
- extraction audit for agent-mode packets (applied, rejected, and stale-source records)
- refresh plan when prior state was used
- review budget and review budget source
- review runs
- evidence scan summary
- next recommended actions

Whether `.cautilus/claims/latest.json` is committed is a repo policy decision.
Cautilus should support either checked-in durable state or local ignored working state as long as the packet is explicit.

## Existing State Refresh

Refresh is a skill behavior over the same `discover` entry point.
The user should not need to learn a separate `claim refresh` command.

When a previous claim-state packet exists, Cautilus Agent should:

1. read the prior packet and its reviewed commit
2. ask the binary for a deterministic refresh plan from that packet and the chosen target
3. show the binary-owned `refreshSummary`: whether the saved claim map is current, how many sources and claims changed, which source files concentrate the changed claims, what was not updated yet, and the recommended next choices
4. call the binary for affected sources or the effective entry graph
5. carry forward unchanged claims
6. mark claims with changed source or meaning as `changed`
7. mark claims with changed evidence anchors as `evidenceStatus=stale`
8. retire claims whose source refs disappeared
9. re-extract only the changed sources after extraction-budget confirmation, and route high-impact stale evidence through the review seam after review-budget confirmation

The binary may provide helper flags such as `discover claims --previous <packet> --refresh-plan`, but the public user-level workflow remains `discover`.
No separate binary `claim refresh` command is planned for this stage.
When Cautilus Agent runs `discover claims --previous <packet>` for the actual refreshed proof plan, unchanged claim fingerprints carry forward reviewed labels, evidence refs, unresolved questions, and next-action state.
When `--output` points at an existing claim packet and neither `--previous` nor `--from-scratch` is given, the binary auto-uses the existing output as the previous packet so silent loss of reviewed state is not possible by omission; operators pass `--from-scratch` to opt into first-discovery semantics on top of an existing packet.
`discover claims validate` also surfaces missing carry-forward audit summaries on packets that already carry reviewed or evidenced state, so refreshes that lost the audit block fail validation instead of passing silently.
If a line-number-derived display `claimId` changes while the fingerprint remains stable, carried evidence refs rewrite `supportsClaimIds` to the current claim id before validation.
Direct or verified carried evidence refs with `contentHash` are not blindly trusted.
The refreshed proof plan rechecks repo-local evidence files, marks the claim `evidenceStatus=stale` when a referenced file is missing, changed, outside the repo root, or when a `cautilus.claim_evidence_bundle.v1` does not list the current claim id in `createdForClaimIds`, and records stale evidence counts in `carryForward`.

The refresh-plan packet should include a coordinator-facing summary rather than requiring every agent to reverse-engineer raw JSON fields:

- `status`
- `summary`
- `changedSourceCount`
- `changedClaimCount`
- `carriedForwardClaimCount`
- `changedClaimSources`
- `nextActions`

This summary is a plan, not the refreshed claim packet itself.
It should say plainly when the saved claim map has not been updated yet.

## User Status Summary

After discovery or refresh, Cautilus Agent should report status in a compact decision-oriented shape:

```text
Scanned:
- README.md
- AGENTS.md
- 23 linked docs files, depth 3

Found:
- 138 anchored claims, 4 rejected by anchoring audit
- 42 already satisfied by deterministic tests/specs
- 31 human-auditable
- 48 need Cautilus eval scenarios
- 17 need alignment before verification
- 6 stale from the current diff

Recommended next actions:
1. Plan eval scenario drafts for the top 10 Cautilus claims.
2. Add or connect deterministic tests for the top 5 high-confidence missing deterministic claims.
3. Resolve the top alignment group before treating it as a verification target.
4. Show the full claim report.
```

Cautilus Agent should then ask the user which branch to take.
Next actions should distinguish `plan only`, `top N`, `selected groups`, and `full batch`.
Full-batch work should show estimated claim count, affected files, and review or edit budget before it starts.
Cautilus Agent should not automatically launch expensive evaluator runs or broad code edits after status unless the user has already delegated that continuation and the recorded budget covers it.

`discover claims status` should expose the same decision boundary in `cautilus.claim_status_summary.v1`.
The status packet should include a `discoveryBoundary` block that says the packet is based on entry documents and linked docs.
That block should separate in-scope false negatives from out-of-scope narrative gaps: a declared promise inside the boundary that discovery missed is a binary bug, while undeclared user-facing behavior outside the boundary is an entry-surface or catalog gap rather than a discoverable claim.
The status packet should also include `actionSummary.primaryBuckets`, so a caller can separate work without rereading every claim:

- `already-satisfied`: proof is already attached and valid under packet semantics.
- `agent-add-deterministic-proof`: an agent can add or connect unit, lint, build, schema, spec, or CI proof.
- `agent-plan-cautilus-eval`: an agent can draft or select Cautilus eval scenarios.
- `agent-design-scenario`: an agent should first decompose the behavior into an evaluable scenario.
- `human-align-surfaces`: a human or maintainer needs to reconcile conflicting docs, code, adapters, or ownership boundaries.
- `human-confirm-or-decompose`: a human-auditable claim needs confirmation, decomposition, or an explicit acceptance artifact.
- `split-or-defer`: the claim is blocked because it is too broad, historical, provider-caveated, policy-like, or otherwise not a ready verification target.
- `inspect-manually`: the packet does not have enough label confidence to choose a stronger branch.

The status packet may also include cross-cutting signals such as `heuristic-review-needed` and `stale-evidence`.
These are not exclusive primary buckets because a claim can both need review and belong to a proof branch.
Each action bucket should include `byReviewStatus` and `byEvidenceStatus` counts so a human can tell whether the queue is already reviewed enough to spend time on or still needs agent triage first.

## Follow-On Commands

The workflow should avoid a `claim group` command.
Grouping is part of useful discovery output.

The extraction seam commands carry the primary agent path:

- `discover claims extraction-input`: emit the deterministic extraction-input packet — sources with content hashes, the embedded extraction template with version and hash, merged classification hints, and bounds — without calling an LLM
- `discover claims apply-extraction`: validate an agent extraction result against the input packet, anchor every verbatim excerpt, reject unanchored claims into the extraction audit, and compose the `extractionMode: agent` proof plan

Follow-on commands are justified only when they operate on an existing claim-state packet:

- `discover claims status`: summarize an existing packet for agents without rescanning, optionally with bounded `sampleClaims` and git freshness state
- `discover claims review-input`: turn selected candidate clusters into a deterministic review-input packet without calling an LLM, rejecting stale packets by default
- `discover claims review-input`: accepts an optional `--action-bucket <bucket>` focus so agents can prepare a human-alignment, human-confirmation, eval-planning, deterministic-proof, scenario-design, or split/defer review queue without hand-filtering raw JSON
- `discover claims apply-review`: merge `cautilus.claim_review_result.v1` labels and evidence refs into an existing claim packet without calling an LLM, rejecting stale packets by default; aggregate replay helpers apply historical results from oldest to newest using explicit review timestamps first and filename dates as a fallback, so later synthesis packets can intentionally override older HITL or reviewer decisions
- Replay matching honors claim identity: an update whose display `claimId` no longer exists falls back to `claimFingerprint`, and a fingerprint match rewrites the update's `claimId` and any matching `evidenceRefs[].supportsClaimIds` entries to the current display id before application (the same rewrite carried evidence refs get during refresh).
  Review-result `claimUpdates` should therefore carry `claimFingerprint`; fingerprint-less updates whose display id drifted are unrecoverable and are reported as dropped (per-packet warnings plus `rewrittenUpdateCount`/`droppedUpdateCount` in the output packet's `reviewApplication`) instead of vanishing silently.
  The 2026-06-10 id-drift incident behind this rule is recorded at `charness-artifacts/debug/debug-2026-06-10-claim-review-id-drift-refresh-loss.md`.
- `evaluate claims plan`: turn reviewed `cautilus-eval` claims into `cautilus.claim_eval_plan.v1` intermediate packets without writing host-owned fixtures, rejecting stale packets by default
- `evaluate claims plan`: each plan carries `proofRequirement.requiredRunnerCapability`, `proofRequirement.requiredObservability`, and whether the target surface requires product-runner proof; these are requirements for later setup/eval work, not readiness verdicts
- `evaluate claims plan`: each plan carries `fixtureAuthoringGuidance` with the `cautilus.evaluation_input.v1` surface/preset, minimum suite and case fields, runner output schema, required runner capability, required observability, and a non-writer boundary so agents can author host-owned fixtures without guessing packet shape
- `discover claims validate`: emit `cautilus.claim_validation_report.v1` for packet shape and evidence-ref checks without mutating claims

These commands are optional later surfaces.
They should not be required for the normal first discovery experience.

## Premortem

Fresh-eye satisfaction: parent-delegated.
Three angle reviews and one counterweight review were run against this contract on 2026-04-26.

Act before ship:

- Scan confirmation and LLM review confirmation must be separate.
  A user who approves README/AGENTS/depth 3 scanning has not necessarily approved model calls or subagent fanout.
- Depth 3 must be paired with visible source, candidate, cluster, and review-budget bounds.
  Depth alone is not a cost contract.
- Refresh cannot be a hidden skill-only state transition.
  Cautilus Agent may select refresh, but deterministic refresh-plan output must record baseline commit, target policy, changed sources, carried-forward claims, stale evidence reasons, and dirty-working-tree treatment.
- LLM grouping and review need versioned input/result packets with provenance.
  Otherwise the reduction from raw candidates to grouped claims is not reproducible.
- Evidence satisfaction needs strict packet semantics.
  Possible evidence refs cannot produce `evidenceStatus=satisfied`.
- Claim identity must not depend on source line numbers alone.
  `claimFingerprint` is required for refresh matching.
- The old `proofLayer` compatibility field should be removed instead of preserved now that split fields have shipped.

Bundle anyway:

- Emit grouping hints in the deterministic packet even before LLM review is implemented.
- Keep default link depth at `3`, but keep non-Markdown and host-specific evidence roots adapter-declared or explicit.
- Record state-path resolution in the packet even if the committed-versus-ignored state policy remains adapter-owned.

Over-worry:

- A public `claim refresh` command is not required for this stage.
  Helper flags under `discover claims` are enough if Cautilus Agent keeps the user-facing action as discover.
- LLM-backed claim extraction or review should not move into the binary.
  In this workflow, the binary stays deterministic and provider-neutral.
- HTML or a full report renderer does not block the first workflow value.

Valid but defer:

- Perfect subagent batch sizing should wait until the deterministic packet and skill control flow are dogfooded.
- Non-Markdown truth surfaces will matter, but should stay explicit or adapter-declared until the Markdown entry graph proves itself.
- More sophisticated claim identity can evolve from refresh fixtures; the first invariant is avoiding false continuity.

## Fixed Decisions

- The binary does not directly call an LLM provider for claim discovery or claim review.
  `eval` and `improve` workflows may still orchestrate model-involving behavior through adapter-owned runners.
- Claim extraction and proof routing are agent-primary (maintainer-ratified 2026-06-10), instead of further heuristic refinement.
  The measured evidence behind the decision: the gold set showed the heuristic routing tag dominant-correct on only 18/35 sampled claims, and the Korean lexicon measurement showed that on formal-style prose the claim-shaped gate degenerates into a sentence-length detector.
- The `recommendedProof` and eval-surface routing keywords in `classifyClaimLine` do not become a hint family; routing knowledge lives in the extraction template.
- In the claim discovery workflow, the Cautilus Agent owns claim extraction, LLM-backed claim review, budget explanation, and subagent orchestration.
- First discovery uses entry sources plus linked repo-local Markdown.
- Default linked docs depth is `3`.
- Cautilus Agent asks before the first broad scan and explains the effective entries and depth.
- Scope confirmation never authorizes model spend: agent extraction needs its own extraction-budget confirmation, and LLM review needs its own review-budget confirmation (maintainer-ratified 2026-06-11, generalizing the earlier review-budget rule).
- Agent extraction is the label-review pass for the claims it extracts; `review-input` excludes `agent-reviewed` claims by default so the review seam does not re-spend budget on freshly extracted claims.
- Existing state refresh is selected by Cautilus Agent when prior claim JSON exists, but deterministic refresh-plan output owns the state transition.
- No separate binary `claim refresh` command is planned for the next slice.
- The old `proofLayer` label is replaced by proof mechanism, verification readiness, evidence status, review status, and lifecycle fields.
- Grouping belongs in the discovery result, not in a required `claim group` subcommand.
- Binary evidence preflight may emit possible evidence refs, but cannot mark a claim satisfied by itself.
- Workflow prose in this contract states present behavior; transition history and rejected paths live in heading-marked decision sections and goal artifacts (maintainer-ratified 2026-06-11).

## Probe Questions

- How much deterministic evidence preflight should the binary do before it risks false satisfaction?
- What extraction batch size keeps agent extraction cost bounded on repos whose source set exceeds one agent context, and what subagent batch shape keeps review-seam cost bounded?
- How much fixture-template detail should `evaluate claims plan` include before it starts to look like host-owned policy?
- How much of the refresh-plan helper should ship in the first binary slice versus the first skill slice?

## Deferred Decisions

- Whether to commit `.cautilus/claims/latest.json` by default in Cautilus itself.
- Whether `discover claims status` should grow Markdown or HTML rendering beyond its JSON summary packet.
- Whether model-backed extraction should ever become a binary runner behind an explicit provider contract.
- Whether adapter configuration should support non-Markdown truth surfaces beyond explicit `--source` paths in the next slice.

## Non-Goals

- Do not make `discover` a README-only audit.
- Do not scan the entire repository by default.
- Do not follow external URLs during default discovery.
- Do not make the binary own provider credentials, model selection, or subagent fanout.
- Do not treat possible evidence refs as proof.
- Do not automatically run expensive evals after discovery without user confirmation or prior delegation.

## Success Criteria

1. A user can invoke the Cautilus Agent without detailed input and get a clear status summary rather than a raw 500-claim dump.
2. The first broad scan is bounded by entry sources plus linked docs depth 3, and the user sees that scope before it runs.
3. Existing claim state causes a diff-aware refresh path instead of a full rediscovery by default.
4. The packet separates proof mechanism, verification readiness, evidence status, review status, and lifecycle.
5. Agent extraction produces anchored claims with verbatim source refs and audit provenance, and the review seam preserves review provenance for the queues it serves.
6. The workflow can say which claims already have deterministic or Cautilus evidence, and which still need scenarios, tests, or alignment work.
7. The binary/skill boundary stays clean enough that consumer repos can use the binary plus Cautilus Agent without Cautilus importing host-specific prompts or adapters.
8. Weak evidence matches cannot produce `evidenceStatus=satisfied`.

## Acceptance Checks

The implementation slice that follows this design should include:

- fixture coverage for adapter-configured claim discovery entries and depth 3 Markdown link traversal
- packet schema tests for the split claim fields
- CLI tests proving `discover claims` records effective scan scope and source graph
- tests proving new packets use split proof fields without emitting `proofLayer`
- Cautilus Agent tests or self-dogfood evidence showing no-input skill invocation chooses claim discovery status when no current claim state exists
- refresh-plan tests showing a prior packet plus a changed source marks affected claims changed while carrying forward unchanged claims
- evidence stale tests showing changed evidence anchors produce `evidenceStatus=stale`
- evidence-preflight tests that attach possible evidence refs without falsely marking claims satisfied
- budget-gate tests proving scope confirmation authorizes neither agent extraction nor LLM review
- at least one Cautilus self-dogfood run over this repo that summarizes grouped claims and next actions from a real claim packet

## Deliberately Not Doing

- Do not add `claim group` as a required user-facing command.
  Grouping is part of useful discovery.
- Do not add a public `claim refresh` binary command in the next slice.
  Refresh is a skill decision based on prior JSON state.
- Do not move LLM review into the binary.
  The binary should remain deterministic and provider-neutral.
- Do not lower the default link depth to `1`.
  It misses the common README-to-docs-to-contract shape.
- Do not raise default link depth above `3` yet.
  That risks turning entry-surface discovery into broad documentation crawling.

## Implementation Slices

The first implementation slice changed the binary skeleton:

1. add adapter-owned `claim_discovery` entries, include/exclude globs, and `linked_doc_depth` (legacy `linked_markdown_depth` still accepted)
2. implement entry plus repo-local Markdown link traversal with default depth `3`
3. record effective scan scope and source graph in `cautilus.claim_proof_plan.v1` or the next schema
4. replace `proofLayer` with the new split fields
5. add claim fingerprints, evidence ref shape, and summary groups to the discover packet
6. add deterministic state-path resolution and refresh-plan helper output without adding `claim refresh`
7. carry forward reviewed/evidenced state from `--previous` by stable `claimFingerprint`, including evidence support id rewrites when display claim ids drift
8. recheck carried direct or verified evidence refs with `contentHash` and mark affected claims stale instead of preserving satisfied evidence when the evidence file no longer matches

The second implementation slice updated the Cautilus Agent control flow:

1. no-input invocation checks adapter and claim-state availability
2. no prior state triggers scan-scope confirmation before calling the binary
3. deterministic scan result triggers separate review-budget confirmation before LLM review
4. prior state triggers diff-aware refresh planning through binary helper output
5. Cautilus Agent summarizes status and asks which next branch to run

This slice is covered by the Cautilus Agent text, adapter contract docs, and the `execution-cautilus-no-input-claim-discovery-status` self-dogfood fixture.
The next deterministic helper slice added `discover claims status` and `discover claims review-input`.
`discover claims status` emits `cautilus.claim_status_summary.v1` and can include bounded `sampleClaims` plus `gitState` for agents that need concrete candidates before choosing the next branch.
It also includes `evidenceSatisfaction` so satisfied claims and their evidence refs are visible in the status packet without reading the full proof plan first.
`gitState.isStale` is claim-source freshness, not raw commit equality.
Commit drift caused only by generated claim artifacts remains visible as head drift without blocking review or eval planning.
`discover claims review-input` emits `cautilus.claim_review_input.v1` and records bounded clusters, skipped clusters, and skipped claims, but still does not call an LLM or merge review results.
Already satisfied and already reviewed non-stale claims are excluded from review clusters by default so reviewer budget stays focused on unresolved heuristic claims while carried evidence and prior decisions remain auditable under `skippedClaims`.
Its optional `--action-bucket` focus records the selected bucket in `reviewBudget` and `selectionPolicy`, includes each candidate's `actionBucket`, and marks non-matching claims as `action-bucket-mismatch` in `skippedClaims`.
It rejects stale claim packets by default unless `--allow-stale-claims` is explicitly passed.
The review-result application slice added `discover claims apply-review`.
It consumes `cautilus.claim_review_result.v1`, applies reviewed labels and evidence refs, records provenance, and rejects `evidenceStatus=satisfied` unless a direct or verified evidence ref supports the claim.
For mutable reviewer state, explicit empty arrays are meaningful: `unresolvedQuestions: []` clears older questions, while an omitted field leaves them unchanged.
It also rejects stale claim packets by default.
The eval-planning slice added `evaluate claims plan`.
It emits `cautilus.claim_eval_plan.v1` from reviewed `cautilus-eval` claims that are ready to verify, while preserving the host boundary by not writing fixtures, prompts, runners, wrappers, or policy.
It skips satisfied claims by default and records that exclusion in `selectionPolicy.excludesEvidenceStatus`.
It also records `planSummary`, including skipped counts and a zero-plan reason, so `evalPlans=[]` is inspectable rather than silently ambiguous.
Skipped claims retain proof routing, readiness, evidence status, and review status.
`already-satisfied` skips also retain source refs, evidence refs, and unresolved questions so they can be audited from the eval-plan packet itself.
It rejects stale claim packets by default.
The fixture-authoring guidance slice added surface/preset-specific `fixtureAuthoringGuidance` to each eval plan.
That guidance names the minimum host-owned fixture fields, expected shape, runner output schema, required runner capability, and required observability without writing host repo fixtures or policy.
The validation slice added `discover claims validate`.
It emits `cautilus.claim_validation_report.v1`, exits non-zero for invalid packet shape or evidence refs, and does not mutate claims or search for evidence.
The extraction seam slice added `discover claims extraction-input` and `discover claims apply-extraction` per [claim-extraction-template.md](./claim-extraction-template.md): the input packet embeds the versioned extraction template with content-hashed sources and bounds, and apply anchors verbatim excerpts, rejects unanchored claims into `extractionAudit.rejectedClaims`, unifies fingerprints on the normalized primary excerpt, and composes `extractionMode: agent` proof plans.
`validate` re-audits anchoring on applied packets: hash-matched sources with unanchored excerpts fail hard, drifted sources produce `stale-anchor` findings, and agent packets satisfy audit presence through `extractionAudit`.
