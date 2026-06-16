# Debug Review
Date: 2026-06-16

## Problem

Agent extraction over the five refreshed discovery docs produced 292 claims for the regenerated gold set, which looked excessive and unreviewable; the maintainer questioned whether the extraction was sound at all before grading it.

## Correct Behavior

Given agent extraction is the agent-primary replacement for heuristic discovery, when it runs over a source set, then the surface a maintainer ratifies as a gold set should be a curated set of product behavior claims at a consistent layer — not the raw high-recall extraction packet, and not a mix of user-facing product promises with internal maintainer-process rules.
The product design already states this separation: raw `discover claims` packets are "the high-recall, source-ref-backed proof-planning input, not the primary document a user should review" (README), and "the Cautilus Agent curates that packet" before review.

## Observed Facts

- Agent extraction emitted 292 claims over 5 docs; `apply-extraction` anchored 292/292 with 0 rejections and `validate` reported a clean packet.
- On the same 5 files the heuristic packet holds 111 claims: README 15, cli.md 21, claim-discovery-workflow 67, claim-extraction-template 7, working-patterns 1.
- Agent per-file: README 35, cli.md 78, claim-discovery-workflow 79, claim-extraction-template 52, working-patterns 48.
- working-patterns.md: heuristic 1 vs agent 48; all 48 agent claims are `claimAudience: developer`, and 19 of them route to `cautilus-eval` (e.g. "premortem runs at two points", "follow-up renumbering") — internal maintainer-process rules treated as Cautilus-provable product behavior.
- Sampled cli.md and working-patterns claims are mostly distinct, non-redundant behaviors, not shredded sentences (a fresh-eye reviewer judged ~19/20 of a README+cli sample genuinely distinct); only 3 summary-pairs exceed 0.5 word-Jaccard (one real cross-source dup: `consumer:onboard:smoke` in README and cli.md).
- Per-file density on identical inputs is the honest metric, and the agent is denser everywhere: heuristic 111 over the 5 files (avg 22/file) vs agent 292 (avg 58/file), 2.6x on the same text. cli.md 21->78 (3.7x), claim-extraction-template 7->52 (7.4x), README 15->35 (2.3x). The repo-wide heuristic average is 6.2 claims/file (384 over 62 files); the agent concentrated 58/file on the 5 chosen docs. So this is density escalation, not only heuristic under-reading.
- The per-source extraction ceiling was `maxClaimsPerSource: 80`; the highest per-file count was 79, so the ceiling was never the binding constraint.

## Reproduction

`python3` count comparison of `.cautilus/claims/latest.json` (heuristic, 111 over the 5 files) against `charness-artifacts/eval-trust/goldset-v2-agent-extraction/claims-agent.json` (agent, 292) reproduces the 2.6x gap; per-file breakdown reproduces working-patterns 1 vs 48 and cli.md 21 vs 78.

## Candidate Causes

- My orchestration inflated the count: per-source subagents, an 80-claim ceiling, and no cross-source view, each maximizing its own recall.
- The extraction template prose is too inclusive: a broad claim definition plus an uncertainty rule that biases toward emitting (`emit as blocked` rather than dropping) and no "worth proving as a product claim" / layer filter.
- Design-intent mismatch: agent extraction is meant to be high-recall, with a separate curation/triage step that reduces and layers it before any review surface — and that step was skipped.
- Source-scope error: the gold-set source set mixed user-facing product docs (README, cli, two contracts) with an internal maintainer-process doc (working-patterns), which extracts developer-process rules at a different claim layer than product behavior promises.
- The count alarm itself is a measurement artifact: the heuristic massively under-reads (Korean working-patterns -> 1, dense extraction template -> 7), so "292 > 111" is a contaminated comparison, not clean evidence of agent bloat.

## Hypothesis

The cause is structural, not mechanical: a source-scope layer-mix plus conflation of the raw high-recall extraction packet with the curated gold-set/review surface, on top of a template that over-emits because it has no worth-proving/layer triage.
If true: the agent's individual extractions are mostly distinct (not sentence-shredding), the orchestration ceiling is non-binding, the heuristic under-reads on some files (working-patterns, dense template), AND the agent still over-emits per-file on identical inputs (so "distinct" does not equal "worth proving as a product claim").

## Verification

- Sampling cli.md (L25-75) and working-patterns (L8-45) shows distinct, non-redundant behaviors, not shredded sentences -> orchestration-shredding hypothesis falsified as the dominant cause.
- Ceiling 80 vs max observed 79 -> ceiling falsified as the binding constraint.
- Heuristic under-read confirmed (working-patterns 1, extraction-template 7) -> the raw-count comparison is contaminated; the gap is partly heuristic blindness, not agent over-extraction.
- working-patterns: 48/48 developer-audience, 19 routed to cautilus-eval -> confirms the layer-mix: internal process rules extracted as product behavior claims.
- The product's own claims #10/#11 (raw packet is not the review surface; the agent curates) were extracted in this very run and then violated by making the raw packet the gold-set surface -> confirms the conflation root cause.

## Root Cause

Three distinct defects, in priority order (reweighted after fresh-eye review):

