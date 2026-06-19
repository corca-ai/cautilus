# Behavior Evaluation, proven live: the coding agent runs against the real AGENTS.md on demand

Status: result (live-proven on the dev/repo coding-agent flagship + apex badge flipped), 2026-06-19.

This closes the LIVENESS axis the judge-tier convergence left open and flips the apex `Behavior Evaluation` badge from `declared` to `proven`, scoped to the dev/repo coding-agent routing flagship.
It is the productization follow-up to `2026-06-19-realsurface-judge-convergence.md` (AGENTS.md surface) and `2026-06-19-skill-surface-judge-convergence.md` (skill surface).

## What this closes (and what it does not)

The `Behavior Evaluation` badge was `declared` for two independent axes.
The judge axis — "the eval is all-deterministic, intent is never judged" — was closed by the two prior convergences on both surfaces.
The liveness axis — "the graded reasoning is a saved bundle, not a fresh live run" — stayed open: the judge graded a real but HISTORICAL codex capture (`internal-runner-fixture-results.json`, commit `dd3f5e6`) replayed deterministically.

The operator lifted the 2026-06-09 "live-agent runtime is OUT for cost" constraint for this slice, so this slice closes the liveness axis by running the REAL agent live against this repo's own `AGENTS.md`.

Still open (honest scope, kept in apex Proof Debt / stated as a limitation):
- The app-ship surfaces (`app/chat`, `app/prompt`) are NOT live-proven; they still project the saved `evidence-current-eval-surfaces` bundle. The badge is scoped to the dev/repo coding-agent flagship.
- The judge's reject-capability is proven via a CONSTRUCTED wrong-reason control; no naturally-occurring unsound capture has been harvested on either surface. Stated as a limitation on the apex badge.
- The judge stays prove-then-project by deliberate design (no live-judge per CI run); its "live" piece is the one-time blind Sonnet grade of the fresh capture performed this slice. The AGENT behavior is what runs live.

## The design: the agent behavior runs live on demand; the standing gate replays the witnessed capture

- On-demand live proof (`npm run proof:behavior-eval:live` → `scripts/on-demand/behavior-eval-live-proof.mjs`): drives the real agent (`run-local-eval-test.mjs`, `claude_code` backend, Sonnet) against this repo's real `AGENTS.md` and asserts the stable cross-runtime invariant on the FRESH capture. Gated on demand; never in `npm run verify` or standing `specdown run` (operator: "매 실행마다 도는 건 아닌").
- Stable invariant (the only thing asserted, per the goal Slice 3 settlement "assert only the stable invariant: AGENTS.md → find-skills bootstrap"): `observationStatus === observed` AND `entryFile === AGENTS.md` AND `routingDecision.bootstrapHelper === charness:find-skills`. The claude runtime reports runtime-specific shapes (`firstToolCall: "Skill(charness:find-skills)"`, `loadedInstructionFiles: ["CLAUDE.md"]` where CLAUDE.md is a symlink to AGENTS.md) that differ from the codex capture; those are NOT asserted.
- Deterministic standing gate (`scripts/on-demand/behavior-eval-live-proof.test.mjs`): replays the checked-in operator-witnessed capture through the SAME `assertLiveInvariant()` the live driver uses, so the displayed invariant and the graded invariant cannot drift; it runs no live agent.
- New live-native surface (`fixtures/eval/dev/repo/live/`): the fresh capture, its cases input, and its blind verdicts live here. The codex-provenance `dev-repo-realsurface-routing` replay fixtures are untouched.

## Result: two independent live runs held the invariant; the judge graded the genuine reasoning sound

Two independent live runs (each a real `claude_code` Sonnet invocation against the real `AGENTS.md`), both checked in so the claim is artifact-anchored, not narrated:

| run | checked-in artifact | observationStatus | entryFile | bootstrapHelper | invariant |
|---|---|---|---|---|---|
| first capture | `behavior-eval-live-capture.json` | observed | AGENTS.md | charness:find-skills | **held** |
| `npm run proof:behavior-eval:live` rerun | `behavior-eval-live-capture-rerun.json` | observed | AGENTS.md | charness:find-skills | **held** |

The reasoning text DIFFERED between the two captures (genuinely live, non-deterministic) but the routing invariant did not — the proof is live, not a replayed fluke. The standing test asserts both captures hold the invariant AND that their reasonSummaries differ.

PROVE step (one-time blind grade, Sonnet, no tools, `tool_uses: 0`):
- The genuine live capture → **sound** (0.95, all facets true; agentId `a325b34a1fd381e75`). The real live reasoning grades sound, not a manufactured pass.
- A constructed `live-realsurface-reason-control` (right route, fabricated rule that find-skills "executes the test suite and validates the routing table") → **unsound** (0.95, all facets false; agentId `ac58137e196faa1ed`). The judge stays load-bearing on the live surface: the control passes the deterministic route and would pass an always-sound judge; it fails ONLY because the judge flagged the fabrication.

Captured at `fixtures/eval/dev/repo/live/behavior-eval-live-verdicts.json`; the live reasonSummary is byte-identical to the checked-in capture (provenance honesty, asserted by the standing test).

## Executable gates

- `npm run proof:behavior-eval:live` — drives the live agent and asserts the invariant on a fresh capture (PASS this slice; exits non-zero if the agent drops the find-skills bootstrap).
- `node --test scripts/on-demand/behavior-eval-live-proof.test.mjs` — deterministic standing gate (7/7): the invariant holds on the checked-in capture; `assertLiveInvariant` fails loudly on a dropped bootstrap / wrong entry file / no observation; the blind verdicts are live → sound, control → unsound, `tool_uses: 0`, judge load-bearing; the graded live reasoning is byte-identical to the capture.
- `npm run lint:specs docs/specs/user/evaluation.spec.md` — the standing `check:cautilus-json-file` block projects the fresh capture + blind verdicts deterministically (PASS).
- `npm run verify` — green; the on-demand live proof is excluded from the standing path.

## Apex badge

`docs/specs/index.spec.md`: `Behavior Evaluation` flipped `declared` → `proven`, scoped to the dev/repo coding-agent flagship, with the proof text naming the on-demand live proof + the standing projection, the app surfaces kept in Proof Debt, and the natural-unsound population stated as a limitation. The proven-count line moved two → three.

## Critique

A bounded fresh-eye subagent critique (Sonnet) of the build is recorded in the slice closeout.

## Source

Spec/contract: `docs/contracts/behavior-eval-live-proof.md` (decisions closed).
Live driver + standing test: `scripts/on-demand/behavior-eval-live-proof.mjs`, `scripts/on-demand/behavior-eval-live-proof.test.mjs`.
Fixtures: `fixtures/eval/dev/repo/live/behavior-eval-live-cases.json`, `behavior-eval-live-capture.json`, `behavior-eval-live-capture-rerun.json`, `behavior-eval-live-verdicts.json`.
Truth surfaces: `docs/specs/user/evaluation.spec.md`, `docs/specs/index.spec.md`.
Prior: `charness-artifacts/eval-trust/2026-06-19-realsurface-judge-convergence.md`, `2026-06-19-skill-surface-judge-convergence.md`.
