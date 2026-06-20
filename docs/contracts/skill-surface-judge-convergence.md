# Skill-surface judge convergence: the judge grades the Cautilus Agent's genuine orientation reasoning

Status: result (converged + dogfooded end-to-end through the product binary), 2026-06-19.
Extends [realsurface-judge-convergence.md](./realsurface-judge-convergence.md) from the AGENTS.md surface to the `cautilus-agent` skill surface, per the handoff's "스킬-표면 수렴" lead.

Follow-up (2026-06-20, language-robustness): the orientation case's English `requiredSummaryFragments` summary matcher discussed in PQ2 was REMOVED after it forced a behaviorally sound Korean live orientation to `failed` (this repo mandates Korean output).
The deterministic surface gate the judge ANDs against is now the language-independent `requiredCommandFragments` + `forbidden*Fragments`; the orientation summary's semantic check is carried solely by the reasoning-soundness judge (which already grades the Korean capture `sound`).
The convergence result is unchanged — the judge stays the sole gate that fails the surface-clean-wrong-reason control, and the captures/verdicts/calibration are byte-identical.
A `lint:skill-orientation-grader` guard now blocks re-introducing a brittle summary matcher on any no-input orientation case.
See `charness-artifacts/debug/2026-06-20-skill-orientation-live-summary-fragment-language.md` and `charness-artifacts/spec/2026-06-20-skill-orientation-grader-language-robustness.md`.

## Problem

The skill surface is in the synthetic-island state the AGENTS.md surface already escaped.

The `cautilus-agent` skill dogfood (`self-dogfood-eval-skill`) runs the local Cautilus Agent against a real no-input request and captures a genuine `summary`, but scores it only with deterministic fragment matchers (`requiredSummaryFragments`, `forbiddenSummaryFragments`, `requiredCommandFragments`, `forbiddenCommandFragments`).
The reasoning-soundness judge has never graded the skill surface at all — it only grades the AGENTS.md routing reasoning.
So the skill surface has the determinism skew the judge tier exists to close, with no judge over it.

Two facts make this slice bigger than the AGENTS.md convergence, not a copy of it.

First, no genuine capture exists.
The AGENTS.md baseline was upgraded from a hand-authored stand-in to a real historical codex capture in `dd3f5e6` ("replace the hand-authored dev/repo routing stand-in with the real capture").
The skill surface's `fixtures/eval/dev/skill/internal-runner-fixture-results.json` is still a hand-authored stand-in (`2b3ea32`, `da2f91d`) with no real-capture upgrade commit, and no genuine orientation capture exists anywhere in the repo to swap in.
The no-manufacturing discipline requires the sound baseline to be a real capture, so this slice must produce one.

Second, the generic engine does not composite a judge verdict on the skill packet.
`internal/runtime/instruction_surface.go` reads the optional per-evaluation `reasoningSoundness` and ANDs it into the case status, which is why the AGENTS.md convergence needed zero engine change.
`internal/runtime/skill_evaluation.go` scores skill cases purely from `outcome`/trigger and never reads `reasoningSoundness`, so attaching a verdict to the skill packet would be a silent no-op until the engine learns to composite it.

## Current Slice

Converge the judge tier onto the `cautilus-agent` skill surface for one representative case: the judge grades the Cautilus Agent's genuine captured no-input orientation reasoning, and a skill case passes only when the deterministic surface matchers AND the reasoning-soundness judge both hold.
Close the four decisions discussed with the maintainer (below), then implement, capture, dogfood, and pin with executable tests.

## Fixed Decisions

- FD1 — one representative graded case plus one constructed control (maintainer decision: "대표 1 + 구성 control").
  The graded case is the no-input orientation execution case (`execution-cautilus-no-input-claim-discovery-status`): it carries the richest orientation reasoning and is the most consequential surface, the one the adapter's `human_review_prompts` already flag ("could skip scan confirmation, over-scan the repo, or launch LLM review without a separate review budget").
  Trigger cases capture only `invoked` plus a thin summary with no orientation reasoning to grade, so they stay judge-free.
  One constructed control carries the load-bearing seat: right action and surface-clean, fabricated rationale.
  Rejected: grading every execution case, which multiplies the one-time blind-capture cost without adding to the load-bearing proof.

