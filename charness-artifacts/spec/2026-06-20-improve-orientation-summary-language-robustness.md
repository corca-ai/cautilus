# improve held-out orientation summary: language-robustness (right-sized fix)

Status: spec (canonical during implementation), 2026-06-20.
Sibling of the landed `charness-artifacts/spec/2026-06-20-skill-orientation-grader-language-robustness.md`: the same English-literal `requiredSummaryFragments` brittleness, on the `dev/skill` **improve held-out** surface this time.
Decision route: the maintainer chose the reasoning-judge direction over a bilingual matcher, then — after the live-loop trace below resized the slice — chose the right-sized fix now (`①b`) with the replay-parity judge convergence (`①a`) explicitly deferred.

## Problem

The bounded-improvement held-out fixture `fixtures/eval/dev/skill/improve/skill-orientation-improve.fixture.json` grades the Cautilus Agent's no-input orientation summary with `requiredSummaryFragments: ["adapter", "claim", "branch"]`.
Those are English-literal string matchers over a summary this repo's CLAUDE.md requires to be Korean, so the matcher is language-brittle — the same class of bug the skill surface fix just removed.

Three facts from tracing the live improve loop and the 2026-06-20 spoon-feeding debug note (`charness-artifacts/debug/2026-06-20-improve-live-case-prompt-spoonfeeds-orientation.md`) set the slice size.

First, the seed-FAIL is already carried redundantly by the language-independent command guards.
The checked-in seed capture `fixtures/eval/dev/skill/improve/live/improve-live-seed-eval-summary.json` fails with `summary missing required fragment: branch; command log included forbidden fragment: doctor --repo-root . --next-action; command log included forbidden fragment: --next-action`.
The degraded seed trips the forbidden command `--next-action` independently of the English summary fragment, so removing `requiredSummaryFragments` preserves seed-FAIL.

Second, the real brittleness is on the candidate-RECOVER side.
A behaviorally correct recovered candidate that summarizes in Korean ("어댑터 / 클레임 / 다음 분기") fails the `"branch"` fragment, is not counted as recovered, and can break `proof:improve:live` (no candidate reaches the held-out pass score).
The brittleness is latent today only because the last winning candidate happened to keep the terms as English loanwords.

Third — decisive — the reasoning judge cannot run in the live improve loop.
The judge is prove-then-project: the adapter-owned enricher (`scripts/agent-runtime/enrich-eval-with-reasoning-judge.mjs`) replays a checked-in verdict matched by `evaluationId` and fails closed when nothing matches.
The live improve loop grades fresh mutated candidates that have no pre-captured verdict, so a judge-eval adapter would error on every novel candidate.
Therefore the live improve loop's candidate scoring stays command-guard-only with or without a judge — the exact posture the proven skill-surface live proof already has.

The lint guard that protects the skill surface (`scripts/check-orientation-summary-language-robust.mjs`) cannot see this case: it keys on the prompt signature `["first-touch orientation", "stop at branch selection"]`, and the held-out improve prompt deliberately omits the orientation recipe (and structurally must, or it stops being held-out).

## Current Slice (①b)

Make the improve held-out gate language-robust by removing the brittle summary matcher and proving the loop still holds, without adding a replay-only judge layer that the live loop cannot use.

1. Remove `requiredSummaryFragments` from the improve fixture; keep `requiredCommandFragments` + `forbiddenCommandFragments` as the language-independent packet/escalation guards.
2. Extend the lint guard so the held-out improve orientation case also cannot regress to a brittle summary matcher, via a held-out signal distinct from the explicit orientation signature the held-out prompt omits.
3. Re-prove `proof:improve:live` live under the fragment-free fixture and check in the refreshed operator-witnessed capture, so the shipped evidence reflects the post-fix gate.
4. Record the replay-parity judge convergence (`①a`) as an explicit deferred follow-up, not a silent gap.

## Fixed Decisions

