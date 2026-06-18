# Residual Misroute — Confirming Cut 2 (Routing-Replication Probe)

Date: 2026-06-18.
Question (handoff item ①): are the two residual proof-route misroute pockets the after-HITL measurement surfaced — `claim-extraction-template.md` 11.3% (9/80) and `README.md` 13.5% (7/52) — **systematic agent error** that justifies a second R16-gated lean template refinement, or **small-sample noise** that should not move the template?

This is the "one more confirming cut" the `HITL-CLOSEOUT.md` and `MEASUREMENT.proof-route.md` deferred.
It does **not** re-extract whole sources (that confounds routing with recall/composition, as the `working-patterns.md` caveat showed); instead it isolates the routing decision the template edit would target.

## Method — blind routing-replication probe with controls

A separate probe instrument (like the recall probe — not the gold set), built from the ratified `goldset-v2-reextract-head` answer key:

- **Residual items (16):** every relabel in the two residual sources (9 `claim-extraction-template.md` + 7 `README.md`), each with its summary and verbatim excerpt.
- **Control items (17):** accept-verdict claims from the same two sources whose blind route already matched the maintainer key, sampled across routes (deterministic 13, cautilus-eval 3, human-auditable 1).
- The 33 items were anonymized to `P01..P33`, deterministically shuffled, and stripped of every verdict/route hint.
- **Three independent routers** (separate blind sub-agents) each received only the **operative** template routing guidance (`templateHash sha256:b922fd5d…`, the now-effective folded generalization) and the claim text, with repository access forbidden so they could not reach the answer key.
- Each router returned `recommendedProof` per item; scored against the ratified correct route.

Evidence: `cut2/probe.json`, `cut2/answer-key.json`, `cut2/router-{A,B,C}.json`, `cut2/scoring.json`.

### Pre-registered decision rule

- **Systematic** if control accuracy is high **and** residual accuracy is markedly lower (class-specific error) **and** the residual misroutes are directionally consistent with a single nameable failure mode.
- **Noise / contested boundary** if residual accuracy is comparable to control accuracy (the cut-1 misroute did not reproduce), **or** the wrong routes are scattered with no single fixable direction.

## Results

| set | router A | router B | router C | majority |
| --- | --- | --- | --- | --- |
| control (n=17) | 82% | 94% | 94% | **94%** |
| residual (n=16) | 19% | 19% | 13% | **19%** |

The 94% vs 19% gap shows the residual is a **real hard region, not small-sample noise** — but the magnitude is inflated and must be read with a disclosed caveat.

**Control-selection caveat (do not over-read the 94%).** Controls were chosen *because* their blind route already matched the key, which near-tautologically guarantees high control accuracy; the mix is also deterministic-easy heavy (13/17), whereas the residuals are deterministic-*contested* heavy (14/16).
So 94% is **not** a class-matched competence baseline and cannot, on its own, license "the routers are competent, therefore the 19% is agent error" — that inference is partly circular.
What survives the caveat is weaker but still real: the residual is a genuinely hard, distinct region, not noise, and the agents do not converge on the ratified route there.

### But the error is not a single fixable direction

| source | residual claims × 3 routers | reproduced cut-1 misroute | routed to the ratified correct route |
| --- | --- | --- | --- |
| claim-extraction-template.md | 27 cells | 4/27 (15%) | 8/27 (30%) |
| README.md | 21 cells | 14/21 (67%) | **0/21 (0%)** |

- **claim-extraction-template:** cut-1's blind extractor misrouted these meta-content claims to `cautilus-eval`; the three routers instead overwhelmingly route them to `human-auditable` (≈67%), with only 30% reaching the deterministic key. Different agents land on **different** wrong routes. Routers P05/P23/P24/P31 are 3/3 `human-auditable` with reasons like "routing-rule description read from template doc text."
- **README:** **zero** of 21 router-cells reproduce the maintainer's `deterministic` key. The scope/boundary claims ("not a global verdict", "proof planning, not a verdict") draw `human-auditable` (reproducing the blind misroute); the off-class claims draw `deterministic` or `cautilus-eval`. Every route is contested; the key is never independently reproduced under the current operative template.

## Interpretation

Two framings are simultaneously true, and the honest reading leads with the second.

**Framing 1 (locked-rule view): agent default error.** Under the locked rules the key is correct — R3 ("deterministic = checkable in principle, a test need not exist") plus R6/R12 make "the template documents routing rule X" and "the summary is not a global verdict" deterministic, because a test could assert the documented string or the output-contract scope even though a human could also read it. By that rule the agents systematically default to `human-auditable` (or `cautilus-eval`), the error R12 names.

