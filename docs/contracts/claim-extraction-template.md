# Claim Extraction Template And Packet Contract

## Problem

The 2026-06-10 direction decision in [claim-discovery-workflow.md](./claim-discovery-workflow.md) moved primary claim extraction from heuristic refinement to agent-primary discovery.
The measured evidence: the heuristic routing tag was dominant-correct on only 18/35 gold-set claims, and on formal non-English prose the claim-shaped gate degenerates into a sentence-length detector.
That decision recorded the direction but deliberately deferred the detailed extraction template and packet contract to this design slice.
Without this contract, agent extraction would be hidden prompt-only behavior: no template provenance, no anchoring enforcement, no stable claim identity across re-extractions.

## Current Slice

This document is the design contract for the agent-primary extraction seam.
It fixes the command pair, the two extraction packets, the product-owned extraction template shape, the anchoring rule, and the fingerprint identity change.
It is a design contract, not an implementation change; the implementation slices at the end consume it.

## Extraction Seam

The seam mirrors the existing review seam (`review-input` / `apply-review`): the binary emits a deterministic input packet, the agent does the model-backed work, and the binary validates and applies the result.

```text
discover claims extraction-input --repo-root . --output extraction-input.json
  → cautilus.claim_extraction_input.v1
    (sources + content hashes, merged classification hints,
     embedded extraction template + template hash, bounds, output schema)

Cautilus Agent extracts claims by following the embedded template
  → cautilus.claim_extraction_result.v1
    (claims with mandatory verbatim excerpts and source refs)

discover claims apply-extraction \
  --input extraction-input.json \
  --result extraction-result.json \
  --output claims-agent.json
  → cautilus.claim_proof_plan.v1 with extractionMode: agent
    (anchoring validation, unanchored-claim rejection,
     fingerprint computation, binary-owned packet blocks)
```

The binary owns `sourceInventory`, `sourceGraph`, `effectiveScanScope`, git commit, and per-source content hashes in every mode.
The agent never assembles the proof-plan packet directly; `apply-extraction` composes the binary-owned skeleton with the validated agent result.
Both new commands are deterministic and make no model calls, preserving the fixed decision that the binary does not call an LLM for claim discovery or review.

Running agent extraction is an LLM activity, so it sits behind the workflow contract's Model-Spend Confirmation rule: scan-scope confirmation authorizes `extraction-input`, but a separate extraction-budget confirmation is required before the Cautilus Agent actually extracts.
The extraction budget (source count, excerpt bounds, batching, stop reasons) is recorded in the applied packet.

`extraction-input` honors the same explicit `--adapter <path>` override as `discover claims`, so measurement dry-runs on read-only corpora apply a proposed adapter without writing to the scanned repo; ratified configuration still belongs in the consumer repo's own adapter.

## Extraction Template

The extraction template is product-owned and embedded in the binary, following the existing precedent of binary-rendered review prompt surfaces.
`extraction-input` renders the template into the packet together with `templateVersion` and `templateHash`, so every extraction run records exactly which template produced it.

The template has seven required sections (template `v2`):

1. **Claim definition.**
   What counts as a behavior claim: a declared promise about how the product, repo, or workflow behaves, addressed to a user, operator, or agent, that could in principle be proven or falsified.
   Roadmap intent, philosophy, open questions, glossary definitions, and metadata are not claims.
   `v2` adds explicit prompts for the two claim shapes a recall probe showed the agent tends to miss because they assert a stance or a boundary rather than a feature: design-principle claims (for example "X is a first-class …", "agents are first-class users") and negative, scope-boundary, or exclusion claims (for example "not for …", "does not …", "opt-in until …").
2. **Non-claim conventions.**
   The merged `classification_hints.non_claim_section_headings` (portable defaults unioned with adapter headings) plus the portable non-claim rules already in the claim model: frontmatter is metadata, code-styled glossary labels are not claims, prompt examples and open questions are not claims.
   The adapter remains the only repo-specific knowledge channel; the template carries the merged result, not new hardcoding.
