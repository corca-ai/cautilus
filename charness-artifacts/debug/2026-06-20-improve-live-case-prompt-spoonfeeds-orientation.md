# Debug Review: improve-live held-out case prompt spoon-feeds the orientation recipe, so SKILL.md is not load-bearing
Date: 2026-06-20

## Problem

In the live Bounded Improvement proof calibration, a degraded cautilus-agent SKILL.md control (the current SKILL.md with the No-Input Orientation discipline replaced by an escalation directive) still PASSES the held-out orientation case, identically to the good SKILL.md.
With no good-vs-degraded differential, the live improve loop has no honest failure to recover, so the proof cannot demonstrate a held-out win.

## Correct Behavior

Given the held-out orientation scenario `execution-cautilus-no-input-claim-discovery-status`,
when the cautilus-agent runs it with the GOOD SKILL.md it should PASS (read `doctor status`, summarize adapter/claim/next-branch, hold at branch selection),
and when it runs with the DEGRADED control it should FAIL (skip `doctor status`, escalate to `doctor --next-action` / a first bounded run),
so that the SKILL.md content is what determines the held-out outcome.

## Observed Facts

- Calibration (`/tmp/improve-calibration.sh`, live codex `gpt-5.4-mini`, read-only, single case) ran GOOD then DEGRADED in a worktree-at-HEAD with the degraded control copied over `skills/cautilus-agent/SKILL.md`.
- GOOD eval-summary: `recommendation: accept-now`, 1 passed. Summary: ran `./bin/cautilus doctor status --repo-root . --json`, summarized binary/adapter/claim/scan/next-branches, held at branch selection.
- DEGRADED eval-summary: `recommendation: accept-now`, 1 passed. Summary: read the orientation packet from `cautilus doctor status ... --json`, summarized adapter/claim/scan/next-branches, "I stopped at branch selection as requested."
- `grep` of the degraded `result.json` shows `doctor status` ran (1×), and no `--next-action` / `first bounded run` / `eval readiness`.
- The case prompt (verbatim, `fixtures/eval/dev/skill/improve/skill-orientation-improve.fixture.json`, copied from `cautilus-skill-routing.fixture.json` case 3): "Use $cautilus-agent with no more task detail on this repo. Treat this as a first-touch orientation run: read the Cautilus status packet, summarize adapter state, claim state, scan scope, and next branch options, then stop at branch selection."

## Reproduction

1. Worktree at HEAD; `evaluate fixture --adapter-name self-dogfood-improve-skill` (live codex) on the good repo → passed.
2. Copy `fixtures/eval/dev/skill/improve/degraded-orientation-skill.md` over `skills/cautilus-agent/SKILL.md` in the worktree; rerun → still passed.
3. Both runs ran `doctor status` and held at branch selection.

## Candidate Causes