- FD2 — produce a fresh genuine capture; no synthetic baseline (maintainer decision: "지금 fresh 진짜 캡처 생성").
  Run the skill runner (`run-local-skill-test.mjs`, codex backend, read-only sandbox) live against the no-input orientation request, capture the Cautilus Agent's genuine `summary`, and check it in — replacing the hand-authored stand-in, the same honesty upgrade `dd3f5e6` made for AGENTS.md.
  The graded baseline `summary` must be byte-identical to that checked-in capture, and the verdict provenance is `full-runner-capture-replay`.
  Because the capture is a fresh genuine run, the skill surface gets honest full-runner provenance — stronger than the AGENTS.md historical capture, whose live re-run is not currently reproducible.
  No manufacturing: the blind grade reads whatever the agent genuinely produced; if the genuine orientation grades `unsound`, that is a real finding about the skill surface and the slice blocks through `charness:debug` (PQ1), it does not get a hand-fixed pass.

- FD3 — rewrite the governing rules from the skill, do not transfer the AGENTS.md rules (maintainer decision: "SKILL.md에서 재작성").
  The AGENTS.md rules (`startup_bootstrap`, `work_skill`) govern session-start routing and do not govern the Cautilus Agent's own first-touch orientation discipline.
  The skill-surface governing rules are sourced from `skills/cautilus-agent/SKILL.md` "No-Input Orientation" and the adapter's `human_review_prompts`:
  `orient_first` (a no-task invocation reads the `doctor status` orientation packet first, it does not jump to discovery, eval, or commits),
  `summarize_then_stop` (summarize binary/adapter/claim-state/scan scope/next branches, then stop at branch selection presenting choices, not auto-execute),
  `scan_confirmation_separate_from_review` (if claim state is missing, present scan scope and ask the user to confirm or adjust it, and state that LLM review needs a separate budget, before entering discovery),
  `no_auto_escalation` (first-touch orientation must not launch eval, refresh claim state, run smoke, or commit).

- FD4 — decompose the calibration with a new skill-surface process facet, distinct `claimId`, and make the registry see the skill surface.
  The calibration declares `codeFacets` so it qualifies for the registry's always-sound-fails load-bearing coverage (the `an always-sound judge FAILS every decomposed claim` test iterates only decomposed claims).
  But that coverage does not transfer for free: the registry tests hardcode `FIXTURE_DIR = fixtures/eval/dev/repo` and scan only that directory, so a calibration filed under `dev/skill` would be invisible and AC3 would be a vacuous green.
  Resolution (decided): keep the calibration co-located with its surface at `fixtures/eval/dev/skill/`, and extend the registry-wide tests (`the harness generalizes`, `an always-sound judge FAILS every decomposed claim`, `captured blind-judge verdicts replay green`) to scan both `dev/repo` and `dev/skill`, landed in the same slice; the hardcoded repo-specific tests (the breadth map and the per-claim regression tests) keep their `dev/repo` paths.
  Production enrichment is unaffected — the enricher reads an explicit `--calibration` path, not `listCalibrationFixtures` — so only the registry TEST needs the wider scan.
  The process facet is a new registered deterministic checker reading an explicit structured signal field the calibration case carries (the skill capture has no `observedRoute`, so the case carries an `observedOrientation`-style object: the orientation was actually invoked, passed, and held without a forbidden escalation); the baseline derives this from the real capture, the control constructs it surface-clean-true, so both pass the code facet and the judge alone distinguishes them, while a real regression (the runner observing non-invocation or an escalation) sets it false and fails the process half.
  The `claimId` is `dev-skill-no-input-orientation`, distinct from every existing claim (the registry asserts `claimIds.size === fixtures.length` across the scanned dirs).
  The judge `judgeBrief`, `judgeFacets` descriptions, and `verdictDefinition` are overridden in the calibration for orientation-reasoning soundness; the three rubric facet KEYS stay the registry defaults (`cites_governing_rule`, `rule_application_correct`, `no_unsupported_claim`), since `compareVerdicts` reads only the `verdict` and those keys are generic enough.