3. **Verbatim excerpt rules.**
   Every claim must carry at least one excerpt copied exactly from the source text, with its source path and a line locator.
   Exactly one excerpt per claim is marked `primary`; it is the claim's identity anchor.
   Paraphrase belongs in `summary` only; an excerpt that does not survive anchoring validation causes the claim to be rejected.
4. **Routing guidance.**
   The `recommendedProof`, `recommendedEvalSurface`, `verificationReadiness`, and `claimAudience` definitions from the claim model, so routing happens inside extraction instead of a separate heuristic pass.
   `v2` tightens `recommendedProof` to route by what the claim's *enabler* is (rule R12), because the gold-set HITL found proof routing — not recall — to be the agent's measured weakness: route to `deterministic` whenever a static repo-owned check could prove a capability claim (do not default it to `human-auditable`), and route an agent-behavior claim to `cautilus-eval` even when a deterministic schema check happens to pass (a passing schema check does not prove the behavior).
   This absorbs the dissolved proof-routing hint family: routing knowledge lives in the template plus the gold-set eval, not in engine keyword switches.
5. **Epic guidance.**
   The claim-graph placement rule (rules R14/R15): each claim carries a `primaryEpic` (its single home epic) and a `supportingEpics` list (every epic it supports, including the primary; many-to-many and acyclic), with a one-sentence `edgeRationale` when more than one epic is supported.
   This replaces the free-text `claimSemanticGroup` as the canonical grouping; deriving an epic from `claimSemanticGroup` is lossy and is not done.
6. **Epic catalog.**
   The closed epic vocabulary the agent collapses claims onto, supplied by the adapter (`claim_discovery.epic_catalog`) and rendered into the template as a list of `{epicId, branch, title, userStory}`.
   Epics are repo-specific, so they arrive through the adapter exactly like `classification_hints`, never hardcoded in the binary; an empty catalog renders an empty list and the agent falls back to short free-text epic labels with `claimSemanticGroup` for grouping.
7. **Uncertainty rule.**
   When the agent is unsure whether text is a claim, it emits the claim with `verificationReadiness: blocked` and an entry in `unresolvedQuestions` instead of silently dropping it.

The exact template prose is implementation-slice work and will be iterated against the gold-set comparison measurement; this contract fixes the required sections and the provenance mechanism, not the wording.
`templateHash` is the sha256 of the canonical JSON of the rendered template block excluding the hash field itself, so it covers the template prose, the merged adapter conventions, and the merged epic catalog; two repos with different adapter headings or epic catalogs produce different hashes by design.

## Packet Contracts

### cautilus.claim_extraction_input.v1

```json
{
  "schemaVersion": "cautilus.claim_extraction_input.v1",
  "sourceRoot": ".",
  "gitCommit": "abc123",
  "extractionTarget": "first-extraction",
  "effectiveScanScope": {},
  "sources": [
    {
      "path": "README.md",
      "contentHash": "sha256:...",
      "audienceHint": "user",
      "status": "extract"
    }
  ],
  "template": {
    "templateVersion": "v1",
    "templateHash": "sha256:...",
    "claimDefinition": "...",
    "nonClaimConventions": {
      "nonClaimSectionHeadings": ["Deferred Decisions", "Rejected Alternatives"]
    },
    "excerptRules": "...",
    "routingGuidance": "...",
    "uncertaintyRule": "..."
  },
  "bounds": {
    "maxClaimsPerSource": 80,
    "maxExcerptChars": 600
  },
  "outputSchema": "cautilus.claim_extraction_result.v1"
}
```

`extractionTarget` is `first-extraction` or `refresh`.
On refresh, `sources[].status` is `extract` for git-diff-changed sources and `carried-forward` for unchanged sources, and a `previousPacket` block records the prior packet path and its reviewed commit.

### cautilus.claim_extraction_result.v1

