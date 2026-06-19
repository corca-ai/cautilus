# Behavior Evaluation: closing the liveness axis with an on-demand live agent run

Status: build contract (decisions closed with the operator, 2026-06-19).

This is the productization follow-up that closes the LIVENESS axis the judge-tier convergence left open, and flips the apex `Behavior Evaluation` badge from `declared` to `proven` on the dev/repo coding-agent flagship.

## Problem

The apex `Behavior Evaluation` badge was `declared` for two independent reasons.
The first — "the eval is all-deterministic, intent is never judged" — was closed by the reasoning-soundness judge convergence on both the AGENTS.md real surface (`realsurface-judge-convergence.md`) and the cautilus-agent skill surface (`skill-surface-judge-convergence.md`).
The second — "the graded reasoning is a saved bundle, not a fresh live run" — stayed open: the judge graded a real but HISTORICAL codex capture (`internal-runner-fixture-results.json`, commit `dd3f5e6`) replayed deterministically, so the apex legend's `proven` bar ("a checked-in executable spec runs the behavior live and asserts on the result") was not met.

The 2026-06-09 goal decision (`charness-artifacts/goals/2026-06-09-clear-proof-debt-live-proven.md`) had put live-agent runtime OUT for cost, which is why the prior convergences settled for prove-then-project onto a trusted fixture.
The operator has now lifted that cost constraint for this slice: we may run the live agent to close the liveness axis honestly.

## Current Slice

Run the REAL agent live (claude/Sonnet) against this repo's own `AGENTS.md`, on demand, and assert the stable cross-runtime routing invariant on the fresh capture.
Blind-grade the genuine live reasoning sound and a constructed wrong-reason control unsound (Sonnet, no tools), keeping the judge load-bearing on the live surface.
Check in the operator-witnessed fresh capture and the blind verdicts as trusted evidence, project them deterministically in the standing spec, and flip the apex badge to `proven` scoped precisely to the dev/repo coding-agent flagship.

## Fixed Decisions

- FD1 — On-demand, not standing. The live agent run is gated behind `npm run proof:behavior-eval:live`; it never runs inside `npm run verify` or standing `specdown run`. The standing gate projects the checked-in fresh capture deterministically. (Operator: "매 실행마다 도는 건 아닌 게 맞고.")
- FD2 — Live runtime is claude/Sonnet. The agent under test and the blind judge both run on Sonnet. (Operator: "검증은 소넷으로.")
- FD3 — Assert only the stable cross-runtime invariant. The live assertion is `observationStatus === observed` AND `entryFile === AGENTS.md` AND `routingDecision.bootstrapHelper === charness:find-skills`. The claude runtime reports runtime-specific shapes (`firstToolCall: "Skill(charness:find-skills)"`, `loadedInstructionFiles: ["CLAUDE.md"]`) that differ from the codex capture; those are NOT asserted. This is the same "assert only the stable invariant: AGENTS.md → find-skills bootstrap" the goal Slice 3 settled.
- FD4 — The judge stays prove-then-project; its liveness is a one-time blind Sonnet grade of the FRESH capture. There is no live-judge-in-CI (deliberate design: `run-reasoning-judge-eval.mjs` is replay-only). The judge's "live" piece is the blind Sonnet grade performed this session over the fresh live capture, checked in and replayed. The agent BEHAVIOR is what runs live.
- FD5 — New live-native surface; do not surgically rewrite the codex-provenance fixtures. The existing `dev-repo-realsurface-routing` replay fixtures stay as-is. A new `fixtures/eval/dev/repo/live/` surface carries the fresh claude/Sonnet capture, its cases input, and its blind verdicts.
- FD6 — Badge → `proven`, scoped to the dev/repo coding-agent routing flagship, with the app-ship surfaces (`app/chat`, `app/prompt`) kept in Proof Debt and the natural-unsound population recorded as a stated limitation. No legend redefinition: the on-demand live proof genuinely meets "a checked-in executable spec runs the behavior live and asserts."

## Probe Questions (resolved this slice)

- PQ1 — Does the genuine LIVE reasoning grade sound, or only a manufactured pass? RESOLVED: a blind Sonnet subagent (no tools, `tool_uses: 0`) graded the fresh live capture **sound** (0.95, all facets true). The control graded **unsound** (0.95, all facets false). The judge is load-bearing on the live surface.
- PQ2 — Does the live claude/Sonnet agent actually hold the AGENTS.md → find-skills invariant? RESOLVED: the live run returned `entryFile: AGENTS.md`, `routingDecision.bootstrapHelper: charness:find-skills`. The runtime-specific shapes diverge from codex (FD3), which is why the invariant is scoped.

## Non-Goals

- Live-proving the app-ship surfaces (`app/chat`, `app/prompt`). They remain projected/declared and tracked in Proof Debt.
- A live judge per CI run. Deliberately out (FD4).
- Re-litigating the apex voice/structure or surgically rewriting the codex replay fixtures (FD5).
- Flipping `dev/skill` to a live on-demand spec; it stays fresh-capture-replay from its convergence slice.

## Constraints

- No manufacturing ground truth: the sound case is a REAL live capture; only the control is constructed with an objectively-false fabrication.
- The generic Go engine and generic runtime runner gain no repo-specific judge logic; judge logic stays adapter/SOT-owned.
- Push is the operator's job (deferred). After editing claim-source files (the apex is one), run `npm run claims:refresh:all`.
- Critique is delegated to a bounded subagent (Sonnet), never a same-agent pass.

## Success Criteria

- SC1 — `npm run proof:behavior-eval:live` drives the live claude/Sonnet agent against the real AGENTS.md and asserts the stable invariant on the FRESH capture; it fails loudly if the agent stops routing to the find-skills bootstrap.
- SC2 — A deterministic standing test replays the checked-in operator-witnessed capture, asserts the same invariant, and asserts the blind verdicts (live → sound, control → unsound, `tool_uses: 0`, judge load-bearing).
- SC3 — The apex `Behavior Evaluation` badge reads `proven`, scoped honestly to the dev/repo flagship, with the app surfaces in Proof Debt and the natural-unsound limitation stated. `npm run lint:specs` and `npm run verify` stay green.
- SC4 — The fresh capture pinned in the standing spec/test is byte-identical to the live capture the blind judge graded (provenance honesty).

## Acceptance Checks

- AC1 — `npm run proof:behavior-eval:live` (live; on demand): exits 0, asserts `entryFile === AGENTS.md` and `bootstrapHelper === charness:find-skills` on a freshly produced capture.
- AC2 — `node --test scripts/on-demand/behavior-eval-live-proof.test.mjs` (deterministic; standing): the invariant holds on the checked-in capture; the verdicts file carries live → sound and control → unsound with `tool_uses: 0`; an always-sound judge would pass the control (load-bearing check); the control's reasonSummary fabricates a rule the governing rules do not support.
- AC3 — `npm run lint:specs` green with the flipped apex badge and the new evaluation.spec.md projection; `npm run verify` green (on-demand live is excluded).
- AC4 — `docs/specs/index.spec.md` badge is `proven`; the proof text names the on-demand live proof and the standing projection, scopes to the dev/repo flagship, and the Proof Debt + stated-limitation lines name the app surfaces and the natural-unsound gap.

## Critique

A bounded fresh-eye subagent critique (Sonnet) of the build is required before closeout; record its status here.

## Canonical Artifact

This file during the build; `charness-artifacts/eval-trust/2026-06-19-behavior-eval-live-proven.md` is the durable evidence record at closeout.
