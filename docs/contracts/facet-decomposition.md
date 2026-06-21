# Facet decomposition: route each facet of a claim to the tool reliable for it

Status: decided 2026-06-09, grounded in the reasoning-soundness prototype rather than asserted.
This is the operating template for proving a discovered claim, and it refines how `discover`'s `recommendedProof` is meant to be read.
It builds directly on [eval-judge-collaboration.md](./eval-judge-collaboration.md) decision D2.

## The rule

A claim is not proven by one mechanism.
It is decomposed into facets, and each facet is routed to the tool that is reliable for it.

- Mechanical, checkable facets go to CODE: length, list/bullet presence, a required line, language, structure under an agreed interpretation.
  Code is consistent on these every time; handing them to a judge makes them inconsistent.
- Genuinely semantic facets go to a bounded INTELLIGENCE judge: did the answer substantively address the question, did it fabricate, did the behavior achieve the user's intent.
  Code cannot check these.
- Facets that are neither cleanly mechanical nor safely automatable go to HUMAN review, recorded as an explicit non-claim until promoted.

The claim's verdict is the AND of its facet verdicts.
A claim is therefore a composite of code gates plus intelligence judgment plus human-held facets, never a single mechanism.

## Why this is not "route the claim", but "route the facet"

The empirical finding behind this template is that the code/intelligence line falls INSIDE a single claim, facet by facet, not between claim types.
The reasoning-soundness judge was run on a semantic claim (chat conversation-goal achievement) and failed calibration only on the facet where it was doing a mechanical check (paragraph structure), while staying reliable on the genuinely semantic facets.
Moving the mechanical facets to code and leaving the judge only the semantic facets made the same claim pass 4/4.
Full detail: [charness-artifacts/findings/2026-06-09-code-intelligence-harmony-boundary.md](../../charness-artifacts/findings/2026-06-09-code-intelligence-harmony-boundary.md).

So `discover`'s per-claim `recommendedProof` (`deterministic | cautilus-eval | human-auditable`) is too coarse as a per-claim label.
The same three values are the right vocabulary, but they belong on each facet of a decomposed claim, not on the claim as a whole.
A claim tagged `cautilus-eval` almost always still has deterministic facets that code should own, and a claim tagged `deterministic` may hide a semantic facet that only a judge can see.

## The reference implementation

The reasoning-soundness judge harness is the reference implementation of this template.

- `scripts/agent-runtime/reasoning-soundness-judge.mjs` owns the deterministic comparator, the `FORMAT_FACET_CHECKERS` registry (the CODE facets), and `computeCodeFacets`.
- A calibration fixture declares `codeFacets` (a list of registered checker keys) and `judgeFacets` (the semantic facets the blind judge assesses).
- `compareVerdicts` composes them: when `codeFacets` is present it ANDs the code-computed facets with the judge's semantic verdict; otherwise it uses the judge verdict directly (a routing claim whose only facet is semantic-or-token).
- The judge is captured once, blind, and replayed deterministically (prove-then-project), so live cost is paid once per claim.

The conversation-goal claim is the worked example of a decomposed claim; the two routing claims are the degenerate case where the claim has a single facet and no `codeFacets`.

## How to decompose a new claim