```json
{
  "schemaVersion": "cautilus.claim_extraction_result.v1",
  "extractionInputRef": {
    "path": "extraction-input.json",
    "templateHash": "sha256:..."
  },
  "runtime": {
    "model": "model-id-when-available",
    "agent": "cautilus-agent"
  },
  "claims": [
    {
      "summary": "Commands emit durable packets with enough state for the next agent to resume.",
      "excerpts": [
        {
          "path": "README.md",
          "line": 12,
          "verbatim": "every command writes a durable packet that the next agent can resume from",
          "primary": true
        }
      ],
      "recommendedProof": "deterministic",
      "recommendedEvalSurface": "dev/repo",
      "verificationReadiness": "ready-for-proof",
      "claimAudience": "user",
      "claimSemanticGroup": "Packets and reporting",
      "primaryEpic": "D1-discovery",
      "supportingEpics": ["D1-discovery"],
      "unresolvedQuestions": []
    }
  ],
  "skippedSources": []
}
```

The result carries no `claimId`, no `claimFingerprint`, and no evidence fields: display ids and fingerprints are binary-owned and computed during `apply-extraction`, and extraction is not evidence reconciliation.
`runtime` is recorded when available, matching the review-result provenance rule.

### Applied proof-plan additions

`apply-extraction` emits a standard `cautilus.claim_proof_plan.v1` packet with these additions:

- `extractionMode: "agent"` at the top level.
  `discover claims` heuristic output writes `extractionMode: "heuristic"` going forward; a packet without the field reads as `heuristic` for backward compatibility.
- `extractionAudit` block: `templateVersion`, `templateHash`, `anchoringPolicy`, `rejectedClaimCount`, and bounded `rejectedClaims[]` entries with `reason` (`unanchored`, `missing-primary`, `empty-excerpt`, `excerpt-too-long`, `duplicate-fingerprint`, `source-not-in-scope`).
  Rejection is recorded, never silent.
- Result `excerpts[]` persist into the applied claim's `sourceRefs` as `{path, line, excerpt, primary}`, where `excerpt` is the verbatim text and exactly one ref per claim carries `primary: true`.
  Heuristic packets keep their current `sourceRefs` shape with no `primary` field; their primary excerpt is implicit because every merged ref carries the identical normalized claim text.
  Anywhere the contract says "primary excerpt" of a packet claim, it means the `primary: true` ref when present, else the shared excerpt text.
- Agent-extracted claims carry `reviewStatus: "agent-reviewed"`, `evidenceStatus: "unknown"`, `evidenceRefs: []`, and `lifecycle: "new"` (or `carried-forward` on the refresh path).
  Evidence preflight and evidence reconciliation remain separate steps with unchanged semantics.
- Claim-graph facets persist into the applied candidate when the agent emits them: `primaryEpic`, a normalized `supportingEpics` (de-duplicated and led by `primaryEpic`), a derived `multiEpic` boolean, and `edgeRationale` for multi-epic claims.
  Normalization never drops a real claim: a claim with no epic facet keeps `claimSemanticGroup` as the fallback grouping, and the epic fields are simply omitted.
  Catalog membership (each facet epic is an `epicCatalog` id) is recorded, not enforced, so an unmapped epic surfaces for review instead of rejecting the claim.

### Interaction with shipped claim-state consumers

Three shipped consumers key off `reviewStatus`, so this contract states each interaction explicitly instead of letting implementation discover them:

- `discover claims validate` currently hard-fails any packet that has `agent-reviewed` claims without a top-level `carryForward` audit block.
  That rule is scoped: for `extractionMode: agent` packets, the `extractionAudit` block satisfies the audit-presence requirement, so a first-extraction agent packet (extractionAudit present, carryForward absent) validates; a refreshed agent packet must carry both.
- `discover claims review-input` default-excludes `agent-reviewed` claims unless their evidence is stale.
  For agent-extracted claims this exclusion is intended: extraction is the agent label-review pass, and immediately re-clustering its output for LLM review would double-spend the budget.
  Excluded claims remain auditable in `skippedClaims`, stale evidence re-enters by the existing rule, and human-review upgrades flow through HITL and `apply-review` as today.
