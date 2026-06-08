# Slice 3 Proposal: a trusted dev/repo routing fixture (co-creation, awaiting operator agreement)

Status: PROPOSAL — not applied. The real fixture is unchanged until the operator agrees (mutual-agreement gate).
Goal: charness-artifacts/goals/2026-06-09-clear-proof-debt-live-proven.md (slice 3).
Date: 2026-06-09.

## Why this exists

The operator's standing distrust ("the proof rests on fixtures I did not confirm") is mechanized in this exact fixture.
The checked-in deterministic stand-in `fixtures/eval/dev/repo/internal-runner-fixture-results.json` is **hand-authored** and diverges from a **real captured codex run** that exists in the repo, on multiple fields — including a `firstToolCall` path (`python3 .../find-skills/.../list_capabilities.py`) whose `...` placeholder never actually ran.

The headline behavior is real: the live run confirms the agent reads `AGENTS.md` first, then routes to `find-skills` then `impl`.
But the deterministic proof stands on a hand-authored stand-in, not the real observation.

## Evidence: hand-authored stand-in vs real capture

Real capture: `artifacts/self-dogfood/dev-repo-self-dogfood/latest/eval-test/checked-in-agents-routing/result.json` (codex, 2026-05-04).
The operator can audit it directly (it ships `prompt.md`, `result.stderr`, `schema.json` alongside).

| field | hand-authored fixture | real codex capture (2026-05-04) |
| --- | --- | --- |
| bootstrapHelper | `find-skills` | `charness:find-skills` |
| workSkill | `impl` | `charness:impl` |
| selectedSkill | `cautilus` | `charness:impl` |
| firstToolCall | `python3 .../find-skills/.../list_capabilities.py` (`...`, never ran) | `functions.exec_command` |
| loadedInstructionFiles | `[AGENTS.md]` | `[AGENTS.md, handoff.md, <find-skills SKILL.md>]` |
| loadedSupportingFiles | `[handoff.md]` | `[]` |
| summary language | English | Korean (the real agent's actual output) |

## Proposed trusted fixture result (cleaned from the real capture)

Replace `fixtures/eval/dev/repo/internal-runner-fixture-results.json` with the real observation, cleaned of machine/version-specific noise:

```json
{
  "checked-in-agents-routing": {
    "observationStatus": "observed",
    "summary": "첫 진입 지침은 AGENTS.md였다. 그 다음 docs/internal/handoff.md를 읽어 다음 세션 픽업 규칙과 현재 슬라이스 후보를 확인했고, bootstrap helper로 `charness:find-skills`, durable work skill로 `charness:impl`을 선택하는 것이 정직한 첫 라우팅이다.",
    "entryFile": "AGENTS.md",
    "loadedInstructionFiles": ["AGENTS.md", "docs/internal/handoff.md", "find-skills/SKILL.md"],
    "loadedSupportingFiles": [],
    "routingDecision": {
      "selectedSkill": "charness:impl",
      "bootstrapHelper": "charness:find-skills",
      "workSkill": "charness:impl",
      "selectedSupport": "none",
      "firstToolCall": "functions.exec_command",
      "reasonSummary": "루트 지침이 먼저 AGENTS.md를 요구했고, 그 안의 Skill Routing이 startup에서 `find-skills`를 먼저 호출하라고 명시했다. handoff는 다음 세션 기본 pickup을 `find-skills` 재확인 뒤 슬라이스 선택으로 정의하므로 bootstrap은 `charness:find-skills`, 실제 구현 작업의 지속 스킬은 `charness:impl`이다."
    }
  }
}
```

### Cleaning decisions (each needs operator agreement)

1. `loadedInstructionFiles[2]`: real value was `/home/hwidong/.codex/plugins/cache/local/charness/0.5.16/skills/find-skills/SKILL.md` — machine path + pinned version `0.5.16`. Normalized to a stable `find-skills/SKILL.md`. (Alternative: drop it entirely; keep only AGENTS.md + handoff.md.)
2. `summary` / `reasonSummary`: kept the real agent's Korean text verbatim (fixtures are observation data, not English-doc prose). (Alternative: translate to English for reviewer reach.)
3. Namespace: recorded as-observed (`charness:find-skills`, `charness:impl`). The scorer does NOT auto-strip namespace, so the fixture's `expectedRouting` must change to match (next section).

## Proposed expectedRouting change (decision C)

`fixtures/eval/dev/repo/checked-in-agents-routing.fixture.json` currently expects bare names:

```json
"expectedRouting": { "bootstrapHelper": "find-skills", "workSkill": "impl" }
```

Because the scorer compares without namespace normalization, change expected to match what the agent really emits:

```json
"expectedRouting": { "bootstrapHelper": "charness:find-skills", "workSkill": "charness:impl" }
```

Also remove the dead `allowedFirstToolCalls` entry `python3 .../find-skills/.../list_capabilities.py --repo-root .` (the `...` never matches a real call; the real first call `functions.exec_command` is already in the list).

## Open decisions (operator)

- (A) Start the co-creation from this flagship (swap in the real capture), or pick a different first behavior to protect? — recommended: this flagship (canonical dogfood, smallest, evidence in hand).
- (B) Hard criterion for "trusted": a recorded observation MUST come from a real captured run, cleaned of machine/version noise — no hand-authoring. — recommended: yes; it is the operator's originating requirement.
- (C) Namespace convention: record + expect as-observed (`charness:*`) vs normalize the scorer to treat `find-skills == charness:find-skills`. — recommended: as-observed now (smaller change, more honest); a scorer normalization is a separate improve target.

## After agreement

1. Apply the two file changes above (result stand-in + expectedRouting), commit.
2. Wire/confirm the deterministic dev/repo re-run (the `dev-repo-self-dogfood` adapter reports "adapter does not define an eval runner" — the instruction-surface runner path must be confirmed so the proof is re-runnable, not just a static file).
3. Project that trusted proof into `docs/specs/user/evaluation.spec.md`, asserting on it, with a badge that claims only the packet's self-reported `proofClass`.