1. **Source-scope violation (prerequisite error).** `docs/internal/working-patterns.md` was put in a product-claim gold set, mixing developer maintainer-process rules (48 developer-audience claims, 19 mis-routed to cautilus-eval) with product behavior promises at a different claim layer. This is category confusion, not heuristic under-reading, and it must be fixed before anything downstream is meaningful.
2. **Surface conflation.** The reviewable gold-set surface was taken to be the raw agent extraction packet directly, collapsing the product's designed separation between high-recall extraction and curated review (README #10/#11, which this run extracted and then violated).
3. **Extraction-template over-emission bias.** On identical inputs the agent extracts 2.6x denser than the heuristic (cli.md 3.7x, claim-extraction-template 7.4x). The claims are mostly distinct, but "distinct" is not the same gate as "worth proving as a product claim"; the template's broad claim definition plus emit-when-unsure rule, with no worth-proving/layer/audience triage, makes the agent over-emit exactly as designed. The earlier "largely a measurement artifact" framing was an overcorrection: heuristic under-reading explains working-patterns and the dense template, but it does not explain the 3.7x density on cli.md — that is real over-emission.

All three are design decisions (scope, curation layer, template triage) rather than a code bug, which is why the next step is spec, not a single patch.

## Invariant Proof

- Invariant: n/a - not a workflow-boundary propagation bug; the defect is a design-layer conflation, not a producer-to-consumer data corruption
- Producer Proof: n/a
- Final-Consumer Proof: n/a
- Interface-Shape Sibling Scan: n/a
- Non-Claims: anchoring/validate gates are working as specified (292/292 anchored); they prove excerpt shape, not claim meaningfulness/layer

## Detection Gap

- gold-set bootstrap | no gate checked whether the review surface was a curated set vs the raw high-recall packet, nor whether source scope mixed claim layers; `apply-extraction` passed because it only validates excerpt shape | smallest change to fire it: a one-line source-scope gate that excludes `docs/internal/*` from product-claim discovery unless explicitly toggled (cheap, prevents recurrence on the next run), plus a density/layer sanity check at gold-set bootstrap (claims-per-source ratio + audience/layer mix), or simply enforcing the product's own "raw packet is not the review surface" rule before HITL

## Sibling Search

- Mental model (wrong): "agent extraction output is the gold-set / review surface."
- design axis: heuristic over-extraction (sentence-length detector) was the original problem that motivated the agent rewrite; the granularity/layer question recurs here on the same extraction seam | decision: route to spec, not a quick fix | proof: count comparison + sample inspection in this artifact
- scope axis: `docs/internal/working-patterns.md` mixed an internal-process layer into a product-claim gold set | decision: source-scope/layer is a spec decision | proof: 48/48 developer audience, 19 cautilus-eval mis-routes
- cross-file: the curation step the product design names (README #10/#11 "raw packet is not the review document; the Cautilus Agent curates") is the sibling I skipped | decision: the missing curation layer is the dominant root cause | proof: those claims were extracted in this run and contradicted by the run's own use
- follow-up: the extraction template lacks a "worth proving as a product claim" / layer-and-audience triage signal; whether that belongs in the template, in a curation pass, or in scan scope is the spec decision

## Seam Risk

- Interrupt ID: extraction-granularity-seam-2026-06-16
- Risk Class: repeated-symptom
- Seam: claim extraction granularity/layer (heuristic over-extraction -> agent layer-mix; same seam, recurring symptom)
- Disproving Observation: a curation/triage design that produces a layered, product-claim-scoped review surface whose count and audience mix are defensible would resolve this
- What Local Reasoning Cannot Prove: whether agent extraction should be high-recall-then-curate or filtered-at-extraction is a product/design decision, not a locally decidable patch; and any consumer repo running agent extraction over a scan scope that includes internal docs will hit the same layer-mix
- Generalization Pressure: factor-now

## Interrupt Decision

- Critique Required: yes
- Next Step: spec
- Handoff Artifact: charness-artifacts/spec/2026-06-16-agent-extraction-curation-layering.md

The spec handoff decides (a) extraction-vs-curation-vs-gold-set layering, (b) scan-scope/layer treatment of internal docs, (c) whether a "worth proving as a product claim" + audience/layer triage signal belongs in the template, a curation pass, or scan scope. The design decision affects the workflow and extraction/curation contract, so the spec slice carries the delegated design critique; this diagnosis itself was fresh-eye reviewed before closeout.

## Prevention

Before treating any extraction packet as a review/gold-set surface, apply the product's own rule that raw packets are high-recall planning input, not the review document, and run the curation/triage step first; at gold-set bootstrap, sanity-check claims-per-source density and audience/layer mix, and keep internal-process docs out of a product-claim gold set unless the layer decision explicitly includes them.

Diagnosis critique (delegated fresh-eye subagent, 2026-06-16): verdict PARTIALLY TRUSTWORTHY — trustworthy for why the count is high (scope + conflation + no curation layer), not for what to do. It flagged that (1) the original "measurement artifact" framing was self-serving because per-file density on identical inputs is 2.6x (cli 3.7x) — real over-emission, not only heuristic under-reading; (2) the working-patterns inclusion is a prerequisite scope violation, not co-equal with the missing curation step; (3) routing straight to spec skips a cheap immediate source-scope gate. All three were folded back into Observed Facts, Root Cause, and Detection Gap above and into the spec seed, which must keep two constraints visible — whether internal docs stay in gold-set scope, and whether triage happens at template revision or downstream curation.

## Related Prior Incidents

- `debug-2026-06-10-claim-review-id-drift-refresh-loss.md` — same agent-primary extraction push; that incident hardened verbatim-excerpt fingerprints as the stable claim identity, which this layering decision will build on.
- The original heuristic "sentence-length detector" over-extraction finding (goal artifact, 2026-06-10) — this is the same extraction-granularity seam recurring under the agent.
