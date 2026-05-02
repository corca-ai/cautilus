# Claim Discovery Workflow

## Problem

`cautilus claim discover` currently emits a deterministic, source-ref-backed proof-plan skeleton.
That is useful as a fast inventory, but it is not yet the workflow users expect when they ask an agent to "use Cautilus" on a repo.
A real user wants to know which declared behavior claims exist, which ones are already covered by deterministic tests or existing Cautilus evidence, which ones still need evaluator-backed scenarios, and which surfaces must be aligned before verification is honest.

The product should preserve a simple user-facing entry point while keeping the product boundary clean:
the binary owns deterministic packet production and state transitions, and the bundled skill owns agent orchestration, LLM review, subagent fanout, user confirmation, and next-action conversation.

## Current Slice

Design the next claim-discovery workflow contract.
This slice is a design contract, not an implementation change.
It refines the current `claim discover` direction around four decisions:

- `discover` remains the one high-level user action for initial claim discovery.
- The binary performs the fast deterministic skeleton pass.
- The bundled skill performs LLM-backed review, grouping, final labeling, evidence reconciliation, and user-facing status.
- Existing claim state refresh is selected by the skill when it detects a prior JSON packet, but the refresh plan and state transition must be recorded in deterministic packets or helper output.
  It does not require a separate binary `claim refresh` command.

## User Workflow

The primary user flow starts from an agent session, not from a human reading a CLI manual.

1. User invokes the bundled `cautilus` skill with no specific input or with a broad request such as "use Cautilus on this repo."
2. The skill checks adapter availability, current claim-state artifacts, and recent git history.
3. If no useful prior claim state exists, the skill proposes a scan scope before starting.
4. The user confirms or adjusts the deterministic scan scope.
5. The skill calls the binary deterministic pass.
6. The skill shows the raw source count, candidate count, review budget, and proposed review tier.
7. The user confirms or adjusts the LLM review budget separately from the scan scope.
8. The skill fans out bounded LLM review over grouped claim clusters, not over every raw candidate one by one.
9. The skill reconciles likely existing evidence from tests, specs, eval summaries, and checked artifacts.
10. The skill summarizes status and asks which next action to take.

If prior claim state exists, step 5 becomes a diff-aware refresh selected by the skill:
the skill uses the previous packet, the previous commit recorded in that packet, and a deterministic refresh plan to decide which sources need rescanning or re-review.
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
- produce refresh plans from prior packets and git diffs when the skill asks for them
- validate and normalize claim-state packets

The binary must not own LLM provider selection, subagent scheduling, model prompts, review policy, or human conversation.
Those belong to the skill and the host agent runtime.

### Skill Responsibilities

The bundled skill should own orchestration that depends on an agent:

- decide whether to run first discovery, refresh prior state, or show current status
- explain the scan scope to the user and ask for confirmation before broad discovery
- call `cautilus claim discover` with the agreed scope
- show the deterministic scan result and ask separately before launching LLM review
- group and prioritize raw candidates for LLM review
- run subagent review in bounded batches
- apply final labels and merge obvious duplicates
- reconcile existing deterministic and evaluator evidence
- summarize status for the user
- offer next actions such as generating eval scenario drafts, adding deterministic tests, resolving alignment work, or showing a full report

This keeps the product agent-first without making the binary a host-specific agent runtime.

## Scan Scope

Default discovery starts from entry surfaces and follows only repo-local Markdown links.
This is the next workflow default and intentionally narrows the older broad source-inventory language in the current command-surface spec.
Until this contract is implemented, [command-surfaces.spec.md](../specs/command-surfaces.spec.md) remains the shipped `claim discover` contract.
The default entry set is:

- `README.md`
- `AGENTS.md`
- `CLAUDE.md` when it exists as a distinct instruction surface.
  A symlink alias to the same canonical file is not a separate source.
- adapter-configured `claim_discovery.entries`

The default Markdown link depth is `3`.
Depth counts only links from discovered Markdown sources to other repo-local Markdown sources.
It does not traverse arbitrary source files, generated artifacts, binary files, dependency directories, or external URLs.
Discovery also honors the repo's `.gitignore` for every path selection route, including default entries, adapter entries, explicit `--source` paths, linked Markdown, and include globs.
This keeps generated spec reports and latest artifact bundles out of the source claim graph without inventing a Cautilus-specific generated-block marker.
When different real files declare the same normalized claim text, discovery should emit one claim candidate and preserve every declaration location in `sourceRefs`.
Semantic duplicates with different wording are grouping/review work, not deterministic source dedupe.

