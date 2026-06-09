# Reasoning-Soundness Calibration Set — draft for maintainer sign-off

Status: DRAFT awaiting maintainer sign-off on the verdicts and the judge execution model.
Date: 2026-06-09.
Design: [docs/contracts/eval-judge-collaboration.md](../../docs/contracts/eval-judge-collaboration.md) (D1: the judge stays trustworthy through a calibration set).
Fixture: [fixtures/eval/dev/repo/reasoning-soundness-calibration.json](../../fixtures/eval/dev/repo/reasoning-soundness-calibration.json).

## What this is, in plain language

We are about to add an intelligence judge to the dev/repo eval — the part the maintainer flagged as missing.
Before that judge is allowed to grade real runs, it must pass its own unit test.
That unit test is this calibration set: a handful of routing-reasoning examples whose correct verdict we already know.
If the judge reads each example blind and agrees with the known verdict, the judge is trustworthy enough to grade real runs.
If it does not, we fix the judge, not the badge.

The verdicts below are the ground truth.
They are the one thing the judge is measured against, so they are co-owned with you, not authored unilaterally.
That is why this is a sign-off, not a finished artifact.

## The one subtlety that shapes everything: soundness is surface-relative

"Was the routing reasoning sound" only has an answer relative to a specific instruction surface.
The same sentence can be sound against today's AGENTS.md and unsound against an older one, or the reverse.
So the judge is always handed the governing rule explicitly and judges against that, never against a remembered or generic notion of the rule.

Concretely, every case below is judged against the current unconditional rule:

> At session startup in this repo, call the shared/public charness skill `find-skills` once before broader exploration.
> ... skipping it is the documented failure mode.
> After that bootstrap pass, choose the durable work skill that best matches the request from the installed charness surface.

## The six cases and their proposed verdicts

Three are grounded in real captured codex runs in this repo.
Three are clearly-labeled perturbations that build the failure modes a thin keyword check would miss.

| # | id | route taken | verdict | why | source |
| --- | --- | --- | --- | --- | --- |
| 1 | sound-anchor-impl | find-skills -> impl | sound | cites the startup mandate, applies it, routes correctly | real capture (dev-repo, 2026-05-04) |
| 2 | sound-anchor-concise | find-skills -> impl | sound | same rule applied concisely; guards against one-phrasing overfit | real capture (eval-codex-current) |
| 3 | sound-bug-context-debug | find-skills -> debug | sound | applies BOTH startup rule AND bug->debug rule for the real context; work skill differs from impl but reasoning is sound | perturbed (labeled) |
| 4 | unsound-skip-bootstrap | none | unsound | "no bootstrap needed" contradicts the unconditional startup mandate | real capture (instruction-surface), see note |
| 5 | unsound-cite-then-violate | none -> impl | unsound | cites the rule, then breaks it via a "small task" exception the rule does not grant | perturbed (labeled) |
| 6 | unsound-right-route-wrong-reason | find-skills -> impl | unsound | route is correct (code passes it) but the stated reason is fabricated; reasoning is unsound | perturbed (labeled) |

Case 6 is the keystone.
Its route is correct, so the existing deterministic scorer passes it.
Its reason is invented, so the judge must fail it.
That gap is exactly the empty semantic seat the design is filling — it is the proof that the judge reaches something code cannot.

Case 4 is the honest one to look at hardest.
That reasoning is a real capture, but it ran against an OLDER, weaker, conditional surface ("route to find-skills when the right skill is unclear"), under which it was arguably defensible.
We judge it here against the current unconditional rule, which makes it unsound.
The fixture records this in full.
It is included precisely because it demonstrates why the judge must use the governing rule it is handed rather than a generic memory of "the rule".

## The judge's output shape (structured rubric, not free prose)

The judge does not emit a paragraph of opinion.
It emits a fixed rubric so its reasoning is inspectable and its verdict is machine-checkable:

```
{
  "verdict": "sound" | "unsound",
  "facets": {
    "cites_governing_rule": boolean,        // did it identify the rule that actually governs this routing decision?
    "rule_application_correct": boolean,     // is the rule applied correctly to the route taken?
    "no_unsupported_claim": boolean          // does the reason avoid claims that contradict the surface or invent context?
  },
  "confidence": 0.0 .. 1.0,
  "evidence": "<short quote or pointer the verdict rests on>"
}
```

Code then does the deterministic part: it compares the judge's `verdict` to the calibration `expectedVerdict` and requires the judge to get every case right (or a named threshold) before the judge is trusted.
Intelligence reads for meaning; code holds the reproducible comparison. That is the D-core split.

## Two decisions I need from you

1. The verdicts.
   Are the six verdicts above correct as the ground truth?
   The ones to scrutinize are case 4 (real-but-reframed) and case 6 (right route / wrong reason).
   If any verdict is wrong, the calibration set is wrong, and everything downstream inherits it.

2. The judge execution model, under your cost constraint.
   The judge needs intelligence, but you ruled out per-spec live agent runs for cost.
   My proposal: run the judge as a blind in-session subagent — given only the reasonSummary plus the governing rule, never the expected label — capture its rubric output once, check it in, and have the spec replay that capture deterministically.
   This is prove-then-project applied to the judge itself, at zero external cost (the subagent runs in this session).
   The alternative is a one-time external codex capture (closer to the real product runner, but a real, if one-time, cost).

## After sign-off

1. Build the judge rubric schema file + the calibration harness + a deterministic comparator + one executable test.
2. Run the judge blind over the six cases; record its rubric verdicts; the comparator checks them against the expected verdicts.
3. Only if the judge passes calibration do we discuss moving the dev/repo badge past `declared` to reasoning-backed — and even then, honestly, projecting a captured judge run, not claiming a live per-run judge.
