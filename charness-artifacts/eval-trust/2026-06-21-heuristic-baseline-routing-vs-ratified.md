# Heuristic baseline proof-routing vs ratified ground truth (2026-06-21)

Measurement date: 2026-06-21.
Question (Fork C consolidation): before building any "per-facet routing" slice, where does the *checked-in, CI-visible* claim population's `recommendedProof` routing actually stand against the ratified ground truth?

This is a cheap, fully deterministic measurement (no LLM) run to make the next-slice decision evidence-based, after discovering that the 2026-06-10 facet-decomposition "Next step" was partially overtaken by the agent-template generalization (`b922fd5d`) and the maintainer override surface (`claim-proof-route-overrides.json`).

## The surface that produces the live claims

`npm run claims:refresh:all` runs `cautilus discover claims` deterministically, so the checked-in `.cautilus/claims/latest.json` carries `extractionMode: heuristic` — it is produced by the hardcoded `classifyClaimLine` switch in `internal/runtime/claim_discovery.go` (~line 1420), the explicitly-labeled *baseline* extractor, **not** the agent-primary extraction template.

This matters: the R6/R12 routing discipline (ownership / boundary / sequencing / static-capability-check → `deterministic`) was landed in the agent-primary *template* (`b922fd5d`, MEASUREMENT.proof-route.md 2026-06-18) and is pinned for individual ratified corrections in the override surface, but it was **never propagated into the deterministic engine baseline**. The baseline still routes ownership/boundary claims to `human-auditable` (`ownershipBoundaryClaim`, claim_discovery.go:1445) — the opposite of the ratified R6/R12 call.

## Route distribution (tendency signal)

| recommendedProof | live heuristic baseline (397) | ratified answer key (375, agent + HITL) | agent template after b922fd5d (374) |
| --- | --- | --- | --- |
| deterministic | 140 (**35.3%**) | 279 (74.4%) | 74.3% |
| cautilus-eval | 144 (**36.3%**) | 40 (10.7%) | 10.7% |
| human-auditable | 113 (28.5%) | 56 (14.9%) | 15.0% |

The live heuristic baseline routes **~3.4x more claims to `cautilus-eval`** than the ratified ground truth (36.3% vs 10.7%) and only half as many to `deterministic` (35.3% vs 74.4%).
This is precisely the "cautilus-eval over-assignment" the gold-set R6/R12 work corrected in the template — the genuinely-semantic facet is the minority, but the baseline switch treats it as a plurality.

Caveat: the heuristic and agent extractors find *different claim lines*, so the three columns are not the same claim set; this table is a routing-*tendency* comparison, not per-claim accuracy. The next section gives the per-claim number on the overlap.

## Per-claim accuracy on the fingerprint overlap

Matching by `claimFingerprint` (sha256 of the normalized primary excerpt) between live (397) and the ratified answer key (375, frozen at `628ccc7`, 108 commits behind HEAD):

- **Overlap: 49 fingerprints** — claim sentences both extractors picked and that survived to HEAD.
- **Agreement: 22/49 = 45%** route match between the heuristic baseline and the ratified key route.
- Disagreements are dominated by **live `cautilus-eval` → key `deterministic`** (verdict `accept`), the R6/R12 over-eval pattern; a few are live `human-auditable` → key `deterministic`.

Caveats: the key route used is the agent pre-ratification `recommendedProof`, which equals the ratified route for `accept` entries (the sampled disagreements are all `accept`); applying the 19 relabels + the 1 override surface entry could move the number by ~1-2 points but not the direction. The 49-overlap is a sample (the cross-extractor, cross-108-commit intersection), not the whole population.

## Finding

The deterministic engine baseline — the routing surface that actually produces the checked-in and CI-visible claim population — is the **unaddressed routing surface**. R6/R12 reached the agent template and the override surface but not `classifyClaimLine`, so the live routing is ~45% accurate against ratified ground truth and over-routes to `cautilus-eval` by ~3.4x.

This reframes the next-slice decision recorded in the Fork analysis:

- **Fork A (correct the engine baseline routing toward R6/R12) is NOT low-value** — that earlier read assumed the baseline was vestigial. It is not: it is the deterministic, CI-reproducible path, and it is the one that disagrees with ground truth. Bringing R6/R12 into `classifyClaimLine` (portable defaults) plus an adapter-owned routing-hint extension family is the highest measured-value next slice, and it stays deterministic (no LLM in the standing path).
- **Fork B (true per-facet decomposition for the population)** remains the deeper end-state but is gated behind the cheaper, higher-accuracy-gap baseline correction.