- `evaluate claims plan` accepts `agent-reviewed` claims, so extraction alone makes ready `cautilus-eval` claims eval-plannable.
  This is intended: planning is deterministic and plan-only, and the existing budget gates still guard any actual evaluator run.
  The gold-set comparison measurement is the check on whether extraction-time labels are trustworthy enough for this shortcut; if it shows they are not, this interaction is the first thing to revisit.

## Anchoring And Fingerprint Semantics

**Anchoring rule (ratified 2026-06-10):** an excerpt is anchored when its whitespace-normalized text is a substring of the whitespace-normalized content of the source file at the claimed path.
Anchoring normalization is whitespace-only (collapse runs of whitespace, trim); it is deliberately distinct from fingerprint normalization below, and the implementation must not unify them.
The anchoring corpus is the raw file content, including code fences and frontmatter, not the heuristic extractor's filtered block view; the agent quoted from the raw file, so the binary checks against the raw file.
The line number is a locator hint, not part of the anchoring predicate, consistent with the existing rule that line number is a locator, not identity.
Segmentation drift is tolerated by construction: an excerpt that cuts sentence boundaries differently still anchors as long as the text exists verbatim in the source.
An excerpt that is empty or whitespace-only after normalization never anchors; it rejects the claim with reason `empty-excerpt`.
`maxExcerptChars` counts runes, not bytes, matching the rune-counting precedent in the workflow contract.
A claim with any non-anchoring excerpt is rejected by `apply-extraction` and recorded in `extractionAudit.rejectedClaims`.

`apply-extraction` separates command-level failure from claim-level rejection:

- Command-level failures exit non-zero and write no output packet: a `templateHash` mismatch between result and input, a result that fails `cautilus.claim_extraction_result.v1` schema validation, and stale sources without `--allow-stale-sources`.
- Claim-level rejections never fail the command: they are recorded in `extractionAudit.rejectedClaims` and the packet is still written.
  An all-rejected application is visible as `rejectedClaimCount` equal to the submitted count with empty `claimCandidates`; surfacing that as a problem is `validate`/`status` work, not an exit-code special case.

`apply-extraction` recomputes source content hashes before validating.
If a source changed since `extraction-input` was generated, the command fails by default and reports the drifted paths; `--allow-stale-sources` opts into applying anyway, with the drift recorded in `extractionAudit`.
This mirrors the existing stale-packet rejection pattern.
The applied packet's `sourceInventory` always records the extraction-time content hashes (the content the agent actually read), so a later `validate` against drifted files lands on the stale-anchor finding branch instead of hard-failing against content the agent never saw.
`missing-primary` covers both zero and multiple `primary: true` marks; the rejection detail names which case occurred.

**Fingerprint rule (ratified 2026-06-10):** `claimFingerprint = sha256(normalized primary verbatim excerpt)`, unified across both extraction modes.
Fingerprint normalization is today's summary normalization (`normalizeClaimSummary`: strip markdown markers and list prefixes, collapse whitespace), which is stronger than anchoring normalization; the two serve different jobs and stay separate.
When two result claims share the same primary-excerpt fingerprint, the first is kept and the rest are rejected with reason `duplicate-fingerprint`; the template instructs the agent to merge multiple declaration sites into one claim with multiple excerpts instead, and silent payload-dropping merges are deliberately not performed on agent results because agent summaries and routing may differ.
In heuristic mode the stored excerpt equals the normalized summary by construction, so existing heuristic packet fingerprints are unchanged and no migration is needed; a golden test pins this equivalence.
In agent mode the summary is a paraphrase that may drift across re-extractions, while the verbatim primary excerpt is stable as long as the source text is stable; when the source text itself changes, the fingerprint changes, which is the correct `lifecycle: changed` behavior and is already bounded by refresh planning.
Cross-file dedupe semantics are preserved: identical primary excerpt text in different files is one claim with multiple source refs, matching the existing identical-claim-text merge rule.

### discover claims validate extension

`discover claims validate` gains anchoring checks for packets with `extractionMode: agent`:

