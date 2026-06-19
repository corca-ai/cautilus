# Behavior Evaluation badge flipped to proven (dev coding-agent surfaces)

Status: result (maintainer decision recorded and wired into the spec projection), 2026-06-19.

This closes the open maintainer decision named in `2026-06-19-judge-natural-unsound-population-frontier.md` and `docs/contracts/eval-judge-collaboration.md`.
It does not run any new eval; it is the spec-projection wiring of a decision the prior evidence had already teed up.

## The decision

The single thing holding the apex `Behavior Evaluation` badge at `declared` was that the dev-surface judges' reject-capability rested on constructed controls rather than a population of natural unsound cases.
The natural-unsound frontier slice had already established — across ~44 real harvested responses over two model tiers, easy and hard traps, in three claim families (routing, factual-soundness, source-grounded faithfulness) — that zero natural semantic unsound occurs on these single-turn surfaces, and that this is a property of current capable models, not a weakness of the judge.

The maintainer resolved the decision in favor of accepting the constructed-control standard:
constructed-control reject-capability (load-bearing and pinned) plus the natural-sound behavior harvest is sufficient to move the badge past `declared`.
The natural-population bar is kept as a known, possibly-permanent limitation rather than an open debt.

## Why this is honest, not a shortcut

The reject-capability is backed by checked-in executable invariants, not prose:

- `an always-sound judge FAILS every decomposed claim` (`scripts/agent-runtime/reasoning-soundness-judge.test.mjs`) fails the gate if a judge stops discriminating, so a rubber-stamp judge cannot pass.
- The same composite catches a deliberately-worse routing variant across three distinct pinned behaviors, each owning its own deterministic process facet (`the three regression claims must pin three DISTINCT process facets`).
- Both dev surfaces are proven live on demand (`npm run proof:behavior-eval:live`, `npm run proof:skill-orientation:live`), and their operator-witnessed captures plus blind verdicts are replayed deterministically and projected by `npm run lint:specs`.

A constructed control is the correct instrument for a regression guard: you cannot wait for a natural regression to prove you would catch one.
The no-manufacturing discipline was held throughout the harvest — no unsound response was authored to fill the natural-population gap.

## Scope of the flip (stated honestly)

The badge moves to `proven` scoped to the dev coding-agent surfaces (`dev/repo` routing and `dev/skill` orientation), with the judge proven load-bearing as a regression guard.

This flip does NOT:

- make `app/chat` live — its agent run is still replayed from the production log, so `app/chat` liveness stays in Proof Debt (the replay does already carry one natural unsound capture).
- close `app/prompt` product-runner proof — that self-dogfood surface has no real prompt product whose production path the runner reuses, so `productProofReady=true` cannot be made honestly without manufacturing; it stays in Proof Debt, structurally a sibling of `app/chat` liveness.

The app-ship surfaces remain the `Behavior Evaluation — app surfaces` Proof Debt row in the apex.

## What changed

- `docs/contracts/eval-judge-collaboration.md`: resolved the open maintainer decision with a dated `Decision (maintainer, 2026-06-19)` section.
- `docs/specs/index.spec.md`: badge heading `declared, with proven dev surfaces` -> `proven on the dev coding-agent surfaces; app-ship surfaces in Proof Debt`; the `Limitation` line rewritten as a `Reject-capability` line that states the accepted standard and its executable backing; the app-ship Proof Debt row unchanged.
- `docs/specs/user/evaluation.spec.md`: intro reflects the load-bearing regression-guard framing and the accepted proven standard; the `check:` projections are unchanged.

## Executable backing (unchanged by this slice, cited by it)

- `scripts/agent-runtime/reasoning-soundness-judge.test.mjs` (always-sound-judge-fails; three distinct process facets).
- `npm run proof:behavior-eval:live`, `npm run proof:skill-orientation:live` (on-demand live dev proofs).
- `npm run test:on-demand` (deterministic replay of the dev live captures, app/chat replay, and app/prompt probe verdicts).
- `npm run lint:specs` (projects the dev live captures and blind verdicts in `docs/specs/user/evaluation.spec.md`).

## Critique

Bounded fresh-eye honesty review 2026-06-19 returned **READY-WITH-EDITS, no blocker**.
It verified the dev-scope qualifier is in the badge heading itself (not buried), the `three promises are proven live` count is still correct (Readiness, Claim Discovery, Behavior Evaluation), the gate rests on checked-in executable proof (the `always-sound judge FAILS` invariant, the three-distinct-facets breadth test, and the two on-demand live proofs), the contract has no stale `pending`/`declared` text contradicting the flip, the regression-guard reframe is a fair characterization, and the app-ship Proof Debt rows (app/chat liveness, app/prompt product proof) and the natural-population limitation are all explicitly preserved.
The single folded edit: the cited `~44 real harvested responses` read like replayable quantitative evidence, but the raw responses live in session transcripts rather than a checked-in fixture, so both spec sentences now mark the harvest as positive context (raw in transcripts, prompts/truths pre-registered) and name the checked-in gate as the load-bearing part, not the harvest count.

## Source

- Decision input: `charness-artifacts/eval-trust/2026-06-19-judge-natural-unsound-population-frontier.md`.
- Contract: `docs/contracts/eval-judge-collaboration.md`.
- Badge SOT: `docs/specs/index.spec.md`, `docs/specs/user/evaluation.spec.md`.
