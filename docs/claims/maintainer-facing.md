# Cautilus Maintainer-Facing Claims

This page maps the user-facing claim catalog to maintainer-owned contracts, proof routes, and known implementation boundaries.
It is allowed to use internal vocabulary, but each claim must stay aligned with a user-facing promise.

The source of truth for current claim state is still the checked-in claim packet.
This page is the curated catalog an agent should use before asking a maintainer to review raw sentence candidates.
Raw discovery ids, fingerprints, and current evidence refs belong in packets and review artifacts.
This page should stay stable enough that README readers can understand the product map without opening JSON first.
For each maintainer claim, `Current evidence status` describes this catalog entry.
The exact raw-claim evidence state remains in `.cautilus/claims/evidenced-typed-runners.json`.

## M1. Claim Discovery Is High-Recall, Not A Verdict

Aligned user claims: U1, U8.

`claim discover` emits source-ref-backed candidates, rough labels, and proof-planning fields.
It should favor recall from configured entry documents and linked Markdown, then rely on the bundled skill or an agent to merge duplicates, split fragments, and project canonical user-facing and maintainer-facing claims.

Proof route: deterministic.
Current evidence status: proof-planning; not satisfied by this catalog entry alone.
Next action: keep discovery source-scope tests and status summaries connected to U1/U8, then review remaining false-positive and false-negative boundaries through catalog-level decisions.
Absorbs: raw claims about source inventory, entry-doc discovery, `.gitignore`, duplicate handling, stale state, and proof-debt visibility.

Required evidence:

- source inventory and `.gitignore` behavior tests
- claim status summaries that expose proof route, review state, evidence state, and stale-state semantics
- curated claim catalog review results when raw candidates are normalized into canonical claims

Source anchors: README.md, AGENTS.md, docs/contracts/claim-discovery-workflow.md.

## M2. The Binary And Skill Own Different Parts Of The Claim Workflow

Aligned user claims: U1, U4, U8.

The binary owns deterministic command discovery, packet examples, scans, validation, and reusable artifacts.
The bundled skill owns routing, sequencing, decision boundaries, claim curation, review-budget explanation, LLM-backed claim review, and subagent orchestration.
The binary must not directly call an LLM provider for claim discovery or claim review.

Proof route: deterministic plus dev/skill eval.
Current evidence status: proof-planning; some command and skill checks exist, but this catalog entry is not satisfied until the matching evidence refs are attached in the claim packet.
Next action: keep binary help/disclosure checks deterministic and prove claim-review routing through the checked dev/skill fixture surface.
Absorbs: raw claims about command discovery, packet examples, deterministic scans, validation, skill routing, review budgets, and LLM-backed claim review.

Required evidence:

- command registry and help/disclosure checks for binary-owned surface
- skill disclosure checks for progressive disclosure between the binary and skill
- dev/skill eval proving the skill routes claim-review work through a budgeted branch instead of treating raw discovery as a finished answer

Source anchors: README.md, skills/cautilus/SKILL.md, docs/specs/standalone-surface.spec.md.

## M3. Host Repos Own Runtime-Specific Behavior

Aligned user claims: U2, U3, U6.

Adapters own prompts, fixtures, wrappers, runtime launch, credentials, backend and model selection, repo-specific flags, and acceptance policy.
`Cautilus` owns the generic CLI, packet schemas, status semantics, behavior-surface vocabulary, normalization helpers, and product-managed request/result semantics.

Proof route: deterministic.
Current evidence status: proof-planning.
Next action: prefer deterministic adapter and live-run invocation checks over human review for packet ownership, while leaving host-owned runner decisions explicit.
Absorbs: raw claims about adapters, prompts, wrappers, fixtures, credentials, runtime launch, backend/model choice, repo-specific flags, and product-owned schemas.

Required evidence:

- adapter contract tests showing host-owned command templates remain explicit
- live-run invocation tests for request and result packet semantics
- behavior-intent schema and normalization tests for canonical surface vocabulary and deprecated aliases

Source anchors: docs/cli-reference.md, docs/guides/consumer-adoption.md, docs/contracts/adapter-contract.md.

## M4. Evaluation Uses Two Surfaces And Four Presets

Aligned user claims: U2, U6.

The top-level surfaces are `dev` and `app`.
The supported presets are `repo`, `skill`, `chat`, and `prompt`.
The fixture declares the surface and preset; the CLI remains uniform around `cautilus eval test` and `cautilus eval evaluate`.

Proof route: deterministic plus fixture-backed eval.
Current evidence status: proof-planning.
Next action: keep normalizer, fixture, and public-spec proof aligned with `dev/repo`, `dev/skill`, `app/chat`, and `app/prompt`.
Absorbs: raw claims about the `dev`/`app` split, preset vocabulary, fixture-declared surfaces, and retirement of older archetype wording.

Required evidence:

- evaluation-input normalizer tests
- executable public specs for evaluation surfaces
- checked-in fixtures for each shipped preset

Source anchors: docs/specs/evaluation-surfaces.spec.md, fixtures/eval/.

## M5. Review And Evidence Are Separate State Transitions

Aligned user claims: U5, U8.

