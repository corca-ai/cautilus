# Bounded Improvement badge: declared → proven (dev/skill surface)

Date: 2026-06-20

## Decision

The apex `Bounded Improvement` badge moves from `declared` (projected a saved bundle) to **proven on the dev/skill surface**.
The proof is a live, end-to-end `cautilus improve` loop that recovers a held-out scenario it was never tuned on, asserted in the executable spec.

## What is proven

`npm run proof:improve:live` (`scripts/on-demand/improve-live-proof.mjs`) drives the real chain:

1. Constructs a degraded control prompt — the current `skills/cautilus-agent/SKILL.md` with its No-Input Orientation discipline replaced by an escalation directive (`fixtures/eval/dev/skill/improve/degraded-orientation-skill.md`).
2. Runs a live agent eval (`cautilus evaluate fixture --adapter-name self-dogfood-improve-skill`, claude_code) of the seed control and confirms it FAILS the held-out orientation scenario (`execution-cautilus-no-input-claim-discovery-status`).
3. Builds the report → `improve prepare-input` → `improve search prepare-input` → `improve search run` — a real bounded search with a live codex mutation plus a worktree candidate eval — then `improve propose` and `improve build-artifact`.
4. Asserts the held-out win: seed (degraded) scores 0/failed; the mutated candidate `g1-1-codex-exec` it was never tuned on scores 100/passed; search `status: completed`, `selectedCandidateId: g1-1-codex-exec`.

Operator-witnessed live capture (replayed deterministically by `scripts/on-demand/improve-live-proof.test.mjs`, projected by `docs/specs/user/improvement.spec.md` via `lint:specs`):

- `fixtures/eval/dev/skill/improve/live/improve-live-proof-summary.json` — seedHeldOutScore 0, winningCandidateHeldOutScore 100, provenance.kind `live-improve-loop`.
- `fixtures/eval/dev/skill/improve/live/improve-live-search-result.json` — `cautilus.improve_search_result.v1`, status completed.
- `fixtures/eval/dev/skill/improve/live/improve-live-seed-eval-summary.json` — the seed control's live `reject`/`failed` capture.

## Honesty boundary

- Only the SEED is constructed (a degraded control). This is allowed: control-only construction, never ground-truth manufacture.
- Every score is a real live capture (seed fail and candidate pass are both live agent evals), not asserted.
- The mutation is a real live codex rewrite from the degraded prompt; the candidate held-out score is a real live claude eval of the mutated prompt in a worktree.
- Neither the degraded seed nor the mutated candidate ever ships: the working-tree `SKILL.md` is restored before the proof exits (try/finally), and `git` shows `skills/cautilus-agent/SKILL.md` unchanged. The loop produces a reviewable proposal/revision artifact for human approval.
- Scope: proven on the dev/skill orientation prompt target. Extending the live held-out improve proof to additional improvement targets stays open (recorded in the improvement-loop contract Evidence Gaps), not silently claimed.

## Bugs this proof surfaced and fixed (load-bearing)

The proof was unprovable until these real product/runner bugs were fixed (all routed through `charness:debug`; the legacy debug note was later removed during artifact cleanup):

1. The claude eval backend never applied the deterministic expectation matchers (`applyObservationExpectations`) — it self-graded execution outcomes. Switched to `--output-format stream-json` to capture the tool_use command log and apply the same matchers codex already applies (`scripts/agent-runtime/skill-test-claude-backend.mjs`, `skill-test-telemetry.mjs`).
2. `improveSearchScenarioSignalMap` accumulated buckets/feedback into in-memory `[]string` then read them back through `stringSliceOrEmptyRuntime`, which only matched `[]any` — so the reflection batch silently dropped every per-scenario feedback message and mutations ran blind (`internal/runtime/improve_search.go`).
3. `improveSearchHeldOutEntriesFromEvalSummary` read the held-out scenario id from `caseId`, but dev/skill eval-summaries carry it as `evaluationId`; the fallback to `displayName` made the candidate's matrix entry mismatch the held-out scenario set, so the dominating candidate never reached the frontier and the search always blocked.

Supporting fixes: load-bearing held-out prompt (minimal/open prompt so SKILL.md drives the behavior), claude candidate-eval backend + reliable cwd, wording-robust matchers (`branch` not `next branch`; dropped negation-brittle forbidden SUMMARY fragments; rely on forbidden COMMAND fragments), candidate-eval timeout 300s.

## Fresh-eye critique

Bounded fresh-eye / counterweight review delegated to a Sonnet subagent (read-only). Verdict: **READY-WITH-EDITS**.
Honesty (constructed control allowed, win is a real live capture, badge scoped to dev/skill) — fine; load-bearing (assert requires real mutation + seed<100 + candidate>=100>seed, four negative replay tests) — fine; the three bug fixes correct and narrowly scoped, claude-backend matchers are the right direction (the self-grading path was the bug) — fine; spec check table asserts the win precisely; no overclaim.
One real-but-minor edit applied: `docs/specs/rules/cost-and-proof-freshness.spec.md` still referenced the now-closed `gap.improve-held-out-cycle` as open — rewritten to point at the live proof.

## Gates

- `npm run lint:specs` — 42 specs ok (includes the new live improve check).
- `node --test scripts/on-demand/improve-live-proof.test.mjs` — 7/7 (deterministic replay of the live capture).
- `go test ./internal/runtime/` — ok (includes regression tests for bugs 2 and 3).
- `npm run proof:improve:live` — PASS (live; on demand, not in standing verify).