1. State the claim and enumerate its facets.
2. For each facet, decide its route honestly: code if it is mechanical and you can write a reproducible checker; judge if it is genuinely semantic; human if it is neither.
3. Add any new deterministic checkers to `FORMAT_FACET_CHECKERS` (with a unit test on synthetic inputs), and list their keys in the calibration's `codeFacets`.
4. Write the semantic `judgeFacets`, `judgeBrief`, and `verdictDefinition` scoped to meaning only — the judge must be told NOT to judge the facets code owns, or it will do them inconsistently.
5. Capture the blind judge once and replay; the gate is the AND.
6. If a facet is ambiguous (the judge and a human could read it two ways), get the maintainer to disambiguate the interpretation before code owns it — that is what turned the conversation-goal structure facet from a judge inconsistency into a code rule.
7. Make the judge load-bearing: include at least one case that each half alone can fail. A claim whose only negatives come from code would pass with an always-sound (broken) judge, leaving the semantic seat unproven — so add a case where every code facet passes but the content is unsound (a semantic control, the analog of a routing claim's rubber-stamp control). The harness test suite enforces this: every decomposed claim must reject an always-sound judge.

## Next step: adapter-owned classification hints, then per-facet routing

Status update (2026-06-21, Fork C consolidation): this section's 2026-06-10 plan was partially overtaken by later work.
Routing knowledge reached two surfaces — the agent-primary extraction *template* (`b922fd5d`, which carries the R6/R12 ownership/boundary/sequencing → deterministic discipline, MEASUREMENT.proof-route.md) and the maintainer *override surface* (`docs/specs/audit/claim-proof-route-overrides.json`, `cautilus.claim_proof_route_override.v1`) — but it did **not** reach the deterministic engine baseline `classifyClaimLine` (`internal/runtime/claim_discovery.go`), which still routes ownership/boundary claims to `human-auditable` (the opposite of R6/R12).
Because `claims:refresh:all` runs the heuristic baseline deterministically, the checked-in / CI-visible claim population is produced by that un-corrected baseline: measured 2026-06-21, it is ~45% route-accurate against ratified ground truth on the fingerprint overlap and over-routes to `cautilus-eval` by ~3.4x (36.3% vs the ratified ~11%).
Full measurement: [charness-artifacts/eval-trust/2026-06-21-heuristic-baseline-routing-vs-ratified.md](../../charness-artifacts/eval-trust/2026-06-21-heuristic-baseline-routing-vs-ratified.md).
So the concrete, highest-measured-value form of this "Next step" is now: bring R6/R12 into the engine baseline (portable defaults plus an adapter-owned routing-hint extension family, mirroring the `non_claim_section_headings` default+extension pattern), kept deterministic; true per-facet decomposition for the whole population stays the deeper end-state gated behind it.

Landed (2026-06-21, R6/R12-into-baseline slice): the engine baseline now applies R6 (ownership/boundary *assignment* → `deterministic`, scoped to explicit-assignment clauses with a reconciliation guard) and R12 (capability-existence → `deterministic`), plus the third adapter-owned hint family `classification_hints.proof_route_hints` (default+extension).
Build contract: [charness-artifacts/eval-trust/2026-06-21-r6r12-baseline-routing.spec.md](../../charness-artifacts/eval-trust/2026-06-21-r6r12-baseline-routing.spec.md).
Measured effect on the live population: overlap route-accuracy rose 45% → 54% (agreeing count 22 → 26) with zero new over-corrections; the gain is entirely R6, and the `cautilus-eval` over-assignment is only partially closed — the remaining `cautilus-eval → deterministic` disagreements are not ownership/capability shapes the portable defaults safely catch, so they stay for true per-facet decomposition (Fork B).
R12 fired on zero live claims in that slice but was found to be structurally dead, not merely dormant: it keys on `" ships "`, which the `claimLineLooksUseful` lexicon gate did not admit, so no `" ships "` capability claim could ever reach the classifier (debug [charness-artifacts/debug/2026-06-21-r12-ships-lexicon-gate-dead.md](../../charness-artifacts/debug/2026-06-21-r12-ships-lexicon-gate-dead.md)).
The follow-on rune-bound-recall slice (2026-06-21, [charness-artifacts/eval-trust/2026-06-21-rune-bound-recall.spec.md](../../charness-artifacts/eval-trust/2026-06-21-rune-bound-recall.spec.md)) relaxed the rune upper bound to a 2000-rune sanity cap and added `" ships "` to the lexicon, so R12 now fires live on the recovered GEPA-seam capability claim (`claim-readme-md-140`, `deterministic`); that slice also recovered 76 length-dropped routable claims and lifted the overlap agreeing count 26 → 30.

Fork B (per-facet routing absorbed into the classifier, no per-claim schema) began 2026-06-21 with its first slice: the `namedPacketEmissionClaim` discriminator routes a claim whose dominant facet is emitting a named, versioned `cautilus.<name>.vN` packet (or that explicitly does not call an LLM) to `deterministic`, with an eval-judgment over-flip guard so a genuine eval that merely emits a result packet stays `cautilus-eval`.
Build contract: [charness-artifacts/eval-trust/2026-06-21-fork-b-named-packet-routing.spec.md](../../charness-artifacts/eval-trust/2026-06-21-fork-b-named-packet-routing.spec.md); measurement: [charness-artifacts/eval-trust/2026-06-21-fork-b-eval-overassignment-measurement.md](../../charness-artifacts/eval-trust/2026-06-21-fork-b-eval-overassignment-measurement.md).
This first slice resolves the named-packet subset (#5, #6) of the 10 overlap `cautilus-eval → deterministic` disagreements; the other shapes (schema-field-persistence, static-taxonomy, CLI-flag-semantics, status-routing, extraction-behavior, command-absence, the R6-ish boundary) stay deferred to later gold-confirmed discriminators, recorded in the measurement.

Fork B slice 2 (2026-06-21) added the `cliFlagSemanticsClaim` discriminator: a claim whose dominant facet is what a named CLI flag *does* to config, session state, auth, or IO (a long `--flag` token plus a gold-confirmed flag-effect verb `keeps`/`copies`/`extracts`) routes to `deterministic`, with a judgment-verb over-flip guard that deliberately allows the bare noun `judge` (the flag output's *reader*, not a quality judgment) so the gold-confirmed extraction claim still flips.
Build contract: [charness-artifacts/eval-trust/2026-06-21-fork-b-cli-flag-semantics.spec.md](../../charness-artifacts/eval-trust/2026-06-21-fork-b-cli-flag-semantics.spec.md).
The tight verb set (not the guard) is the precision control that keeps a genuine agent-behavior flag claim (`doctor status --json` lets the Cautilus Agent choose a branch) in `cautilus-eval`; broadening the verb set is deferred and gold-gated.
This slice resolves the CLI-flag subset (#3, #7), dropping the overlap `cautilus-eval → deterministic` count 8 → 6 (agreeing 34 → 36) with zero new over-corrections; the remaining shapes (packet-emission prose, static-taxonomy, status-routing, command-absence, schema-field-persistence, the R6-ish boundary) stay deferred.
The remainder of this section records the still-valid 2026-06-10 direction it builds on.

Maintainer decision 2026-06-10 (after the D3 facet gold set and a portability challenge) redefined the wiring direction.
Repo-specific classification knowledge must not accumulate as hardcoded engine rules; it belongs in adapter-owned `claim_discovery.classification_hints`, proposed by the Cautilus Agent from an initial scan and ratified by the maintainer.
The first hint family is live: `non_claim_section_headings` filters rejected-alternatives and non-goal sections deterministically, proven on this repo by the gold set's ratified non-claim (`claim-docs-contracts-active-run-md-186`) disappearing from a live discovery run.
Per-facet `recommendedProof` remains the direction for routing, absorbed into the same hint vocabulary rather than shipped as a per-claim schema change; no per-claim `dominant` field ships (dominance was a gold-set scoring device only).
The gold-set protocol is the ratification harness for future hint proposals; its current instance is `charness-artifacts/eval-trust/2026-06-19-recommendedproof-facet-gold-set-v2head.md`, regenerated against the HEAD ratified answer key and applying the ratified R6/R12 routing discriminators (the original `2026-06-10-recommendedproof-facet-gold-set-proposal.md` is superseded-as-labels: its packet is 108 commits behind HEAD, but its facet vocabulary and verdict scheme carry forward as method).
Until routing hints land, decomposing a discovered claim is a manual application of the steps above.

## Alternatives rejected

Tagging a whole claim `cautilus-eval` and handing the entire claim to a judge is rejected: it is exactly what made the judge inconsistent on the mechanical facet.
Tagging a whole claim `deterministic` and never involving a judge is rejected: it is the determinism skew that left the semantic seat empty.
The honest middle is per-facet routing with an AND composite, which is this template.
