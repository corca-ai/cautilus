# Debug Review: skill-orientation live proof fails a sound Korean orientation on English-only required summary fragments
Date: 2026-06-20

## Problem

A fresh `npm run proof:skill-orientation:live` run forced a behaviorally sound no-input orientation to `outcome=failed`, because the case requires the English summary fragments `adapter` and `next branch` while the live agent correctly summarized in Korean (`어댑터`, `다음 분기`) per this repo's CLAUDE.md "Speak to this user in Korean" rule.

## Correct Behavior

Given the no-input orientation case (`execution-cautilus-no-input-claim-discovery-status`),
when a real agent runs the SKILL.md-prescribed `./bin/cautilus doctor status --repo-root . --json`, summarizes adapter state, claim state, scan scope, and next-branch options, and stops at branch selection,
then the grader must pass regardless of the natural language the summary is written in, because the case asserts orientation CONTENT (the state was read and summarized, escalation was avoided), not an English surface string.
Observed fact vs assumption: it is an observed fact that the live capture ran `doctor status` and summarized every required state slice and held at branch selection; the assumption baked into the fixture is that the summary will be written in English.

## Observed Facts

- Verbatim grader output (capture `~/.cache/tmp/skill-orientation-live-rTvDQx/observed.json`): `Expectation failure: summary missing required fragment: adapter; summary missing required fragment: next branch.`
- The same capture's own `summary` (Korean) records that the agent called `charness:find-skills`, invoked `cautilus-agent`, ran `./bin/cautilus doctor status --repo-root . --json`, read the `cautilus.agent_status.v1` packet, summarized binary health, adapter (`어댑터(found+valid)`), claim state (`claim state(398 후보, 144 satisfied …)`), scan scope, and the four next branches (`다음 분기 4개 …`), and stopped before branch selection — a sound orientation.
- `requiredCommandFragments: ["doctor status"]` matched (the command actually ran); only `requiredSummaryFragments` failed.
- Of `requiredSummaryFragments: ["adapter", "claim", "next branch"]`, only `claim` matched, because the agent wrote `claim state` in English while `adapter` → `어댑터` and `next branch` → `다음 분기` were Korean.
- In the graded cases file `fixtures/eval/dev/skill/live/skill-orientation-live-cases.json`, `forbiddenSummaryFragments` already carries bilingual entries (`첫 bounded run`, `eval 실행`) but `requiredSummaryFragments` is English-only — the asymmetry is the bug.
- telemetry: `claude-sonnet-4-6`, 1/1 run failed, `sampling.stable=true`, `cost_usd≈0.385`, `duration_ms≈99834`.
- Same session, the sibling live proofs PASSED on fresh captures: `proof:behavior-eval:live` (oriented on AGENTS.md, routed to `charness:find-skills`) and `proof:improve:live` (seed held-out score 0, winning candidate 100).

## Reproduction

1. `npm run proof:skill-orientation:live` (drives live `cautilus-agent`, claude_code backend, Sonnet) in this repo, where CLAUDE.md instructs Korean responses.
2. The agent runs `./bin/cautilus doctor status --repo-root . --json`, summarizes all required state in Korean, and holds at branch selection.
3. Observed `EXIT=1`, `outcome=failed`, summary appended with `summary missing required fragment: adapter; summary missing required fragment: next branch`.

## Candidate Causes

- The `requiredSummaryFragments` are English literals while the repo's CLAUDE.md mandates Korean output, so a faithful Korean summary lacks the English tokens. (Confirmed — the two missing fragments are exactly the ones the agent expressed in Korean; `claim`, written in English, matched.)
- A genuine behavior regression: the agent stopped reading the status, escalated, or skipped state. (Rejected — the capture summary shows a complete, read-only, hold-at-branch orientation; `requiredCommandFragments` and the escalation `forbiddenCommandFragments` all passed.)
- The English assumption was never exercised before: the deterministic replay and the operator-witnessed capture used for projection were English, so the English literals only met Korean live text on a fresh re-run. (Confirmed — the same dead-until-live pattern as the 2026-06-19 command-fragment sibling.)

## Hypothesis

If the orientation summary expectation matched the orientation content language-independently — bilingual fragments, an intent judge over the summary, or asserting on the structured `doctor status` packet/action log instead of an English surface string — the sound Korean capture would pass while a real escalation or skipped-state regression would still fail.

## Verification

- The capture summary contains the Korean `어댑터` and `다음 분기` and the English `claim`; the two failed fragments are precisely the two expressed in Korean, and the one that matched is the one written in English — language is the sole discriminator.
- `requiredCommandFragments: ["doctor status"]` matched and every `forbiddenCommandFragments`/`forbiddenSummaryFragments` escalation guard passed, so the only failing dimension is the English-literal required summary fragments.
- The graded cases file's `forbiddenSummaryFragments` already lists Korean variants, proving the suite knows the agent answers in Korean — the required list simply was not updated to match.

## Root Cause