- When a referenced source file is readable and its content hash matches the hash recorded in the packet, every excerpt must anchor; a failure is a hard validation error, because a correctly applied packet can never contain one.
- When the source content hash differs from the recorded hash, anchoring mismatches are reported as stale-anchor findings without failing validation; resolving them is refresh work, not a packet-shape defect.

`apply-extraction` is the enforcement gate; `validate` keeps applied packets re-auditable later.

## Refresh Integration

Refresh follows the existing design: recorded git commit plus per-source content hashes bound re-extraction to changed sources.

- `extraction-input --previous <packet>` marks unchanged sources `carried-forward` and only changed sources `extract`, so the agent re-reads only the diff.
- `apply-extraction` carries forward claims whose primary excerpt still anchors in unchanged sources, preserving reviewed labels, evidence refs, and unresolved questions by stable fingerprint, exactly as the existing `--previous` carry-forward does.
- The first implementation slice ships first-extraction only; refresh composition is the second slice (see Implementation Slices).

## Fixed Decisions

Maintainer-ratified 2026-06-10 in the interactive shaping session:

- The seam is the `extraction-input` / `apply-extraction` command pair with versioned input and result packets; the lighter validate-only shape (template as skill reference, agent edits candidates in place) was rejected because it loses template-hash provenance and makes the agent assemble binary-owned packet blocks.
- `claimFingerprint` is unified across modes as the sha256 of the normalized primary verbatim excerpt; existing heuristic fingerprints are unchanged by construction.
- Anchoring is whitespace-normalized substring containment; line numbers are locators; non-anchoring excerpts reject the claim.
- Schema names `cautilus.claim_extraction_input.v1` and `cautilus.claim_extraction_result.v1` and the `extractionMode` values `agent` and `heuristic` are ratified; an absent `extractionMode` reads as `heuristic`.

Derived from prior fixed decisions, restated here because this contract depends on them:

- The binary makes no model calls; both new commands are deterministic.
- The extraction template is product-owned, embedded in the binary, and rendered into the input packet with version and hash.
- Each claim carries exactly one `primary: true` excerpt; `apply-extraction` validates exactly-one-primary.
- Routing fields are part of the extraction result (the dissolved proof-routing hint family lives in the template, not in engine keywords).
- The heuristic extractor remains the default `discover claims` behavior and the labeled baseline mode for no-model environments, CI regeneration, and control tests.
- Scan-scope confirmation does not authorize agent extraction; extraction needs its own budget confirmation, per the workflow contract's Model-Spend Confirmation rule.
- The comparison measurement (implementation slice 4) runs through a bounded harness that consumes the same `extraction-input` packet and is scored through `apply-extraction` (ratified 2026-06-10).
  It measures the hypothesis under test — the template plus the seam — not the skill conversation flow; because both paths share the template hash and the same validation, harness results transfer to the product surface.
  Verifying the Cautilus Agent flow itself is later Cautilus-eval-fixture work over the skill surface, following the existing self-dogfood fixture pattern, and is not a prerequisite for the comparison.

## Probe Questions

- Template prose quality: does the v1 template close the yt-digest Korean gap without lexicon hints?
  Measured by the gold-set-scored agent-vs-heuristic comparison slice (S1/S2 artifacts are the before harness).
- Primary-excerpt stability: does the agent pick the same primary excerpt across re-extractions of unchanged sources?
  Measured in the same comparison slice; instability would surface as false `new`/`retired` pairs in a no-op refresh.
- Bounds calibration: are `maxClaimsPerSource` and `maxExcerptChars` defaults right for real corpora?
- How much of `extractionAudit.rejectedClaims` detail is worth keeping in the packet versus a side report.

## Deferred Decisions

- Cross-mode refresh: applying an agent extraction result on top of a heuristic previous packet (or the reverse).
  The first slices keep modes separate; the comparison measurement needs side-by-side packets anyway.