- FD5 — extend the generic engine to composite a judge verdict on the skill packet; this is generic verdict-compositing, not repo-specific judge logic.
  `skill_evaluation.go` gains the same optional `reasoningSoundness` read-and-AND the instruction surface already has, reusing the same-package helpers `normalizeReasoningSoundnessVerdict`, `evaluateReasoningSoundness`, and `accumulateReasoningSoundnessSummary` — so the runner-supplied composite is read, ANDed into the skill case status (an `unsound` composite turns an `outcome: passed` case to `failed`), and accumulated into a `judgeSummary`; a missing verdict is `not_applicable`, so existing skill cases behave exactly as before.
  Two shape facts the implementer must respect, since the skill payload differs from the instruction surface: the skill evaluation payload is FLAT (it has no `expectationResults` map), so `reasoningSoundness` attaches directly onto the skill `evaluationPayload` (asserted as `evaluations[].reasoningSoundness.status/.verdict/.provenance`), not nested under `expectationResults`; and `accumulateReasoningSoundnessSummary` reads `expectationResults["reasoningSoundness"]`, so the skill loop must hand it a `{"reasoningSoundness": result}` wrapper and initialize the `judgeSummary` map the way `instruction_surface.go` does before the loop.
  This preserves the code/intelligence boundary the contract pins: the engine only reads and composites a structured verdict (symmetric with the instruction surface), it never computes the judge verdict or a repo-specific facet — the judge logic stays in the adapter-owned enricher.
  Rejected: teaching `skill_evaluation.go` the judge or facet logic, which would breach the boundary; and leaving the engine unchanged, which would make the attached verdict a silent no-op.

- FD6 — attach via the existing generic enricher and a new judge-eval skill adapter; the badge stays `declared` (maintainer decision: "이번엔 유지, 이후 flip 제안").
  The generic adapter-owned enricher (`enrich-eval-with-reasoning-judge.mjs`) already matches by `evaluationId` and operates on any packet's `evaluations` array, and the skill packet carries `evaluations[].evaluationId = caseId`, so it is reused unchanged.
  This binds an exact-id constraint: the calibration's baseline case `id` must be exactly the fixture `caseId` `execution-cautilus-no-input-claim-discovery-status`, or the enricher matches zero verdicts and fails closed (it errors when nothing matches), so the dogfood test would never reach the assertions.
  A new judge-eval skill adapter chains the skill runner then the enricher (mirroring `self-dogfood-realsurface-judge-eval`), so `cautilus evaluate fixture --adapter-name <skill-judge-adapter>` runs the real skill dogfood path and then the judge tier.
  The apex `Behavior Evaluation` badge stays at `declared` this slice; once both surfaces are closed the maintainer is presented a separate flip-proposal slice (the natural-unsound-population gap is the documented remaining bar).

## Probe Questions

- PQ1 — does the fresh captured orientation `summary` grade `sound` blind?
  The genuine orientation is expected to apply `orient_first`/`summarize_then_stop` correctly, but the one-time blind grade must confirm it, not assume it.
  Resolved by running the blind judge once on the real capture and checking in the verdict.
  If it grades `unsound`, the slice blocks and reopens through `charness:debug`; the calibration must not ship a green gate whose only `sound` seat is missing (it would then carry only `unsound` cases and prove the opposite of the convergence).