**Framing 2 (leading hypothesis): the gold key is contested at the R3 boundary.** Cut-1's blind extractor diverged from the key toward `cautilus-eval`; three fresh independent routers diverge toward `human-auditable`; the natural reading diverges too — and crucially **none of them reproduce the key**, in **different** directions. When the blind extractor, three competent routers, and the plain reading all miss the same ratified route by different exits, the more parsimonious explanation is that R3's "checkable-in-principle" is being **stretched** to swallow claims that are genuinely human-auditable (P12 "not a global verdict", P19 "proof planning, not a verdict", P08 badge proven/declared/promised), not that every independent grader shares one fixable blind spot. The README **0/21** is the canonical signature of a contestable key, not of a missing corollary.

Therefore the residual is **class-specific and not noise**, but "systematic agent error fixable by a template edit" is **not** the safe conclusion: the residual lives exactly on the `deterministic`/`human-auditable` boundary that R3 itself draws, and a second template edit would risk **codifying a reading no independent grader reproduces** — bleeding precision on truly human-auditable claims for marginal gain. The current operative generalization (`b922fd5d`) already does not move the class, which is consistent with a contested boundary rather than a teachable gap.

For reference, the two residual sub-classes the maintainer's key reads as deterministic (and independent graders read as human-auditable) are:

1. **Documented-content description** — a claim that merely states what a documented rule, template, schema, or contract says or contains ("v2 routes X to deterministic", "the template adds prompts for Y", "this doc is the canonical contract"). It is a static fact about the artifact (a test can assert the artifact contains it) → deterministic, even though reading the doc would also confirm it, and even when the rule's *subject* is agent behavior.
2. **Output scope / negation** — a claim about what a command's output *is* or *is not* ("is evidence, not a global verdict"; "proof planning, not a verdict"). It is a structural fact about the output contract → deterministic, not human-auditable.

## R16-gate decision (OPEN — maintainer's call)

R16 is maintainer-locked: answer-key lessons reach the template only as a lean generalization, only when measurement proves systematic agent error, never as per-bullet enumeration.
The cut proves the residual is class-specific and not noise, but it does **not** cleanly prove "systematic agent error" — because no independent grader reproduces the key, the contested-key hypothesis is live, and a template edit is therefore **not** an automatic consequence.
Recommended order is **C → then A or B**, not three parallel options.

- **(C) Re-adjudicate the residual key under explicit R3 first — prerequisite.** Re-grade the 16 residuals asking specifically whether R3's "checkable-in-principle" is being over-applied to claims that are most naturally human-auditable. The `0/21` README and the multi-direction divergence make this the leading move: editing a template to force a route **no** independent grader chooses would codify an idiosyncratic reading. If some residuals are genuinely human-auditable, the relabels shrink, the systematic-error case dissolves, and no edit is warranted.
- **(A) Only if C confirms the key: lean second refinement, then a 3rd confirming cut.** If re-adjudication holds the deterministic key on a real sub-class, add the two class-level sentences above to the operative `routingGuidance` (parity guard + doc sync), re-extract the two sources, and re-measure. Risk the 3rd cut must clear: precision loss on genuinely human-auditable claims; the `0/21` signal means the edit may not even move the class.
- **(B) Hold the edit.** Treat the residual as an irreducible contested boundary: real but small (16 claims), concentrated, and not reliably fixable by template wording. Keep the ratified key as-is and do not generalize. This is the right terminal state if C finds the boundary genuinely fuzzy rather than a clean deterministic sub-class.

## Status

Confirming cut complete. The systematic-vs-noise question is answered (**class-specific, not noise**); the "is it fixable agent error or a contestable key?" question is **escalated to the R16 gate**, with re-adjudication of the residual key (Option C) as the recommended precondition to any template edit.
This artifact records the measurement; the operative template is unchanged pending that decision.
The ratified answer key (`goldset-v2-reextract-head`, 374/374) stands as the current ground truth — Option C would revisit only the 16 residual relabels under explicit R3, not reopen the full ratification.

**RESOLVED (2026-06-18, `residual-key-readjudication-cutC.md`).** The maintainer chose Option C. Re-adjudication found R3 over-applied unevenly: the README residual was mostly a gold-key over-relabel (5/7 dissolved; corrected 13.5% → 3.8%), while the claim-extraction-template documented-content class survived as a real under-route (8.75%). Key amended (accept 344 / relabel 19). The scoped Option A template edit was validated by a 3rd cut and **held** (recall gain but a precision regression on README narrative); the operative template stays `b922fd5d`.

## Counterweight review

A bounded fresh-eye reviewer (read-only) reviewed this cut's design and conclusion before escalation.
Status: **incorporated** — three material findings folded in: (1) the control set was selected for prior agreement, so the 94% baseline is inflated and not class-matched (disclosed above); (2) the lead conclusion was overstated toward "systematic agent error" when the multi-direction divergence and README `0/21` make the contestable-key hypothesis at least as strong (now Framing 2, the leading read); (3) Option C was promoted from a parallel option to the recommended precondition for any edit.
Arithmetic (control 13/3/1 mix, residual `0/21` README, `8/27` template) was independently re-verified against the raw JSON and confirmed.