- Cluster or batch splitting of `extraction-input` for repos whose source set exceeds one agent context; the input packet records source counts so the agent can batch by source meanwhile.
- When the repo-local `claims:refresh:all` push gate switches from regenerate to validate-plus-staleness-report in agent mode (handoff discussion item; needs `apply-extraction` to exist first).
- Whether the template ever becomes adapter-extensible beyond the existing `classification_hints` channel.

## Non-Goals

- Moving LLM calls, model selection, or subagent scheduling into the binary.
- Changing the review seam (`review-input` / `apply-review`), evidence semantics, or the status/eval-plan commands.
- Generic multilingual NLP; the template plus `classification_hints` is the whole language story.
- Removing or weakening the heuristic baseline mode.
- A per-claim `dominant` field (gold-set scoring device only).

## Deliberately Not Doing

- No fingerprint from the lexicographically smallest excerpt or from the excerpt set hash: set-min identity drifts when a new declaration site appears, and set hashes drift when any excerpt is added.
  The explicit `primary` flag is auditable and survives careless array reordering; its re-extraction stability is a measured probe, not an assumption.
- No fuzzy anchoring (edit-distance thresholds): it gives validation a nondeterministic boundary and conflicts with the binary's deterministic contract.
- No exact-line anchoring requirement: one added line at the top of a file would reject every claim in it, and refresh would re-anchor constantly.
- No separate `extract claims` top-level command: extraction stays under `discover claims`, the one user-facing discovery action.

## Constraints

- New runtime surfaces ship with executable tests in the same slice (repo working rule).
- `skills/cautilus-agent/SKILL.md` stays within the 180-nonempty-line disclosure budget when the agent flow is updated; binary-owned detail (packet examples, command catalogs) belongs to the binary's help and docs per the progressive-disclosure rule.
- The adapter-not-hardcoded control test and the frozen-defaults golden fixture keep applying: the template carries merged hints, never new repo-specific hardcoding.
- Claim-state refresh chain runs after claim-source-touching slices.

## Success Criteria

1. An applied agent packet never contains a claim that failed anchoring at apply time: fabricated or paraphrased excerpts are rejected with a recorded reason, not silently dropped.
   (`--allow-stale-sources` can apply a packet whose excerpts no longer anchor against drifted current content; the drift is recorded in `extractionAudit` and surfaces as stale-anchor findings in `validate`.)
2. Existing heuristic packets keep byte-identical fingerprints under the unified excerpt-hash rule.
3. `extractionMode` is visible in every new packet, and packets without it read as heuristic everywhere the field is consumed.
4. Template provenance survives the round trip: the template hash in the input packet, the result packet, and the applied packet's `extractionAudit` all match.
5. A no-op refresh over unchanged sources carries every agent-extracted claim forward with stable fingerprints.
6. Neither new command makes a model call.

## Acceptance Checks

The implementation slices that consume this contract should include:

- anchoring validation unit tests: anchored excerpt passes, fabricated excerpt rejects, whitespace-segmentation drift anchors, wrong-path excerpt rejects, missing-primary rejects, source-drift fails without `--allow-stale-sources`
- a fingerprint golden test proving an existing heuristic packet's fingerprints are unchanged under the unified rule
- packet schema tests for `cautilus.claim_extraction_input.v1` and `cautilus.claim_extraction_result.v1`, including command-registry example schema checks
- `apply-extraction` tests proving rejected claims appear in `extractionAudit.rejectedClaims` and never in `claimCandidates`
- `discover claims validate` tests for the hash-match hard-fail and hash-drift stale-finding branches
- a specdown `run:shell` example running `extraction-input` against a fixture repo
- a default-read test proving a packet without `extractionMode` is treated as heuristic by the consumers that branch on the field
- a validate test proving a first-extraction agent packet (extractionAudit present, no carryForward) passes the audit-presence rule
- carry-forward tests on the refresh slice proving unchanged-source claims keep fingerprints, labels, and evidence refs

## Critique

Fresh-eye satisfaction: parent-delegated.
A bounded read-only fresh-eye critique ran against this contract and the live Go implementation on 2026-06-10; verdict ready-with-edits, all findings resolved in the same slice.

