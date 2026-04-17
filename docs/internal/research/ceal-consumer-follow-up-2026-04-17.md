# Ceal Consumer Follow-Up - 2026-04-17

This note records the first real external-consumer `Cautilus` run against `Ceal` after the consumer-side experiment brief was issued.
The goal of this pass was to verify both consumer readiness and evaluation honesty.

It started as a readiness check:
could a real consumer checkout reach the product-owned evaluation surfaces without hidden maintainer setup?
After those seams were repaired in the consumer, the same pass became a real quality judgment:
does the repaired candidate actually look better than its baseline on the stated intent?

## What Ran

Consumer-side execution reached these product surfaces:

- `cautilus doctor --repo-root <consumer>`
- `cautilus mode evaluate --mode held_out`
- `cautilus review prepare-input`
- `cautilus review build-prompt-input`
- `cautilus review variants`

We intentionally did **not** run `optimize` or GEPA-style search in this pass.
Those seams are for bounded improvement work once the evaluation target is a real prompt or behavior candidate.
This pass was about consumer-readiness plumbing first, then honest evaluation of that repaired consumer slice.

## Results

### 1. Doctor readiness was real

The consumer adapter resolved cleanly and `doctor` returned `ready`.
This is the minimum external proof bar and it held.

### 2. The first held-out run surfaced real consumer-readiness gaps

The first `held_out` attempt failed because the consumer benchmark runner defaulted its temp-instance config source to a maintainer-local home path (`~/.ceal/ceal-dev/config.toml`) instead of a repo-local config when one already existed.

After the consumer fixed that default, the next attempt surfaced a separate runner bug:
`writeBaselineCache` was missing from the compare runner import path.

Those are meaningful product observations even though they were consumer-side fixes:

- the product surface was honest enough to reveal real consumer blockers
- the blockers were concrete and localizable
- the same entry point could be rerun immediately after repair

### 3. The aligned held-out rerun rejected the consumer candidate

After the consumer fixes landed, `held_out` was rerun against an immutable baseline commit (`bc79368`) with the repaired consumer at `802ea9b`.
That rerun did not produce a setup failure.
It produced a real comparison result and the recommendation was `reject`.

The strongest scenario-level evidence was:

- no scenario improvements
- one non-low-confidence regression in `prompt-ab-control-stale-pr-refresh`
- one probe (`prompt-ab-review-then-patch-plan-only`) leaning regressed
- no improvement on the seeded workbench scenario `onboarded-birthday-source-discovery`

This is the most important outcome of the pass.
`Cautilus` was not just able to run a real external consumer.
It was able to say "no" once the consumer was runnable.

### 4. Review variants agreed with the rejection, but schema ownership is still awkward

`review variants` ran successfully against the same consumer evidence.
Both review variants returned `blocker`.

However, the consumer adapter still needed an explicit schema override:

- `--schema-file fixtures/workbench/review-verdict.schema.json`

This is usable, but it is not yet frictionless.
The review seam still depends on either adapter-owned schema declaration or a manual operator override.

### 5. Report-packet framing still obscures compare results when the underlying compare command rejects

The report packet recorded the run as:
`held_out failed before completing all command templates`.
That is mechanically true because the compare runner exits non-zero on regression.

But the human-meaningful evidence is not "the evaluation surface broke."
The evidence is "the evaluation surface completed and found regressions."
The scenario-level compare output exists in `held_out-1.stdout`, while `report.json` compresses that into an execution failure shape.

This is a product seam worth tightening.

## Product Implications

The honest product claim is now stronger than it was before this pass.

- one real external consumer reached `doctor ready`
- one deep path (`mode evaluate --mode held_out`) ran far enough to expose both setup seams and then real quality regressions
- one additional deep path (`review variants`) also ran successfully against that external consumer evidence

At the same time, the product should **not** over-claim.

- this is not evidence that the consumer candidate improved
- this is not prompt-quality win evidence
- this is not GEPA-readiness evidence
- this is not proof that every external workflow consumer is frictionless

The strongest claim here is not "the consumer got better."
The strongest claim is:
`Cautilus` reached a real external consumer, surfaced repairable setup blockers, and then produced an honest rejection when the repaired candidate still was not better than baseline.

## Expansion Ideas

These are the strongest product-facing follow-ups surfaced by the run.

### A. `review variants` should not require a second schema declaration when the review packet already exists

Current friction:

- `review prepare-input` and `review build-prompt-input` produce product-owned review artifacts
- `review variants` still requires either adapter `default_schema_file` or explicit `--schema-file`

Product follow-up options:

- let `review-prompt-input` carry or materialize the default structured-output schema directly
- or tighten the adapter contract so executor-variant-enabled consumers must declare `default_schema_file`

### B. `mode evaluate` should distinguish "comparison rejected" from "execution failed"

The current report packet shape makes a regression-bearing compare run look too much like an infrastructure failure.

Useful follow-up:

- record the compare decision more explicitly in the report packet even when the underlying command exits non-zero
- expose scenario-level compare summaries directly instead of requiring operators or review variants to dig through stdout artifacts

### C. Evaluation guidance should distinguish "consumer-readiness plumbing" from "prompt improvement"

The consumer run first proved evaluation plumbing, then produced a rejection.
Product guidance should keep operators from sliding straight from "an external consumer run completed" into "therefore run optimize/GEPA."

Useful follow-up:

- add a lightweight readiness note to evaluation guidance stating that optimize and GEPA should start only after the target under test is a real bounded behavior candidate, not setup repair

### D. The consumer-readiness appendix can now record one real external workflow-consumer proof

The maintainer-facing readiness note can now honestly say that at least one real external workflow-style consumer has reached `doctor`, `held_out`, and `review variants`.
It should still keep that proof archetype-first rather than turning `Ceal` into product vocabulary.

## Non-Promotions

Nothing from this run should be promoted into product-owned prompt or scenario surfaces.

Why:

- the strongest result here is consumer-readiness plus honest rejection
- the aligned `held_out` recommendation was `reject`
- both review variants agreed that the candidate was not better than baseline for the tested intent

## Recommended Next Product Move

1. Keep the external-consumer readiness appendix updated at the archetype level.
2. Tighten one product seam:
   either review-schema ownership or compare-result reporting.
3. Run the next real external-consumer evaluation with an immutable baseline ref from the start.
4. Only after that, use optimize or GEPA on an actual prompt or behavior candidate rather than on readiness plumbing.