- FD1 — Remove `requiredSummaryFragments` entirely from `skill-orientation-improve.fixture.json`; retain `requiredCommandFragments: ["doctor status"]` and the full `forbiddenCommandFragments` list.
  Evidence: the checked-in seed capture fails on the forbidden command `--next-action`, which is independent of the summary fragment, so seed-FAIL survives the removal; candidate-RECOVER loses only the English-summary coupling that is the actual brittleness.
  Precision for the implementer: after the removal it is the `forbiddenCommandFragments` (`--next-action`, `doctor --repo-root . --next-action`) that carry seed-FAIL — not the `requiredCommandFragments: ["doctor status"]` positive guard — so do not weaken or drop a forbidden-command entry and expect the required-command guard to catch the seed.
  This continues the maintainer's own matcher-brittleness cleanup from the 2026-06-20 debug note (issue #5 relaxed the required fragment to `branch`; issue #6 dropped forbidden summary fragments) — removing the last language-brittle summary matcher is the next step on that trajectory.
  Rejected: a bilingual required-summary matcher (an enumerate-languages stopgap that doubles down on the brittle-matcher pattern the repo is leaving; rejected at the direction-decision gate).

- FD2 — Extend `scripts/check-orientation-summary-language-robust.mjs` to also flag a re-introduced `requiredSummaryFragments` on the held-out improve orientation case, using a held-out signature distinct from `ORIENTATION_PROMPT_SIGNATURE`.
  The held-out prompt structurally cannot carry `["first-touch orientation", "stop at branch selection"]`, so the guard needs a second detector that matches the held-out no-input phrasing ("do whatever your skill says to do first when it is invoked without a task" is the stable distinctive phrase) without false-positiving on unrelated cases.
  Keep both detectors pure and unit-covered; the guard must survive a case rename and must not depend on a hardcoded `caseId`.
  The exact predicate shape is an implementation choice as long as it satisfies the acceptance checks.

- FD3 — Confirm the loop by a paid live re-run of `proof:improve:live` after the fragment removal, then check in the refreshed capture; do not rely on the existing capture's deterministic replay alone.
  The deterministic replay (`scripts/on-demand/improve-live-proof.test.mjs`) asserts on the baked-in scores of the checked-in `improve-live-search-result.json`, so it would stay green on the stale capture and would not exercise the post-fix gate.
  Removing a required matcher is a monotonic loosening — it provably cannot flip the existing captured outcomes (the seed still trips the forbidden command; the prior winning candidate still passes with one fewer requirement) — so the fix is low-risk, but the live re-run is the honest confirmation that the loop completes end-to-end under the new fixture and refreshes the shipped evidence.
  Delegate the live run to a Sonnet subagent per the handoff cost/runtime rule (the prior capture cost ~$0.52 on claude-opus); fall back to foreground if background retrieval glitches.

- FD4 — No new judge calibration, verdicts, or judge-eval adapter in this slice.
  The judge cannot grade live novel candidates (FD-rationale above), and the no-input orientation reasoning is already judge-proven on the skill surface, so a per-surface improve calibration would be a replay-only near-duplicate.
  The replay-parity convergence is deferred (Deferred Decisions), recorded as tracked follow-up.

## Probe Questions

- PQ1 — Does `proof:improve:live` still PASS under the fragment-free fixture?
  Expected: the seed fails via the forbidden command `--next-action` (capture-proven), and a mutated candidate recovers via read-only `doctor status` with no escalation, now countable regardless of summary language.
  Resolved by the live re-run (FD3).
  If the seed unexpectedly PASSES — i.e. the command guards alone do not discriminate — block to `charness:debug`; do not hand-fix the fixture to force a differential.

- PQ2 — Does the extended lint guard catch the held-out improve case without false-positiving?
  Expected: with `requiredSummaryFragments` present the held-out improve case is flagged; with it removed the real fixture is clean; the explicit skill orientation case and unrelated fixtures are unaffected.
  Resolved by the guard's whole-tree CLI run plus the unit tests (AC3).

## Deferred Decisions