A reviewer may update labels, proof route, audience, readiness, and next action.
A claim becomes satisfied only when a direct or verified evidence ref supports that claim.
Possible evidence and human agreement alone must not satisfy a claim.

Proof route: deterministic.
Current evidence status: proof-planning.
Next action: keep review-result application and validation tests strict enough that possible evidence or human agreement cannot satisfy a claim.
Absorbs: raw claims about review labels, proof route updates, evidence refs, possible evidence, and satisfaction semantics.

Required evidence:

- `claim review apply-result` tests for label updates
- satisfied-evidence rejection tests
- `claim validate` checks over evidence refs and supported claim IDs

Source anchors: docs/contracts/claim-discovery-workflow.md, docs/contracts/evidence-bundle.md.

## M6. Review-Result Replay Must Guard Semantic Drift

Aligned user claims: U5, U8.

Historical review-result packets may remain as audit history.
When replaying them into a refreshed claim packet, the replay helper must drop stale IDs and must honor optional `claimFingerprint` guards so line-based ID reuse cannot silently apply an old decision to a different current claim.

Proof route: deterministic.
Current evidence status: proof-planning; fingerprint-guard implementation exists and should remain covered by replay-helper tests.
Next action: keep review-result replay tests focused on missing IDs and mismatched fingerprints whenever claim discovery IDs or line positions change.
Absorbs: raw claims about historical review-result replay, stale IDs, line-based ID reuse, fingerprints, and audit history.

Required evidence:

- replay-helper tests for missing IDs
- replay-helper tests for reused IDs with mismatched fingerprints
- debug artifacts recording any replay collision incident

Source anchors: scripts/agent-runtime/apply-current-review-results.mjs, charness-artifacts/debug/.

## M7. Runner Readiness Is Based On Declared Runtime Inputs

Aligned user claims: U2, U3, U6.

Runner readiness should depend on the adapter hash and declared runner file hashes, not raw git commit equality.
Commit drift should be exposed as provenance when the adapter and runner files still match.
`doctor` and `agent status` should share the same assessment semantics.

Proof route: deterministic.
Current evidence status: proof-planning.
Next action: keep `doctor` and `agent status` on shared runner-readiness semantics, and prove adapter hash, runner file hash, and harmless commit drift cases.
Absorbs: raw claims about runner assessment, adapter hash drift, runner file drift, commit drift provenance, and readiness branch behavior.

Required evidence:

- runner-readiness tests for adapter hash drift
- runner-readiness tests for runner file hash drift
- runner-readiness tests for harmless commit drift shown as provenance

Source anchors: docs/contracts/runner-readiness.md, internal/runtime/runner_readiness.go, internal/runtime/runner_readiness_test.go.

## M8. Human Views Mirror Packets

Aligned user claims: U5, U8.

Markdown and HTML reports are reader surfaces over packets.
They must not become separate sources of truth, and they must not mix raw discovery counts with applied claim-packet counts.

Proof route: deterministic plus browser/runtime checks where useful.
Current evidence status: proof-planning.
Next action: keep Markdown/HTML/status-server views packet-backed and use browser/runtime proof when the reader surface itself changes.
Absorbs: raw claims about JSON source-of-truth, Markdown reports, HTML reports, status server state, comments, and stale report avoidance.

Required evidence:

- claim status report renderer tests
- status server tests for token-gated state and comment persistence
- HTML report specs for packet-backed reader views

Source anchors: docs/contracts/reporting.md, docs/specs/html-report.spec.md, scripts/agent-runtime/.

## M9. Optimization Requires An Honest Proof Surface

Aligned user claims: U7.

`optimize` and GEPA-style search must run against explicit claim, budget, protected validation, and revision-artifact boundaries.
Optimization output is a bounded proposal and evidence packet, not an instruction to blindly apply changes.

Proof route: deterministic plus eval fixtures.
Current evidence status: proof-planning.
Next action: prove optimization packet boundaries before promoting any optimizer output as a recommended behavior change.
Absorbs: raw claims about optimize, GEPA-style search, budgets, checkpoints, protected validation, frontier promotion, and revision artifacts.

Required evidence:

- optimize input and search-result schema tests
- evaluation summary tests used by optimize scoring
- revision artifact tests that preserve budget, checkpoint, and recommendation state

Source anchors: docs/contracts/optimization.md, docs/contracts/optimization-search.md, docs/gepa.md.

## M10. Public Specs And Claim Catalogs Have Different Jobs

Aligned user claims: all.

The public spec report provides cheap executable proof pages.
The claim catalog provides the curated promise map that a user or maintainer reads before diving into raw claim packets.
Raw `claim discover` output should feed the catalog through curation; it should not be the primary human review surface.

Proof route: deterministic and human review.
Current evidence status: proof-planning; README and link checks can prove reachability, while maintainer review must approve the catalog content.
Next action: review U1-U8 first, then M1-M10, before returning to raw action-bucket cards.
Absorbs: raw claims about claim catalogs, public specs, raw discovery output, reader-facing promise maps, and report/source boundaries.

Required evidence:

- README links to the user-facing claim catalog and public spec report
- claim review artifacts that record canonical curation decisions
- lint and link checks that keep the catalog reachable

Source anchors: README.md, docs/claims/user-facing.md, docs/claims/maintainer-facing.md.