## After: R6/R12 baseline correction landed (2026-06-21)

The R6/R12 engine-baseline correction + adapter routing-hint extension family landed (build contract: [2026-06-21-r6r12-baseline-routing.spec.md](./2026-06-21-r6r12-baseline-routing.spec.md)).
Re-measured against the same 49-fingerprint overlap and answer key after `npm run claims:refresh:all`:

| metric | before | engine change only | final committed (+ same-slice doc realign) |
| --- | --- | --- | --- |
| overlap agreement | 22/49 (45%) | 26/49 (53%) | **26/48 (54%)** |
| over-correction signature (live `deterministic`, key `human-auditable`) | 0 | 0 | **0** |
| live `deterministic` | 140 | 148 | 148 |
| live `human-auditable` | 113 | 105 | 104 |
| live `cautilus-eval` | 144 | 144 | 145 |

Both binding gates met: overlap agreement rose from 45% to 54% (the agreeing count went 22 → 26) and there are **zero new** `human-auditable → deterministic` over-corrections.
The overlap shrank 49 → 48 in the final column because this slice also realigned a stale ownership sentence in `claim-discovery-workflow.md` (the line that previously said ownership boundaries "should stay human-auditable"), which changed that one claim's fingerprint so it no longer matches the frozen answer key — an expected consequence of the same-slice doc realignment, not a routing regression (the agreeing count is unchanged at 26).

Honest scope of the gain:

- **The entire live improvement is R6** (ownership/boundary *assignment* → deterministic): 8 claims moved `human-auditable → deterministic`, 4 of them inside the overlap and matching the ratified `deterministic` key. The flip was scoped to the explicit-assignment clauses (`should own`, `belongs to/in …`); the broad ownership-prose clause and reconciliation-shaped ownership lines deliberately stayed `human-auditable` (critique 2026-06-21).
- **R12 (capability-existence) fired on zero live claims and is correct-but-dormant here.** Its archetypal gold claim `claim-readme-md-140` (the GEPA-style seam, README.md:140) is over the 260-rune `claimLineLooksUseful` extraction bound, so it is never extracted into the live population. R12 is unit-frozen for when such a claim becomes extractable; it is not what moved the live number.
  **Correction (2026-06-21, superseded by the rune-bound-recall slice):** this "dormant only because of length" read was incomplete. A later debug ([../debug/2026-06-21-r12-ships-lexicon-gate-dead.md](../debug/2026-06-21-r12-ships-lexicon-gate-dead.md)) found R12 was *structurally* dead: it keys on `" ships "`, which the lexicon gate did not admit, so even a sub-260 `" ships "` claim was dropped before classification. The [rune-bound-recall slice](./2026-06-21-rune-bound-recall.spec.md) relaxed the bound to a 2000-rune cap *and* added `" ships "` to the lexicon; R12 now fires live on `claim-readme-md-140` (`deterministic`).
- **`cautilus-eval` over-assignment is only partially addressed.** R6 fixes the `human-auditable → deterministic` subset, not the `cautilus-eval → deterministic` disagreements the per-claim section flagged as dominant. Those remaining eval→det disagreements are not ownership/capability-existence shapes the portable defaults safely catch; reducing them is follow-up work (true per-facet decomposition, Fork B), not this slice.

## Reproduction

```
jq -r '[.claimCandidates[]?.recommendedProof] | group_by(.) | map({route:.[0],n:length})[] | .route+" "+(.n|tostring)' .cautilus/claims/latest.json
# fingerprint overlap + agreement: jq -n --slurpfile live .cautilus/claims/latest.json \
#   --slurpfile ak charness-artifacts/eval-trust/goldset-v2-reextract-head/gold-set-proposal.json '<overlap expression>'
```

Source surfaces: `internal/runtime/claim_discovery.go` (`classifyClaimLine`, `ownershipBoundaryClaim`), `charness-artifacts/eval-trust/goldset-v2-reextract-head/gold-set-proposal.json` (answer key), `charness-artifacts/eval-trust/2026-06-19-recommendedproof-facet-gold-set-v2head.{md,json}` (R6/R12 facet gold set), `docs/specs/audit/claim-proof-route-overrides.json` (override surface).