- `①a` replay-parity judge convergence on the improve surface: a co-located calibration `reasoning-soundness-calibration.dev-skill-improve-orientation.json` (distinct `claimId` `dev-skill-improve-orientation`, reusing the `held_no_input_orientation` code facet and the existing orientation judge brief/facets/rules), a fresh genuine improve capture as the sound baseline, one surface-clean-wrong-reason control, blind verdicts, a `self-dogfood-improve-judge-eval` adapter chaining the improve runner then the enricher, the registry-test scan extended to `fixtures/eval/dev/skill/improve`, and an on-demand dogfood test.
  Deferred because the judge is replay-only and cannot run in the live improve loop, so it adds replay-only semantic parity for a behavior already judge-proven on the skill surface.
  Pick it up if strict per-surface replay parity is wanted; the engine compositing it would need already landed in `internal/runtime/skill_evaluation.go`.
- Carried from the prior handoff and unchanged by this slice: audit residual (assertion-value / intent-judge tightening) and CI Go-version pin freshness.

## Non-Goals

- Putting the judge into the live improve loop (structurally impossible: replay-only, fails closed on novel candidates).
- Re-running or changing the landed skill-surface judge convergence.
- Flipping any apex badge; Bounded Improvement is already `proven` and this slice keeps it proven and language-robust.
- A live per-candidate semantic summary check; no robust non-judge summary matcher exists (substring matching is brittle to language, paraphrase, and negated mentions, established in the debug note).

## Deliberately Not Doing

- Keeping or translating the summary matcher into a bilingual list — rejected at the direction gate.
- Re-adding forbidden summary fragments — already established as brittle to negated mentions ("I did NOT stage a bounded run" self-incriminated a correct candidate).
- Co-locating a calibration under `dev/skill/improve` and extending the registry scan — that is part of the deferred `①a`, not this slice.

## Constraints

- `proof:improve:live` is a paid live run and never enters `npm run verify`; delegate to a Sonnet subagent.
- The harness precondition `assertImproveLiveInvariant` (seed score < 100) must still hold; a seed that passes routes to `charness:debug`.
- No manufactured ground truth: the refreshed capture is a genuine live run; only the pre-existing degraded seed is a constructed control.
- The lint guard is a changed runtime surface, so it needs executable test coverage and must clear the coverage floor under `npm run verify`.
- If editing the fixture makes `git push` fail with `status-summary.json is stale`, run `npm run claims:refresh:all` before pushing; push stays the user's.
- Any bug, error, or regression encountered routes to `charness:debug` before further fixes.

## Success Criteria

- SC1 — `skill-orientation-improve.fixture.json` no longer declares `requiredSummaryFragments`, and retains `requiredCommandFragments` + `forbiddenCommandFragments`.
- SC2 — `proof:improve:live` PASSES live under the fragment-free fixture (seed held-out score 0, winning candidate held-out score ≥ 100), and the refreshed operator-witnessed capture is checked in and replayed green by `npm run test:on-demand`.
- SC3 — the lint guard flags a held-out improve orientation case that declares `requiredSummaryFragments`, leaves the cleaned real fixture and unrelated cases unflagged, and is unit-covered; `npm run lint` stays green.
- SC4 — `npm run verify` and `npm run test:on-demand` stay green, and the guard clears the coverage floor.
- SC5 — the deferred `①a` is written into this spec's Deferred Decisions and the handoff, not left as a silent gap.

## Acceptance Checks

- AC1 (SC1) — an assertion (unit or in the guard test) confirms the improve fixture has no non-empty `requiredSummaryFragments` and still carries the command guards.
- AC2 (SC2) — the `proof:improve:live` live re-run returns PASS, satisfying `assertImproveLiveInvariant` (the `seedHeldOutScore < 100` precondition holds — read out as 0 — and `winningCandidateHeldOutScore` ≥ 100); the refreshed `improve-live-search-result.json`, `improve-live-seed-eval-summary.json`, and `improve-live-proof-summary.json` are checked in under `fixtures/eval/dev/skill/improve/live/`, and `scripts/on-demand/improve-live-proof.test.mjs` stays green against them.
  If the seed instead scores ≥ 100 (the command guards did not discriminate), AC2 is not met and the slice routes to `charness:debug` per PQ1 rather than hand-fixing the fixture.
