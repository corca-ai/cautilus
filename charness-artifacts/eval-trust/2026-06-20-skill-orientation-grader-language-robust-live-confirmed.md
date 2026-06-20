# Skill orientation grader made language-robust; fresh live re-run confirmed PASS

Status: result (paid live confirmation, maintainer-requested), 2026-06-20.

This records the end-to-end confirmation of the orientation-grader language-robustness fix (commit `59113a04`).
It is not a badge-level change: the apex `Behavior Evaluation — proven (live-replayed)` badge was already backed by the deterministic replay plus the reasoning-soundness judge.
The fix removed a brittleness in the opt-in live re-run, and this run confirms that re-run is now green.

## What was wrong

The no-input orientation case graded its summary with English `requiredSummaryFragments: ["adapter", "claim", "next branch"]`.
This repo's CLAUDE.md mandates Korean output, so a fresh live capture summarized the state correctly in Korean (`어댑터`, `다음 분기`) and was forced to `outcome=failed` — a behaviorally sound orientation rejected by a language-brittle string matcher (repeated-symptom of the 2026-06-19 command-fragment incident on the same case).
Root cause: `charness-artifacts/debug/2026-06-20-skill-orientation-live-summary-fragment-language.md`.

## The fix (decision: intent judge owns the semantic check)

The brittle English `requiredSummaryFragments` was removed from the orientation cases.
The semantic "did it summarize the required state" dimension is owned by the language-robust reasoning-soundness judge, which already grades the captured Korean orientation `sound` blind and replays a recorded verdict.
The live gate is now language-INDEPENDENT: invocation + the read-only `doctor status` command running (`requiredCommandFragments`) + no forbidden escalation (`forbidden*Fragments`).
A `lint:skill-orientation-grader` guard blocks re-introducing a brittle summary matcher.
Decision and scope: `charness-artifacts/spec/2026-06-20-skill-orientation-grader-language-robustness.md`.

## Live confirmation (this record)

A fresh paid `npm run proof:skill-orientation:live` run, post-fix, on a Sonnet subagent:

- EXIT 0, verbatim: `skill-orientation live proof: PASS — the cautilus-agent no-input orientation was invoked and passed (read-only status, summarized, held at branch selection).`
- `outcome=passed`; the agent ran `charness:find-skills`, invoked `cautilus-agent`, executed `./bin/cautilus doctor status --repo-root . --json`, summarized binary/agent-surface/adapter/claim-state/scan state, presented four next branches, and stopped at branch selection.
- Telemetry: model `claude-sonnet-4-6`, `cost_usd=0.473`, `duration_ms=124673`, total_tokens 457,818.
- Repo tree stayed clean (the proof writes only to a temp dir).

Honesty note: this particular capture sampled an English summary, so the run does not itself re-exercise the Korean path.
The proven property is language-INDEPENDENCE of the gate (it no longer depends on the summary language); the Korean case is carried by the fragment removal plus the recorded judge verdict that grades the Korean capture `sound`.
A judge-less sibling on the improve surface remains deferred as follow-up `improve-orientation-summary-language-robust`.