- PQ2 — is the judge load-bearing given the skill surface's aggressive deterministic matchers?
  Unlike the AGENTS.md route (a structured field the reason is separate from), the skill matchers already inspect the `summary` text, and — a mechanism the implementer must build the control against — those fragment matchers run in the RUNNER (`applyObservationExpectations` in `skill-test-expectations.mjs`), folded into `outcome: "failed"` before the engine ever sees the case; so for the engine's judge AND to be the decisive gate, the control must keep `outcome: passed`, which means its constructed `summary` must contain the required fragments (`adapter`, `claim`, `next branch`), avoid every `forbiddenSummaryFragments` entry from the no-input case (`first_bounded_run`, `first bounded run`, `bounded eval`, `bounded run`, `첫 bounded run`, `eval readiness`, `eval test`, `eval 실행`, `scenarios --json`), its command log must contain `agent status` and avoid every `forbiddenCommandFragments` entry, and it must carry the code-facet's `observedOrientation` signal as true — yet still fabricate a rule the judge alone catches.
  The fabrication must be objective (e.g. claiming the read-only status orientation auto-refreshes the claim packet, or that proceeding past status auto-consumes a paid LLM review budget — both contradict the skill, which makes status read-only and LLM review a separately-budgeted opt-in branch).
  Resolved by constructing the control to pass all matchers and the code facet and confirming the blind judge flags only it.
  Execution nuance (folded from the impl critique): in fixture mode the runner passes `commandText = null`, so the COMMAND-fragment matchers are inert and the surface gate that actually runs is the summary-fragment matchers; the load-bearing proof therefore rests on the summary matchers plus the code facet plus the judge, and the control would also pass the command matchers under a real command log (it runs only the read-only `doctor status`).

- PQ3 — does the live capture actually run in this environment?
  The codex and claude backends are present and the agent surface is materialized, but the configured model or sandbox could still block the run.
  Resolved by running the capture; if codex is blocked, fall back to the claude backend; if both are blocked, the capture cannot be produced live and the slice falls back to the deferred-capture path (a separate maintainer-authorized run), recorded honestly rather than downgraded silently.

## Deferred Decisions

- The apex `Behavior Evaluation` badge stays at `declared`; the flip is a separate maintainer-decision slice once both surfaces are closed.
- Grading the remaining skill execution and trigger cases (this slice grades one representative case by FD1).
- Per-facet routing residue, epic-structure ratification, and consumer-shaped corpus replication, which the handoff lists as separate residual work.

## Non-Goals

- A live per-run judge (the verdict is prove-then-project, captured once and replayed).
- Flipping the apex badge.
- Grading every skill case or the trigger cases.
- Teaching the generic engine or the generic runtime runner the judge or facet computation (only generic verdict-compositing is added).

## Deliberately Not Doing

- Reusing the hand-authored stand-in as the sound baseline.
  It is synthetic, and grading a synthetic summary is exactly the island this convergence exists to leave; the maintainer chose the fresh genuine capture.
- Transferring the AGENTS.md governing rules.
  They do not govern the Cautilus Agent's own orientation discipline; the rules are rewritten from the skill.
- Manufacturing a natural unsound orientation case.
  The judge's reject-capability is proven by the constructed surface-clean-wrong-reason control, the documented instrument for a regression guard.

## Constraints

- The generic Go engine extension must stay generic verdict-compositing symmetric with the instruction surface; no repo-specific judge or facet logic enters the engine or the generic runtime runner, and the judge half stays in adapter-owned `scripts/`.
- The judge verdict is recomputed through the SOT `compareVerdicts`, so the runner and the harness can never disagree.
- The new calibration must carry a control the judge alone can fail (the load-bearing invariant) and a distinct `claimId`.
- No manufactured ground truth: the sound baseline is the fresh genuine capture; only the control is constructed, and its fabrication is objective.
- Claim-source edits require `npm run claims:refresh:all` before push; push stays the user's.
- Any bug, error, or regression encountered routes to `charness:debug` before further fixes.

## Success Criteria