Blockers found and resolved:

- `reviewStatus: agent-reviewed` collided with three shipped consumers (validate's carry-forward presence rule, review-input's already-reviewed exclusion, eval-plan eligibility); resolved by the "Interaction with shipped claim-state consumers" section.
- The primary excerpt had no representation in the applied proof-plan packet, making the validate extension and refresh carry-forward uncomputable; resolved by the `sourceRefs` `{path, line, excerpt, primary}` persistence rule.

Act-before-ship findings folded in: the workflow contract's stale combined-fingerprint sentence realigned to the ratified rule; anchoring versus fingerprint normalization named as deliberately distinct; `duplicate-fingerprint` and `empty-excerpt` rejection reasons; rune-counted `maxExcerptChars`; raw-file-content anchoring corpus; command-level versus claim-level failure contract; success criterion 1 qualified for `--allow-stale-sources`; the agent-surface work made an explicit slice; the `state_path` dogfood caveat; default-read and audit-presence acceptance checks.

Over-worry (dismissed): normalization idempotency corners (pinned by the golden test), agent-supplied wrong line numbers (locator-only by ratified decision), position-free duplicate excerpt matches (accepted in the ratified rule), missing `previousPacket` in the input example (refresh is a later slice), `skippedSources` reason vocabulary (slice-level schema detail).

Slice 1 implementation critique (2026-06-10): a second parent-delegated read-only fresh-eye review ran against the landed slice-1 change set and this contract; verdict ready, no blockers.
It re-verified the fixed decisions, all six success criteria, the slice-1 acceptance checks, and the three shipped-consumer interactions against the live Go code, and dismissed markdown-marker fingerprint collisions, line-locator identity, rune counting, and `RequireFreshClaimPacket` compatibility as over-worry.

## Canonical Artifact

This document is the canonical contract for the extraction seam during implementation.
The direction decision and the surrounding discovery workflow remain canonical in [claim-discovery-workflow.md](./claim-discovery-workflow.md); on conflict, this document wins for extraction-seam detail and the workflow contract wins for workflow-level boundaries.

## Implementation Slices

1. **First extraction (binary)** — shipped 2026-06-10: `extraction-input` (first-extraction target only), embedded template v1, `apply-extraction` with anchoring validation, unified fingerprint rule plus golden test, `extractionMode` field, `validate` anchoring and audit-presence extensions, registry/schema/spec coverage.
   Proof: the `TestBuildClaimExtraction*`/`TestApplyClaimExtraction*`/`TestClaimFingerprintGolden*` family in [internal/runtime/claim_extraction_test.go](../../internal/runtime/claim_extraction_test.go), the CLI round trip in [internal/app/app_test.go](../../internal/app/app_test.go), packet schemas under [fixtures/claim-extraction/](../../fixtures/claim-extraction), and the executable seam section in [docs/specs/user/claim-discovery.spec.md](../specs/user/claim-discovery.spec.md).
2. **Agent surface**: the Cautilus Agent extraction flow — extraction-budget confirmation gate, template-following extraction, result-packet authoring — within the SKILL.md disclosure budget; this slice triggers the consumer-intent-freeze rule for `skills/cautilus-agent/` changes.
3. **Refresh composition**: `extraction-input --previous`, carried-forward sources and claims, no-op refresh stability test.
4. **Comparison measurement**: gold-set-scored agent-vs-heuristic run over the three corpora, through the bounded measurement harness fixed above (separately shaped; S1/S2 artifacts are the before harness, and `--adapter` overrides keep the sibling corpora read-only).

The harness decision relaxes the ordering: slice 4 depends on slice 1 plus the gold-set maintainer verdicts (the repurposed S0 HITL queue), not on slice 2, so the comparison can run before the skill surface ships.

Until the deferred `claims:refresh:all` gate decision lands, agent packets in this repo's own dogfood should target a path other than the adapter's `state_path`, because the push gate regenerates `state_path` heuristically and would overwrite or staleness-trip an agent packet.