This entry-surface boundary is also the product's false-negative boundary.
`claim discover` is expected to find declared claims in README-like entry documents and linked Markdown, not every latent user-facing behavior hidden in code, transcripts, issue threads, or private operator memory.
If a core user-facing feature is not stated in the configured entry documents or their linked Markdown graph, deterministic discovery may miss it.
That is not automatically a binary bug.
It is a product signal that the repo's public narrative or adoption surface is underspecified.
The bundled skill, `charness:quality`, `charness:narrative`, or a human reviewer may still explore the codebase and discover such missing public claims.
Those findings should be recorded as narrative, alignment, or documentation work before expecting `claim discover` to emit them by default.

The adapter may override entries, depth, include globs, and exclude globs:

```yaml
claim_discovery:
  entries:
    - README.md
    - AGENTS.md
  linked_markdown_depth: 3
  include:
    - docs/**/*.md
  exclude:
    - artifacts/**
    - node_modules/**
    - docs/specs/**
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
  semantic_groups:
    - label: Product promises
      terms:
        - user
        - promise
        - behavior
```

`audience_hints` is adapter-owned because user-versus-developer meaning depends on the repo's documentation layout.
The binary only understands the portable labels `user`, `developer`, and `unclear`; richer semantic grouping remains review work for the skill and reviewer loop.
`semantic_groups` is also adapter-owned because product areas differ across repos.
When the adapter omits semantic groups, the binary emits `General product behavior` instead of using a Cautilus-specific taxonomy.
`state_path` is the writable discovery baseline for `claim discover`; `related_state_paths` are read-only orientation hints for reviewed, evidenced, or promoted claim packets that `agent status` can summarize without making them the next discovery target.
`agent status` should use the most advanced non-stale related claim packet as the selected orientation map when it is more useful than the writable baseline.
That selected map should drive status summaries and inspect/refresh branch commands, while `state_path` remains the default output path for first discovery.
`evidence_roots` are read-only roots for deterministic possible-evidence preflight; they may add `possibleEvidenceRefs` to review input, but they never mark claims satisfied.
Repos should use this split to keep executable specs and maintainer appendices out of ordinary prose claim discovery when those files are proof or operator evidence rather than public promises.
For example, `docs/specs/**` can be excluded from claim sources while `docs/specs` remains an evidence root for spec-backed proof.

Before running a first broad scan, the skill should say which entries and depth it will use.
It should also show the deterministic bounds that will be applied:

- maximum sources
- maximum raw candidates
- maximum review clusters
- excluded paths or globs
- whether dirty working-tree files are in scope

The skill should ask the user to confirm or adjust that scope.
After confirmation, the binary should record the effective scope in the packet so a future agent can reproduce or refresh the run.

## Review Budget Confirmation

Scan confirmation does not authorize LLM review.
After the deterministic pass, the skill should show a separate review plan:

- raw candidate count
- grouped-cluster estimate
- proposed review tier
- maximum clusters to review
- maximum subagents or parallel review lanes
- maximum clusters per subagent
- maximum excerpt characters or tokens per cluster
- retry policy
- stop reasons
- skipped cluster count and why they will be skipped

The user should confirm or adjust that review budget before the skill launches subagents or other LLM-backed review.
If the user already delegated autonomous continuation, the skill may proceed within the recorded budget, but the budget still must be written to the packet.

## Claim Model

The old `proofLayer` field was overloaded.
It mixed proof mechanism, readiness, and alignment state.
The current packet splits those concepts:

```json
{
  "claimId": "claim-readme-md-9",
  "summary": "Commands should emit durable packets with enough state for the next agent to resume.",
  "sourceRefs": [],
  "claimFingerprint": "sha256:...",
  "recommendedProof": "cautilus-eval",
  "recommendedEvalSurface": "dev/repo",
  "verificationReadiness": "ready-to-verify",
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

Broad positioning or aggregate product promises should stay `human-auditable` and `verificationReadiness=blocked` until they are decomposed into concrete deterministic checks, scenario candidates, or Cautilus eval claims.
The claim should remain visible in the packet, but it should not become a fixture plan by default because one passing fixture would overclaim the umbrella promise.
Product-direction statements and operator-policy rules follow the same boundary.
They may be important durable guidance, but they are not ready eval targets until they are split into concrete behavior, deterministic gate, or audited-process claims.
Markdown glossary bullets that only define a code-styled label, such as `` `alignment-work`: ... ``, should not become claim candidates by default.
Ownership-boundary explanations, such as product-owned versus adapter-owned responsibilities, should stay `human-auditable` and `needs-alignment` until the matching docs, code, adapters, and tests are reconciled.
YAML frontmatter is metadata, not claim prose.
Command, packet, runner, and readiness statements should prefer deterministic proof unless they explicitly depend on model or agent behavior.
Historical observation and provider-caveat statements can inform future scenarios, but they should stay `human-auditable` and `blocked` until promoted into a concrete regression claim.

`claimId` is a display handle and packet reference.
Refresh matching should use `claimFingerprint`, not source line number alone.
The fingerprint should combine normalized summary, primary source path, heading or section anchor when available, and source excerpt hash.
Line number is a locator, not identity.

`verificationReadiness` answers whether verification can start:

- `ready-to-verify`
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

`claimSemanticGroup` is a deterministic review-batching hint.
It is not a final taxonomy; the bundled skill or human reviewer may correct it during review.

`proofLayer` is no longer emitted in new claim packets.
Agents and validators must read the split fields directly instead of deriving a compatibility label.

## Packet Semantics

The packet must not imply proof from weak evidence.
The first valid-state rules are:

- `evidenceStatus=satisfied` requires at least one `evidenceRefs[]` entry with `matchKind=verified` or `matchKind=direct`, a source commit or source hash, and an evidence commit or content hash.
- `evidenceStatus=satisfied` also requires `reviewStatus=agent-reviewed` or `reviewStatus=human-reviewed`.
- `matchKind=possible` can produce only `evidenceStatus=unknown` or `evidenceStatus=partial`.
- `verificationReadiness=ready-to-verify` with `evidenceStatus=missing` means proof is absent but a test, fixture, or human-auditable check can now be created or run.
- `verificationReadiness=needs-scenario` means the claim is not ready for a protected eval fixture yet.
- `verificationReadiness=needs-alignment` means at least two truth surfaces must be reconciled before proof would be honest.
- `lifecycle=changed` describes changed claim source or claim meaning.
- `evidenceStatus=stale` describes changed evidence anchors, commits, hashes, or validity.

`evidenceRefs[]` should use a minimum inspectable shape:

```json
{
  "refId": "evidence-spec-command-surfaces-1",
  "kind": "spec | test | fixture | eval-summary | report | human-note",
  "path": "docs/specs/command-surfaces.spec.md",
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

`matchKind` values are:

- `possible`
- `verified`
- `direct`
- `contradictory`
- `superseded`

## Evidence Reconciliation

`discover` should eventually produce status, not only candidates.
The binary can do cheap deterministic preflight, but the skill owns final interpretation.

Deterministic preflight may inspect:

- checked-in test files and fixture names
- `docs/specs/*.spec.md` executable proof blocks
- adapter-declared Cautilus eval summary roots
- explicit packet references
- active-run conventions that the adapter or command output records
- command registry examples and schema fixtures

The preflight should never assert that a claim is satisfied solely because a filename looks related.
It may attach candidate `evidenceRefs` with `matchKind=possible`.
The skill review can upgrade them to `satisfied`, `partial`, `stale`, or `missing` only when the packet semantics above are met.

`stale` should be used when an evidence ref or evidence commit/hash changed since the last reviewed claim-state packet.
`unknown` should be used when the workflow did not inspect enough evidence to make an honest statement.

## Grouping And Review Strategy

The workflow should not send every raw candidate to an LLM independently.
The deterministic pass should emit grouping hints:

- source path
- source section
- recommended proof
- recommended eval surface
- repeated noun phrases or command names
- source graph neighborhood

The skill should review clusters in priority order:

1. entry-surface claims from README and AGENTS
2. `cautilus-eval` candidates
3. `needs-alignment` candidates
4. claims touching command families, skill routing, adapter contracts, or release/install surfaces
5. deterministic and human-auditable claims with weak or missing evidence refs
6. lower-priority duplicate or long-tail doc claims

Subagents should receive clusters with source excerpts, source refs, candidate labels, possible evidence refs, and a bounded output schema.
They should return merged claims, corrected labels, evidence-status judgments, and unresolved questions.
The parent skill should merge results and keep review provenance in the packet.

The LLM review seam should use versioned packets instead of hidden prompt-only behavior:

- `cautilus.claim_review_input.v1`
- `cautilus.claim_review_result.v1`

Those packets should record cluster IDs, candidate IDs, source refs, prompt/reference hashes, runtime/model identity when available, merge decisions, label changes, evidence-status reasons, unresolved questions, and skipped clusters.

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
- raw candidate count
- grouped claim count
- claim records
- refresh plan when prior state was used
- review budget and review budget source
- skipped review clusters
- review runs
- evidence scan summary
- next recommended actions

Whether `.cautilus/claims/latest.json` is committed is a repo policy decision.
Cautilus should support either checked-in durable state or local ignored working state as long as the packet is explicit.

## Existing State Refresh

Refresh is a skill behavior over the same `discover` entry point.
The user should not need to learn a separate `claim refresh` command.

When a previous claim-state packet exists, the skill should:

1. read the prior packet and its reviewed commit
2. ask the binary for a deterministic refresh plan from that packet and the chosen target
3. show the binary-owned `refreshSummary`: whether the saved claim map is current, how many sources and claims changed, which source files concentrate the changed claims, what was not updated yet, and the recommended next choices
4. call the binary for affected sources or the effective entry graph
5. carry forward unchanged claims
6. mark claims with changed source or meaning as `changed`
7. mark claims with changed evidence anchors as `evidenceStatus=stale`
8. retire claims whose source refs disappeared
9. run LLM review only on changed clusters and high-impact stale evidence after review-budget confirmation

The binary may provide helper flags such as `claim discover --previous <packet> --refresh-plan`, but the public user-level workflow remains `discover`.
No separate binary `claim refresh` command is planned for this stage.
When the skill runs `claim discover --previous <packet>` for the actual refreshed proof plan, unchanged claim fingerprints carry forward reviewed labels, evidence refs, unresolved questions, and next-action state.
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

After discovery or refresh, the skill should report status in a compact decision-oriented shape:

```text
Scanned:
- README.md
- AGENTS.md
- 23 linked Markdown files, depth 3

Found:
- 561 raw candidates
- 138 grouped claims after review
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

The skill should then ask the user which branch to take.
Next actions should distinguish `plan only`, `top N`, `selected groups`, and `full batch`.
Full-batch work should show estimated claim count, affected files, and review or edit budget before it starts.
The skill should not automatically launch expensive evaluator runs or broad code edits after status unless the user has already delegated that continuation and the recorded budget covers it.

`claim show` should expose the same decision boundary in `cautilus.claim_status_summary.v1`.
The status packet should include a `discoveryBoundary` block that says the packet is based on entry documents and linked Markdown, and that undeclared user-facing behavior is an entry-surface gap rather than a discoverable claim.
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

Follow-on commands are justified only when they operate on an existing claim-state packet:

- `claim show`: summarize an existing packet for agents without rescanning, optionally with bounded `sampleClaims` and git freshness state
- `claim review prepare-input`: turn selected candidate clusters into a deterministic review-input packet without calling an LLM, rejecting stale packets by default
- `claim review prepare-input`: accepts an optional `--action-bucket <bucket>` focus so agents can prepare a human-alignment, human-confirmation, eval-planning, deterministic-proof, scenario-design, or split/defer review queue without hand-filtering raw JSON
- `claim review apply-result`: merge `cautilus.claim_review_result.v1` labels and evidence refs into an existing claim packet without calling an LLM, rejecting stale packets by default
- `claim plan-evals`: turn reviewed `cautilus-eval` claims into `cautilus.claim_eval_plan.v1` intermediate packets without writing host-owned fixtures, rejecting stale packets by default
- `claim plan-evals`: each plan carries `proofRequirement.requiredRunnerCapability`, `proofRequirement.requiredObservability`, and whether the target surface requires product-runner proof; these are requirements for later setup/eval work, not readiness verdicts
- `claim plan-evals`: each plan carries `fixtureAuthoringGuidance` with the `cautilus.evaluation_input.v1` surface/preset, minimum suite and case fields, runner output schema, required runner capability, required observability, and a non-writer boundary so agents can author host-owned fixtures without guessing packet shape
- `claim validate`: emit `cautilus.claim_validation_report.v1` for packet shape and evidence-ref checks without mutating claims

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
  The skill may select refresh, but deterministic refresh-plan output must record baseline commit, target policy, changed sources, carried-forward claims, stale evidence reasons, and dirty-working-tree treatment.
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
  Helper flags under `claim discover` are enough if the skill keeps the user-facing action as discover.
- LLM extraction should not move into the binary.
  The binary stays deterministic and provider-neutral.
- HTML or a full report renderer does not block the first workflow value.

Valid but defer:

- Perfect subagent batch sizing should wait until the deterministic packet and skill control flow are dogfooded.
- Non-Markdown truth surfaces will matter, but should stay explicit or adapter-declared until the Markdown entry graph proves itself.
- More sophisticated claim identity can evolve from refresh fixtures; the first invariant is avoiding false continuity.

## Fixed Decisions

- The binary remains deterministic and does not directly call an LLM.
- The bundled skill owns LLM review and subagent orchestration.
- First discovery uses entry sources plus linked repo-local Markdown.
- Default linked Markdown depth is `3`.
- The skill asks before the first broad scan and explains the effective entries and depth.
- LLM review needs separate review-budget confirmation after deterministic scan.
- Existing state refresh is selected by the skill when prior claim JSON exists, but deterministic refresh-plan output owns the state transition.
- No separate binary `claim refresh` command is planned for the next slice.
- The old `proofLayer` label is replaced by proof mechanism, verification readiness, evidence status, review status, and lifecycle fields.
- Grouping belongs in the discovery result, not in a required `claim group` subcommand.
- Binary evidence preflight may emit possible evidence refs, but cannot mark a claim satisfied by itself.

## Probe Questions

- How much deterministic evidence preflight should the binary do before it risks false satisfaction?
- What subagent batch size and cluster shape keeps review cost bounded on repos with hundreds of raw candidates?
- How much fixture-template detail should `claim plan-evals` include before it starts to look like host-owned policy?
- How much of the refresh-plan helper should ship in the first binary slice versus the first skill slice?

## Deferred Decisions

- Whether to commit `.cautilus/claims/latest.json` by default in Cautilus itself.
- Whether `claim show` should grow Markdown or HTML rendering beyond its JSON summary packet.
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

1. A user can invoke the Cautilus skill without detailed input and get a clear status summary rather than a raw 500-claim dump.
2. The first broad scan is bounded by entry sources plus linked Markdown depth 3, and the user sees that scope before it runs.
3. Existing claim state causes a diff-aware refresh path instead of a full rediscovery by default.
4. The packet separates proof mechanism, verification readiness, evidence status, review status, and lifecycle.
5. Agent review reduces raw candidates into grouped claims while preserving source refs and review provenance.
6. The workflow can say which claims already have deterministic or Cautilus evidence, and which still need scenarios, tests, or alignment work.
7. The binary/skill boundary stays clean enough that consumer repos can use the binary plus bundled skill without Cautilus importing host-specific prompts or adapters.
8. Weak evidence matches cannot produce `evidenceStatus=satisfied`.

## Acceptance Checks

The implementation slice that follows this design should include:

- fixture coverage for adapter-configured claim discovery entries and depth 3 Markdown link traversal
- packet schema tests for the split claim fields
- CLI tests proving `claim discover` records effective scan scope and source graph
- tests proving new packets use split proof fields without emitting `proofLayer`
- bundled-skill tests or self-dogfood evidence showing no-input skill invocation chooses claim discovery status when no current claim state exists
- refresh-plan tests showing a prior packet plus a changed source marks affected claims changed while carrying forward unchanged claims
- evidence stale tests showing changed evidence anchors produce `evidenceStatus=stale`
- evidence-preflight tests that attach possible evidence refs without falsely marking claims satisfied
- review-budget tests proving scan confirmation does not authorize LLM review
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

1. add adapter-owned `claim_discovery` entries, include/exclude globs, and `linked_markdown_depth`
2. implement entry plus repo-local Markdown link traversal with default depth `3`
3. record effective scan scope and source graph in `cautilus.claim_proof_plan.v1` or the next schema
4. replace `proofLayer` with the new split fields
5. add claim fingerprints, evidence ref shape, and summary groups to the discover packet
6. add deterministic state-path resolution and refresh-plan helper output without adding `claim refresh`
7. carry forward reviewed/evidenced state from `--previous` by stable `claimFingerprint`, including evidence support id rewrites when display claim ids drift
8. recheck carried direct or verified evidence refs with `contentHash` and mark affected claims stale instead of preserving satisfied evidence when the evidence file no longer matches

The second implementation slice updated the bundled skill control flow:

1. no-input invocation checks adapter and claim-state availability
2. no prior state triggers scan-scope confirmation before calling the binary
3. deterministic scan result triggers separate review-budget confirmation before LLM review
4. prior state triggers diff-aware refresh planning through binary helper output
5. the skill summarizes status and asks which next branch to run

This slice is covered by the bundled skill text, adapter contract docs, and the `execution-cautilus-no-input-claim-discovery-status` self-dogfood fixture.
LLM-backed cluster review should come after the deterministic packet and skill control flow are stable enough to dogfood.
The next deterministic helper slice added `claim show` and `claim review prepare-input`.
`claim show` emits `cautilus.claim_status_summary.v1` and can include bounded `sampleClaims` plus `gitState` for agents that need concrete candidates before choosing the next branch.
It also includes `evidenceSatisfaction` so satisfied claims and their evidence refs are visible in the status packet without reading the full proof plan first.
`gitState.isStale` is claim-source freshness, not raw commit equality.
Commit drift caused only by generated claim artifacts remains visible as head drift without blocking review or eval planning.
`claim review prepare-input` emits `cautilus.claim_review_input.v1` and records bounded clusters, skipped clusters, and skipped claims, but still does not call an LLM or merge review results.
Already satisfied and already reviewed non-stale claims are excluded from review clusters by default so reviewer budget stays focused on unresolved heuristic claims while carried evidence and prior decisions remain auditable under `skippedClaims`.
Its optional `--action-bucket` focus records the selected bucket in `reviewBudget` and `selectionPolicy`, includes each candidate's `actionBucket`, and marks non-matching claims as `action-bucket-mismatch` in `skippedClaims`.
It rejects stale claim packets by default unless `--allow-stale-claims` is explicitly passed.
The review-result application slice added `claim review apply-result`.
It consumes `cautilus.claim_review_result.v1`, applies reviewed labels and evidence refs, records provenance, and rejects `evidenceStatus=satisfied` unless a direct or verified evidence ref supports the claim.
For mutable reviewer state, explicit empty arrays are meaningful: `unresolvedQuestions: []` clears older questions, while an omitted field leaves them unchanged.
It also rejects stale claim packets by default.
The eval-planning slice added `claim plan-evals`.
It emits `cautilus.claim_eval_plan.v1` from reviewed `cautilus-eval` claims that are ready to verify, while preserving the host boundary by not writing fixtures, prompts, runners, wrappers, or policy.
It skips satisfied claims by default and records that exclusion in `selectionPolicy.excludesEvidenceStatus`.
It also records `planSummary`, including skipped counts and a zero-plan reason, so `evalPlans=[]` is inspectable rather than silently ambiguous.
Skipped claims retain proof routing, readiness, evidence status, and review status.
`already-satisfied` skips also retain source refs, evidence refs, and unresolved questions so they can be audited from the eval-plan packet itself.
It rejects stale claim packets by default.
The fixture-authoring guidance slice added surface/preset-specific `fixtureAuthoringGuidance` to each eval plan.
That guidance names the minimum host-owned fixture fields, expected shape, runner output schema, required runner capability, and required observability without writing host repo fixtures or policy.
The validation slice added `claim validate`.
It emits `cautilus.claim_validation_report.v1`, exits non-zero for invalid packet shape or evidence refs, and does not mutate claims or search for evidence.
