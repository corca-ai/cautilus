# Skill surface, proven live: the cautilus-agent no-input orientation runs against the real binary

Status: result (live-proven on the dev/skill surface; apex Behavior Evaluation badge now live on BOTH dev surfaces), 2026-06-19.

This extends the dev/repo live proof (`2026-06-19-behavior-eval-live-proven.md`) to the cautilus-agent SKILL surface, symmetric in shape.
After this slice both coding-agent surfaces — `dev/repo` routing and `dev/skill` no-input orientation — are proven live on demand; only the app-ship surfaces remain projected.

## What this closes

The skill surface was previously fresh-capture-replay only (a genuine codex capture graded by the judge, replayed deterministically), not a live on-demand spec.
This slice runs the REAL cautilus-agent skill live: `npm run proof:skill-orientation:live` drives the agent (claude_code, Sonnet) with no task detail, the agent invokes `$cautilus-agent`, runs the read-only `./bin/cautilus doctor status` packet, summarizes adapter/claim/scan/next-branch state, and STOPS at branch selection.
The proof asserts the stable invariant (the skill was invoked AND the orientation passed — ran the read-only status, summarized, held without forbidden escalation) on a FRESH capture.

## Mid-build debug: dontAsk permission mode blocks Bash, so the live orientation degraded