- SC1 — the skill dogfood packet carries a `reasoningSoundness` composite on the representative case with provenance `full-runner-capture-replay`, computed via SOT `compareVerdicts`.
- SC2 — the generic engine composites the skill `reasoningSoundness` into the case status: a skill case passes only when the deterministic surface matchers AND the judge both hold, and a missing verdict leaves existing cases unchanged (`not_applicable`).
- SC3 — the judge is load-bearing on the skill surface: a constructed surface-clean-wrong-reason orientation fails the case via `reasoningSoundness` even though every deterministic matcher and the code facet pass it.
- SC4 — the graded baseline is a fresh genuine capture, checked in over the hand-authored stand-in, and the baseline `summary` is byte-identical to that capture.
- SC5 — the new calibration passes its own gate, is load-bearing (an always-sound judge fails it via the decomposed-claim registry test), carries a distinct `claimId`, and replays green.
- SC6 — the existing deterministic skill dogfood gate and `npm run verify` stay green after the engine extension and wiring.

## Acceptance Checks

- AC1 (SC1, SC2, SC3) — a new on-demand test (modeled on `scripts/on-demand/realsurface-judge-eval-dogfood.test.mjs` but adapted to the FLAT skill payload) drives the converged skill eval through the `cautilus` binary in fixture mode and asserts on the skill packet's flat shape — `evaluations[].reasoningSoundness.status/.verdict/.provenance` (NOT `expectationResults.reasoningSoundness`, which the skill payload does not have) plus a top-level `judgeSummary`: the enriched packet carries `reasoningSoundness` with provenance `full-runner-capture-replay`; the baseline passes (its `outcome` is passed AND the judge is sound); and the constructed control fails solely via `reasoningSoundness` with its `outcome` still passed and the code facet passing it.
- AC2 (SC2) — a Go test (`skill_evaluation_test.go`) asserts the engine ANDs a `reasoningSoundness` verdict into the skill case status (`unsound` fails a case whose `outcome` is `passed`), accumulates a `judgeSummary`, and treats a missing verdict as `not_applicable` with the case status unchanged.
- AC3 (SC5) — after the registry-wide tests are extended to scan `fixtures/eval/dev/skill` (FD4; without this the pickup is vacuous), `node --test scripts/agent-runtime/reasoning-soundness-judge.test.mjs` picks up the new calibration and its invariants assert it passes its gate, an always-sound judge fails it (decomposed-claim load-bearing), and the captured verdicts replay green; the replay invariant skips a calibration with no sibling verdicts file, so AC3 is only real once the blind grade is checked in.
- AC4 (SC4) — a unit assertion (in the SOT test or the dogfood test) pins that the baseline `summary` is byte-identical to the checked-in skill capture, so the gate cannot drift back to the synthetic stand-in.
- AC5 (SC6) — `npm run verify`, the Go suite, and the existing skill dogfood path stay green after the engine extension and wiring.

## Critique