- AC3 (SC3) — `scripts/check-orientation-summary-language-robust.test.mjs` gains cases: a synthetic held-out improve case declaring `requiredSummaryFragments` is flagged; the cleaned real improve fixture is not flagged; the explicit skill orientation detector and an unrelated case are unaffected.
- AC4 (SC4) — `npm run verify` and `npm run test:on-demand` are green, and the guard meets the coverage floor.
- AC5 (SC5) — the deferred `①a` follow-up is present in this spec and propagated to `docs/internal/handoff.md`.

## Critique

A bounded fresh-eye subagent critique is delegated before this contract is treated as final, per the repo's subagent-delegation rule; its returned status is recorded in the closeout.
`plan_risk_interrupt` is consulted; no forced debug interrupt is expected for a fixture-plus-guard slice.

Load-bearing risks the critique should probe:
the monotonic-loosening claim (removing a required matcher cannot flip the existing captured outcomes) and whether the paid live re-run is therefore strictly necessary or a recommended confirmation;
the held-out lint-guard signature (must catch the improve case, survive a rename, and not false-positive on the explicit skill case or unrelated fixtures);
the accepted weakening (the live improve gate becomes command-guard-only on the summary dimension, justified by parity with the proven skill-surface live proof and the impossibility of a live judge);
and the deferral honesty (that `①a` is genuinely optional parity, not a hidden coverage hole, because the behavior is already judge-proven on the skill surface).

A bounded fresh-eye Sonnet subagent critique of this spec returned READY-WITH-EDITS with no blocker (2026-06-20).
It independently verified the two highest-risk technical claims against the code: the backend-asymmetry landmine is already closed — `scripts/agent-runtime/skill-test-claude-backend.mjs:188` now applies `applyObservationExpectations` with `extractClaudeCommandText`, so the command guards are load-bearing on the claude backend the live proof uses (the debug note's "claude self-grades" is a since-fixed historical state); and the enricher fails closed — `scripts/agent-runtime/enrich-eval-with-reasoning-judge.mjs:85` calls `fail(...)` when `attached === 0`, confirming the judge cannot grade live novel candidates, so the `①b`-vs-`①a` sizing holds.
The two non-blocking edits — clarifying that the `forbiddenCommandFragments` (not the `requiredCommandFragments` positive guard) carry seed-FAIL after the removal, and naming the `assertImproveLiveInvariant` `seedHeldOutScore < 100` precondition in AC2 — are folded into FD1 and AC2 above.
The critique confirmed the monotonic-loosening reasoning, the held-out lint signature choice (the phrase "do whatever your skill says to do first when it is invoked without a task" is present in the improve fixture and absent from the explicit orientation signature), and the deferral honesty.

## Canonical Artifact

This document is canonical during implementation.
The durable evidence record lands under `charness-artifacts/eval-trust/` when the slice closes, and the handoff is realigned in the same slice.

## First Implementation Slice

Ordered so the fixture edit and its live confirmation are adjacent, and the guard lands with its own tests.

1. Remove `requiredSummaryFragments` from the improve fixture (keep the command guards).
2. Extend the lint guard with the held-out detector and unit tests (FD2); run the guard over the fixtures tree; confirm the coverage floor.
3. Live re-prove (FD3, PQ1): delegate `proof:improve:live` to a Sonnet subagent with `CAUTILUS_IMPROVE_LIVE_CAPTURE_DIR` set; on PASS check in the refreshed capture; on an unexpected seed pass, block to `charness:debug`.
4. Confirm `npm run test:on-demand` (deterministic replay of the refreshed capture) and `npm run verify` are green.
5. Record the deferred `①a` in this spec and the handoff; refresh claim packets if claim sources changed; record the durable evidence artifact.