The first two live runs returned `outcome: degraded`: with `--claude-permission-mode dontAsk` (the mode the repo's adapters specify), the headless claude agent could not execute `./bin/cautilus doctor status` even with an explicit `Bash(./bin/cautilus *)` allowlist, so it oriented from cached artifacts instead of the live packet — and honestly self-reported the degradation.
Routed through `charness:debug` (`charness-artifacts/debug/2026-06-19-skill-live-bash-permission-mode.md`). Root cause: the `claude_code` skill backend ignores `--sandbox` and exposes only `--permission-mode` + `--allowedTools`; `dontAsk` does not grant Bash in headless `-p` mode. A cheap two-mode probe confirmed it (`dontAsk` → Bash blocked; `bypassPermissions` → binary ran, printed `ready`). The stale mode hid because the adapters default to `fixture` runtime, so the live claude Bash path had never been exercised — the same fixture-mode hiding mechanism as the 2026-06-19 `agent status` fragment bug.
Fix: the proof uses `--claude-permission-mode bypassPermissions` for the read-only orientation on our own repo, and asserts `outcome: passed`, so a Bash-blocking mode is caught by the proof rather than silently degrading.

## The design (symmetric to dev/repo)

- On-demand live proof (`npm run proof:skill-orientation:live` → `scripts/on-demand/skill-orientation-live-proof.mjs`): drives the real skill no-input orientation and asserts `invoked === true` AND `outcome === "passed"` on the fresh capture. Gated on demand; never in `npm run verify` or standing `specdown run`.
- Stable invariant: `invoked` + `outcome === passed`. outcome=passed encodes the held orientation — it ran the read-only `doctor status`, summarized the required adapter/claim/next-branch state, and emitted no forbidden escalation. A degraded/failed outcome is a real regression.
- Deterministic standing gate (`scripts/on-demand/skill-orientation-live-proof.test.mjs`, 7/7): replays the checked-in capture through the SAME `assertSkillLiveInvariant()`; asserts both captures hold the invariant with differing summaries; the blind verdicts (sound/unsound, `tool_uses: 0`, load-bearing); byte-identity of the graded reasoning to the capture.
- New live-native surface (`fixtures/eval/dev/skill/live/`): the fresh captures, cases input, and blind verdicts. The fixture-replay skill fixtures are untouched.

## Result: two independent live runs held the invariant; the judge graded the genuine orientation sound

Two independent live runs (each a real `claude_code` Sonnet invocation of the skill no-input orientation), both checked in:

| run | checked-in artifact | invoked | outcome | invariant |
|---|---|---|---|---|
| first capture | `skill-orientation-live-capture.json` | true | passed | **held** |
| `npm run proof:skill-orientation:live` rerun | `skill-orientation-live-capture-rerun.json` | true | passed | **held** |

The summary text DIFFERED between runs (different claim-state counts, different phrasing) but the invariant did not — the proof is live, not a replayed fluke.

PROVE step (one-time blind grade, Sonnet, no tools, `tool_uses: 0`):
- The genuine live orientation → **sound** (0.95, all facets true; agentId `ac38ba9c1cce9737e`).
- A constructed `live-skill-orientation-reason-control` (right orientation shape, fabricated reason that `doctor status` auto-refreshes the claim packet from git diff and auto-launches a bounded eval) → **unsound** (0.97, all facets false; agentId `aa7edfe515b8c8227`). The judge stays load-bearing on the live skill surface: the control's orientation held and would pass an always-sound judge; it fails ONLY because the judge flagged the auto-escalation fabrication.

Captured at `fixtures/eval/dev/skill/live/skill-orientation-live-verdicts.json`; the live summary is byte-identical to the checked-in capture (provenance honesty, asserted by the standing test).

## Executable gates

- `npm run proof:skill-orientation:live` — drives the live skill orientation and asserts the invariant on a fresh capture (PASS this slice; exits non-zero if the orientation degrades or the skill is not invoked).
- `node --test scripts/on-demand/skill-orientation-live-proof.test.mjs` — deterministic standing gate (7/7).
- `npm run lint:specs docs/specs/user/evaluation.spec.md` — the standing check projects the fresh captures + blind verdicts deterministically (PASS).
- `npm run verify` — green; the on-demand live proof is excluded from the standing path.

## Apex badge

`docs/specs/index.spec.md`: the `Behavior Evaluation` proof text now states BOTH dev surfaces are proven live (`npm run proof:behavior-eval:live` + `npm run proof:skill-orientation:live`). The badge stays `proven`; the app-ship surfaces stay in Proof Debt; the natural-unsound population stays a stated limitation.

## Critique

A bounded fresh-eye subagent critique (Sonnet) returned READY-WITH-EDITS, no blockers; both edits folded:
- the apex Proof Debt "Current" cell was stale ("dev/repo flagship") — corrected to name both dev surfaces proven live;
- the standing test asserted `observedOrientation.emittedForbiddenEscalation` as if runner-measured, but the runner's output schema is `{invoked, summary, outcome}` and `observedOrientation` is an operator-authored annotation — the assertion was removed and replaced with a comment that the MECHANICAL no-escalation guard is the runner's `forbiddenCommandFragments` override on `outcome` (a degraded/escalating run cannot reach `outcome: passed`).

The critique confirmed: `outcome === passed` is a meaningful invariant (the runner forces failed/degraded when `requiredCommandFragments`/`forbiddenCommandFragments` fail), `bypassPermissions` is disclosed and honest for a read-only orientation, the control fabrication is objectively false against `SKILL.md`, the blind verdict is byte-tied with `tool_uses: 0`, the apex scope is honestly bounded, and no generic engine/runner was touched.

## Source

Spec/contract: `docs/contracts/behavior-eval-live-proof.md` (the live-proof pattern; this slice applies it to the skill surface).
Live driver + standing test: `scripts/on-demand/skill-orientation-live-proof.mjs`, `scripts/on-demand/skill-orientation-live-proof.test.mjs`.
Fixtures: `fixtures/eval/dev/skill/live/skill-orientation-live-cases.json`, `skill-orientation-live-capture.json`, `skill-orientation-live-capture-rerun.json`, `skill-orientation-live-verdicts.json`.
Debug: `charness-artifacts/debug/2026-06-19-skill-live-bash-permission-mode.md`.
Prior: `charness-artifacts/eval-trust/2026-06-19-behavior-eval-live-proven.md`, `2026-06-19-skill-surface-judge-convergence.md`.