`requiredSummaryFragments: ["adapter", "claim", "next branch"]` asserts English surface strings against a summary the repo's CLAUDE.md requires to be Korean, so a behaviorally correct orientation is graded `failed` for `adapter`/`next branch` not appearing in English.
The English assumption survived because every prior execution path — fixture-mode dogfood and the projected operator-witnessed capture — was English, so a fresh Korean live capture is the first text the required fragments ever met.
This is the summary-fragment sibling of the 2026-06-19 command-fragment incident on the same case: a single-surface literal matcher standing in for a semantic orientation check.

## Invariant Proof

- Invariant: an orientation summary expectation must assert on the semantic state that was summarized, not on a single natural-language rendering of it; pass/fail must be invariant to the repo's configured output language.
- Producer Proof: the live runner captured a summary that read and reported adapter, claim, scan, and next-branch state and held at branch selection (in Korean).
- Final-Consumer Proof: the English-literal `requiredSummaryFragments` matcher rejected that producer output, so the grader is not a faithful final consumer of the orientation behavior — producer-correct, consumer-brittle.
- Interface-Shape Sibling Scan: the identical English-only `["adapter", "claim", "next branch"]` required list appears in `fixtures/eval/dev/skill/live/skill-orientation-live-cases.json`, `skill-judge-eval-cases.json` (x2), `cautilus-skill-routing.fixture.json`, and `internal-runner-cases.json`; all share the defect.
- Non-Claims: fixture-mode behavior is unchanged (summary text is the fixture's own English prose); this is only a live-capture honesty gap.

## Detection Gap

- skill-orientation grader / standing gate | the deterministic standing gate (`test:on-demand`) replays the operator-witnessed ENGLISH capture and never exercises a fresh Korean live summary, and no lint asserts the orientation grader is robust to the repo's configured output language, so the English-only required fragments never fired until a paid live re-run | smallest change to fire it: assert orientation via the structured `doctor status` packet/action log or an intent judge (language-independent), or add a fixture lint that orientation `requiredSummaryFragments` cover the repo's configured non-English output language the way `forbiddenSummaryFragments` already does (follow-up: skill-orientation-summary-language-robust-grader).

## Sibling Search

- Mental model: "the agent's orientation summary will be written in English", contradicted by the repo's own CLAUDE.md Korean-output rule that the same fixture's `forbiddenSummaryFragments` already accounts for.
- same-file axis: `skill-orientation-live-cases.json` `forbiddenSummaryFragments` (bilingual) vs `requiredSummaryFragments` (English-only) | decision: the required list is the brittle sibling; the `accept-now` token in other cases is a language-neutral CLI recommendation and is not brittle | proof: live capture matched `accept-now`-class tokens historically, failed only the prose fragments.
- cross-file: `skill-judge-eval-cases.json:14,26`, `cautilus-skill-routing.fixture.json:33`, `internal-runner-cases.json:29` carry the identical English-only required list | decision: same class, fix together in the repair slice | proof: grep sibling scan.
- other-surface axis: the reasoning-soundness judge and the blind intent judges are LLM-graded and language-robust by construction | decision: no change; they are the robust alternative the fix should lean on | proof: read.
- follow-up: skill-orientation-summary-language-robust-grader — make orientation grading language-independent (intent judge or packet/action-log assertion) and lint single-language required summary fragments across the skill suites.

## Seam Risk

- Interrupt ID: skill-orientation-live-summary-language-2026-06-20
- Risk Class: repeated-symptom
- Seam: behavior-steering skill-eval fixture matcher on the no-input orientation case, repo-local, backing the apex "Behavior Evaluation — proven (live-replayed)" badge's dev/skill live re-runnability (the 2026-06-19 command-fragment incident hit the same case and matcher family)
- Disproving Observation: the fresh live Korean capture disproves the English-literal assumption; the deterministic English replay cannot observe it
- What Local Reasoning Cannot Prove: whether other repos that consume the cautilus-agent suite with a different configured output language hit the same matcher brittleness
- Generalization Pressure: factor-now

## Interrupt Decision

- Critique Required: yes
- Next Step: spec
- Handoff Artifact: charness-artifacts/spec/2026-06-20-skill-orientation-grader-language-robustness.md

## Prevention

Make the orientation grader language-independent — assert on the structured `doctor status` packet / action log and/or an intent judge over the summary, rather than English surface literals — so a sound orientation passes in any configured output language while real escalation or skipped-state regressions still fail; as an interim, mirror the bilingual coverage that `forbiddenSummaryFragments` already has into `requiredSummaryFragments` across all four skill suites; and add a fixture lint that flags single-language required summary fragments on orientation cases (follow-up: skill-orientation-summary-language-robust-grader). The maintainer decides the grader direction and whether the dev/skill live re-runnability gap changes the "Behavior Evaluation" badge wording before the fix lands.

## Related Prior Incidents

- `2026-06-19-skill-no-input-command-fragment.md`: same case (`execution-cautilus-no-input-claim-discovery-status`) and same fixtures, where `requiredCommandFragments` named a non-existent `agent status`; this incident is the `requiredSummaryFragments` language sibling of that same single-surface-literal-versus-semantic-check defect.
- `2026-06-20-improve-live-case-prompt-spoonfeeds-orientation.md`: same orientation scenario on the improve surface.
- `2026-06-19-skill-live-bash-permission-mode.md`: the prior live-orientation environment incident that the skill-orientation proof header already references.