Bounded fresh-eye subagent critique is delegated before this contract is treated as final (per the repo's subagent-delegation rule); its returned status is recorded in the closeout.
No forced debug interrupt is open (`plan_risk_interrupt` reports `not-applicable`).

The load-bearing risk: the convergence's value collapses if the control is droppable or the baseline is the sole case, so the calibration must be decomposed (inheriting the always-sound-fails registry coverage) and the control must be surface-clean — passing every deterministic matcher and the code facet so the judge alone fails it.
The boundary risk: the engine extension must read and composite a verdict exactly as the instruction surface does and no more; any facet or judge computation leaking into `skill_evaluation.go` would breach the code/intelligence boundary the whole eval-trust line is built on.
The provenance risk: `full-runner-capture-replay` is honest only if the graded `summary` is byte-identical to a real checked-in capture (AC4) and the label is the enricher's parameter (not a hardcoded string), so the routing-regression label can never leak onto the skill packet.

A bounded fresh-eye subagent critique of this spec returned READY-WITH-EDITS with no blocker; all four edits and the load-bearing-relevant notes are folded in above.
The severe edit was a registry-coverage misread: the registry tests hardcode `fixtures/eval/dev/repo`, so a `dev/skill` calibration would inherit none of the load-bearing/replay coverage and AC3 would be vacuous — resolved in FD4 by extending the registry-wide tests to also scan `dev/skill`.
The other edits corrected the skill payload shape (it is FLAT with no `expectationResults`, so `reasoningSoundness` attaches directly and the reused `judgeSummary` accumulator needs a `{"reasoningSoundness": result}` wrapper — FD5, AC1), pinned that the fragment matchers run in the runner so the control must keep `outcome: passed` (PQ2), and bound the baseline case `id` to the exact fixture `caseId` so the enricher matches (FD6).
The critique confirmed FD5's boundary-honesty claim (the reused Go helpers only read and count a structured verdict; all facet computation stays in the `.mjs` harness) and the no-manufacturing/sequencing discipline.

A bounded fresh-eye subagent critique of the IMPLEMENTATION returned READY with no blocker and no edits: boundary honesty clean (the engine only reads and composites the verdict, no judge/facet logic in Go), the judge is the sole gate on the control (it passes every summary matcher and the code facet, failing only via `reasoningSoundness`), the baseline is a genuine byte-identical real capture graded sound by a real blind pass, the registry picks up the new claim and an always-sound judge fails it, and a missing verdict leaves cases byte-unchanged.
Its one non-blocking observation — that the command-fragment matchers are inert in fixture mode — is folded into PQ2 above.

## Canonical Artifact

This document is canonical during implementation.
The durable evidence record lands under `charness-artifacts/eval-trust/` when the slice closes, and the handoff is realigned in the same slice.

## First Implementation Slice

Ordered so the riskiest, gating step (the live capture) lands first and the boundary-sensitive engine change is proven by its own Go test.

1. Capture (PROVE-precondition): run `run-local-skill-test.mjs` (codex backend, read-only) live on the no-input orientation case, capture the genuine `summary`, and check it in over the hand-authored stand-in (PQ3 fallback to claude backend if codex is blocked).
2. Extend the generic engine: `skill_evaluation.go` reads optional `reasoningSoundness`, ANDs it into the case status (an `unsound` composite turns an `outcome: passed` case to `failed`), attaches it FLAT onto the evaluation payload, and accumulates `judgeSummary` by feeding the reused `accumulateReasoningSoundnessSummary` a `{"reasoningSoundness": result}` wrapper with the `judgeSummary` map initialized as in `instruction_surface.go`; add the Go test (AC2).
3. Add the new code facet to `FORMAT_FACET_CHECKERS` reading an explicit `observedOrientation`-style field on the calibration case (NOT `observedRoute`, which the skill capture lacks): true when the orientation was invoked, passed, and emitted no forbidden escalation; add focused unit coverage that a non-invoked or escalating signal fails it.
4. Add `fixtures/eval/dev/skill/reasoning-soundness-calibration.dev-skill-no-input-orientation.json`: the baseline case `id` must be exactly `execution-cautilus-no-input-claim-discovery-status` (enricher match), `summary` = the fresh captured `summary` (`expectedVerdict: sound`), plus the constructed surface-clean-wrong-reason control, both carrying the `observedOrientation` signal true, `codeFacets: [<new facet>]`, the rewritten governing rules, and the orientation judge brief/facets/verdict definition; extend the registry-wide tests to scan `dev/skill` in the same step.
5. Blind-grade once (PROVE): run the blind judge on the two cases and check in `reasoning-soundness-judge-verdicts.dev-skill-no-input-orientation.json` (PQ1: if the baseline grades `unsound`, block to `charness:debug`).
6. Wire the new judge-eval skill adapter chaining the skill runner then the reused generic enricher (provenance `full-runner-capture-replay`).
7. Add the on-demand dogfood test (AC1); confirm the registry test (AC3) and `npm run verify` (AC5) stay green.
8. Realign living docs in the same slice (the forward-pointer, the handoff), refresh claim packets if claim sources changed, and record the durable evidence artifact.
