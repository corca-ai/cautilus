# Root Finding: Claim Canonicalization Precision (Leaf → Promise Mapping)

Status: parked product finding. Candidate #1 Cautilus-improve dogfood target. Not being chased now.
Date: 2026-06-08.
Context: surfaced while dogfooding Cautilus on Cautilus to build a single human-legible proof document.

## Symptom

The maintainer experienced the discover output as overwhelming and untrustworthy, and spent weeks hand-reviewing individual claims to convince themselves the classification was right.
Going upstream repeatedly surfaced one root cause behind four separate frustrations:

- "discover output is too large to face"
- "I can't trust the proof-route classification, so I'm hand-checking ~500"
- "361 claims is implausibly many for a repo this size"
- "even per-promise (U#) sub-claim counts feel too large"

## Mechanism (three compounding layers)

1. Scope: `linked_markdown_depth: 3` pulls the entire `docs/contracts/**` tree into discovery.
   186 of 361 raw claims (52%) come from internal engineering contracts that describe how the binary and agent are built, not user-facing promises (259 developer vs 102 user).
2. High-recall extraction: every declarative sentence becomes a claim, by design.
   This is intended and should not be "fixed" by lowering recall.
3. Canonicalization (leaf → promise) is low-confidence and over-inclusive — this is the real defect.
   `byMappingConfidence` is high 65, medium 277, low 19 out of 361, and unrelated sentences are swept into the wrong promise.

## Evidence

User promise U2 "Claim Discovery" carries 53 user leaves, but many are not about claim discovery:

- `README.md:3` "Cautilus keeps agent and workflow behavior honest while prompts keep changing." — general tagline.
- `docs/guides/evaluation-process.md:92` "turns the fixture run into durable eval packets" — Behavior Evaluation (U3).
- `docs/guides/evaluation-process.md:117` "Evaluation uses two top-level surfaces: dev ..." — Behavior Evaluation (U3).
- `docs/guides/evaluation-process.md:130` "context-recovery as a protected scenario kept out of tuning" — Bounded Improvement (U4).

Of the first eight U2 leaves, roughly one is genuinely about discovery.
So per-promise counts are inflated by misrouting, not just by granularity.
The number is not merely large; it is wrong.

## Where To Fix (ranked by leverage)

1. Canonicalization / leaf-to-promise clustering precision — the real lever.
2. Scope separation: discover "user-facing promises" (README, docs/specs/user, docs/guides) distinctly from "internal contract coverage" (docs/contracts), instead of one mixed pile.
3. NOT README (15 of 361, about 4%).
4. NOT lowering extraction recall (wrong knob — recall is intended).

## The Improve Target (precise)

Earlier this was framed loosely as "routing quality"; the precise target is leaf-to-promise assignment precision.
It is measurable with a small hand-labeled gold set: sample N leaves, hand-assign the correct promise, and measure agreement plus a confusion matrix against the automatic mapping.
This converts the maintainer's unbounded hand-review of the whole population into a bounded measurement on a small held-out sample.
It is the natural first real Cautilus-improve dogfood case once chosen.

## Decision For Now

Do not chase this yet.
It is sidestepped for the flagship document by hand-picking genuinely on-topic exemplar claims per promise rather than trusting the automatic per-promise grouping.
Flagship document: [docs/proven-promises.md](../../docs/proven-promises.md).
