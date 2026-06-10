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

Maintainer decision 2026-06-10 (after the D3 facet gold set and a portability challenge) redefined the wiring direction.
Repo-specific classification knowledge must not accumulate as hardcoded engine rules; it belongs in adapter-owned `claim_discovery.classification_hints`, proposed by the Cautilus Agent from an initial scan and ratified by the maintainer.
The first hint family is live: `non_claim_section_headings` filters rejected-alternatives and non-goal sections deterministically, proven on this repo by the gold set's ratified non-claim (`claim-docs-contracts-active-run-md-186`) disappearing from a live discovery run.
Per-facet `recommendedProof` remains the direction for routing, absorbed into the same hint vocabulary rather than shipped as a per-claim schema change; no per-claim `dominant` field ships (dominance was a gold-set scoring device only).
The gold-set protocol in `charness-artifacts/eval-trust/2026-06-10-recommendedproof-facet-gold-set-proposal.md` is the ratification harness for future hint proposals.
Until routing hints land, decomposing a discovered claim is a manual application of the steps above.

## Alternatives rejected

Tagging a whole claim `cautilus-eval` and handing the entire claim to a judge is rejected: it is exactly what made the judge inconsistent on the mechanical facet.
Tagging a whole claim `deterministic` and never involving a judge is rejected: it is the determinism skew that left the semantic seat empty.
The honest middle is per-facet routing with an AND composite, which is this template.