- The case prompt itself enumerates the orientation recipe ("read the Cautilus status packet, summarize adapter state, claim state, scan scope, and next branch options, then stop at branch selection"), so the agent follows the explicit request and never consults the SKILL.md No-Input Orientation discipline. (Confirmed.)
- `cautilus init --overwrite` materializes the agent surface from the embedded binary copy rather than the worktree `skills/cautilus-agent/SKILL.md`, so the degraded source is ignored. (Rejected: the GOOD run's summary cites the exact orientation discipline behavior, and the degraded run's summary is behaviorally identical to the case prompt, not to the degraded directive — the agent demonstrably read a skill, but the prompt overrode the SKILL.md branch policy. The materialization path is not the differentiator here.)
- codex `gpt-5.4-mini` is "too capable" and orients correctly regardless of instructions. (Rejected as primary: the degraded directive is explicit; a capable model would follow the most specific instruction, which here is the spoon-feeding case prompt, not the model's own judgment.)

## Hypothesis

If the held-out case prompt is reduced to a genuinely minimal no-input invocation ("Use $cautilus-agent with no more task detail on this repo.") with the same deterministic matchers, then the SKILL.md No-Input Orientation discipline becomes the only source of the orientation recipe: the good SKILL.md should PASS and the degraded control should FAIL (skip `doctor status`, escalate to `--next-action` / first bounded run), restoring the differential.

## Verification

Pending: re-run the same calibration with the minimal prompt and confirm GOOD passes and DEGRADED fails.
This is recorded as the next step before the fix is treated as proven.

## Root Cause

The held-out case prompt was inherited from `cautilus-skill-routing.fixture.json` case 3, which spoon-feeds the orientation recipe so the case validates "can the agent orient when told how" rather than "does the SKILL.md make the agent orient." For an improve proof where SKILL.md is the mutation target, the prompt must withhold the recipe so the prompt-under-test is load-bearing.

## Invariant Proof

- Invariant: a held-out eval that gates a prompt mutation must be sensitive to the prompt-under-test — the same input through a degraded prompt must produce a worse graded outcome.
- Producer Proof: degraded SKILL.md control exists and is behaviorally distinct on paper (escalation vs orientation).
- Final-Consumer Proof: NOT yet satisfied — the held-out grader returned `passed` for both prompts, proving the consumer (the case) is insensitive to the producer (SKILL.md). The minimal-prompt fix targets exactly this consumer insensitivity.
- Interface-Shape Sibling Scan: the same spoon-feeding prompt lives in `cautilus-skill-routing.fixture.json:32` and `skill-orientation-live-cases.json` (the PROVEN behavior-eval surface); those gate "orientation when asked" by design and are out of scope for this fix, but they share the limitation that SKILL.md is not load-bearing under them.
- Non-Claims: this does not claim the proven dev/skill behavior-eval badge is wrong; it claims that surface's prompt is not suitable as an improve-mutation gate.

## Detection Gap

- Detection surface: the improve-proof calibration step (good-vs-degraded differential) is exactly what fired and caught this before any badge flip. Without the calibration gate, the full live search would have run and the seed would have "passed" → search blocked/uninformative, or worse, a false win narrative.
- Smallest change to fire earlier: keep the calibration differential check as a mandatory precondition inside the proof harness (the harness already asserts the seed must fail before trusting a win), so the insensitivity surfaces deterministically rather than only in manual calibration.

## Sibling Search

- Mental model (wrong): "the case prompt is just the invocation; SKILL.md supplies the behavior." Reality: an explicit case prompt can fully specify the behavior and override SKILL.md.
- content axis: `fixtures/eval/dev/skill/improve/skill-orientation-improve.fixture.json` prompt | decision: FIX (minimal prompt) | proof: calibration re-run.
- sibling (out of scope): `cautilus-skill-routing.fixture.json:32`, `skill-orientation-live-cases.json` | decision: LEAVE (they gate orientation-when-asked by design) | proof: n/a.
- cross-file: the improve harness `scripts/on-demand/improve-live-proof.mjs` already encodes the differential as an invariant (seed must fail) — keep that as the structural guard.
- follow-up: none required outside this slice.

## Seam Risk

- Interrupt ID: improve-live-spoonfeed-2026-06-20
- Risk Class: prompt-surface sensitivity
- Seam: live agent grading of a prompt-under-test; the grader must be sensitive to the mutated file.
- Disproving Observation: a degraded prompt that still passes proves the gate is prompt-insensitive.
- What Local Reasoning Cannot Prove: that the minimal prompt actually flips the degraded outcome — only a live re-run can.
- Generalization Pressure: any future "improve a prompt X" proof must use a held-out scenario whose prompt does NOT restate X's contract.

## Interrupt Decision

- Critique Required: no (single-file fixture prompt fix; the harness already guards the differential and a critique is scheduled for the badge flip)
- Next Step: impl (apply minimal-prompt fix, re-calibrate)
- Handoff Artifact: this debug record

## Prevention

Keep the harness invariant that the seed control MUST fail the held-out scenario before any win is trusted (already implemented in `assertImproveLiveInvariant` + the seed-fail guard in `runLiveImproveLoop`). For improve proofs, choose held-out prompts that withhold the contract of the prompt-under-test.

## Related Prior Incidents

- `2026-06-19-skill-no-input-command-fragment.md`: same held-out case; fixed a stale required command fragment (`agent status` → `doctor status`). Confirms `doctor status` is the correct orientation command this fix's matchers depend on.
- `2026-06-19-skill-live-bash-permission-mode.md`: claude headless needs `bypassPermissions` to run the read-only `doctor status`; informs the adapter's claude permission mode (codex path used here is unaffected).
