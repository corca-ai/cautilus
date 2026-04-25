# Cautilus Handoff

## Workflow Trigger

다음 세션의 기본 pickup은 `charness:find-skills`로 설치된 스킬 지도를 먼저 재확인한 뒤, [docs/master-plan.md](../master-plan.md)의 `Immediate Next Moves`에서 evidence가 축적된 슬라이스를 고르는 것이다.
첫 행동은 `git status --short`로 live worktree를 확인하는 것이고, 그 다음 이 handoff의 `Next Session` 섹션을 읽는다.
이 handoff는 mention-only pickup 기준 문서이며, handoff adapter는 `docs/internal/handoff.md`를 canonical artifact로 해석한다.

## Current State

- Cautilus `v0.13.0`이 게시됐다 ([release](https://github.com/corca-ai/cautilus/releases/tag/v0.13.0)).
  release-artifacts / verify-public-release / install-sh smoke 모두 green.
  세부 기록은 [charness-artifacts/release/latest.md](../../charness-artifacts/release/latest.md).
- `evaluation-surfaces` 재설계의 두 번째 슬라이스(`repo / skill` preset)가 들어왔다 — [docs/specs/evaluation-surfaces.spec.md](../specs/evaluation-surfaces.spec.md).
  - `cautilus.evaluation_input.v1`이 `surface=repo, preset=skill`을 받아 기존 `cautilus.skill_test_cases.v1` 케이스 슈트로 번역한다.
  - `cautilus eval test`는 `eval_test_command_templates`을 통해 `run-local-skill-test.mjs`-style 러너를 그대로 재사용한다.
  - `cautilus eval evaluate`는 입력 packet의 schemaVersion으로 `BuildEvaluationSummary` 또는 `BuildSkillEvaluationSummary`를 dispatch한다.
- `cautilus skill test/evaluate`는 별칭 없이 잘렸다.
  사라진 것: 해당 두 CLI 커맨드, `skill_test_command_templates` / `skill_cases_default` adapter slot, `{skill_id}` / `{skill_cases_file}` / `{skill_eval_input_file}` placeholder, `skillEvaluateExampleInput`, `fixtures/skill-test/`, `fixtures/skill-evaluation/`, `self-dogfood-skill-test.yaml` adapter, Node 측 schema validation tests.
  내부 Go 헬퍼 `BuildSkillEvaluationSummary`와 `NormalizeSkillTestCaseSuite`는 새 surface의 mechanics로 그대로 남아 있다.
  마이그레이션 트래킹: [corca-ai/cautilus#32](https://github.com/corca-ai/cautilus/issues/32).
- self-dogfood adapter는 `.agents/cautilus-adapters/self-dogfood-eval-skill.yaml`로 새 이름으로 들어갔다.
  새 fixture는 `fixtures/eval/skill/cautilus-skill-routing.fixture.json`.
  Node-side runner test용으로 `fixtures/eval/skill/internal-runner-cases.json` + `internal-runner-fixture-results.json`도 함께 옮겼다.
- 잔여 신호: `repo/skill` 슬라이스에서는 real-codex/claude로 cautilus 자체 dogfood eval을 돌린 evidence를 아직 수집하지 않았다.
  `charness-artifacts/cautilus/latest.md` refresh도 함께 미뤘다 — 다음 슬라이스 작업 중 자연스럽게 닿을 때 수집한다.
- premortem 후 deferred: (a) 결과 packet의 surface-agnostic 필드 (`provider`, `model`, `harness`, `mode`, `durationMs`, `costUsd?`) emission은 `app` 슬라이스에서 통일적으로 정착시킬 예정 — spec § Result packet 문장이 surface-agnostic처럼 읽히는 부분은 `app` 슬라이스 시점에 명시적으로 분리하거나 채운다. (b) `cautilus eval evaluate` 디스패처는 입력 packet의 `schemaVersion`만 보고 라우팅한다; fixture preset과의 cross-check는 hardening 항목으로 follow-up. (c) Node 측 `scripts/agent-runtime/evaluate-skill.mjs`와 동반 `skill-evaluation-{normalizers,runs,summary}.mjs` 모듈은 self-test와 coverage floor에만 의해 살아있다 — 별도 dead-code sweep slice에서 정리.
- premortem B1 fix nuance: `cautilus adapter init --scenario skill` scaffold에서 auto-resolved `evaluation_input_default` 트랩은 제거했지만, 대체된 `eval_test_command_templates` 라인 (`cautilus eval test ... --fixture fixtures/eval/skill/example.fixture.json`)은 여전히 사용자가 교체할 placeholder 템플릿이다 (chatbot/workflow scaffold가 `{chatbot_input_file}` placeholder를 쓰는 것과 같은 패턴). 첫 실행은 honest-fail로 떨어지지만 ready-to-run은 아니다 — scaffold가 실제로 런하려면 사용자가 본인 러너 커맨드와 fixture 경로로 교체해야 한다.
- 잔여 신호 (이전 슬라이스에서): 현재 fixture는 `expectedRouting: { selectedSkill: "none" }`을 기대하지만 real-codex로 cautilus 실제 AGENTS.md를 돌리면 `reject`가 난다.
  fixture 기대치 vs. 실제 AGENTS.md routing 사이 정직성 결정이 필요하다.

## Next Session

1. `git status --short`로 사용자 변경 여부를 먼저 확인한다.
2. `charness:find-skills`로 설치된 public / support / integration 스킬 지도를 한 번 갱신한다.
3. spec [§ First Implementation Slice](../specs/evaluation-surfaces.spec.md)의 follow-up 2번 — `app / chat` preset 슬라이스로 진입.
   기존 `cautilus mode evaluate` chatbot 모드를 새 surface 아래로 옮기고, 같은 cutover 패턴(no backward compat)으로 정리.
   `app` surface는 messaging runtime이므로 fixture가 system prompt + `messages: [...]`를 carry하고 provider stance는 fixture-level model pin.
4. `charness:impl`로 들어가되 spec이 이미 명시한 follow-up 순서를 따른다.

## Discuss

- runtime fingerprint의 두 번째 슬라이스 (automatic prior-evidence selection, provider API 연동)를 언제 시작할지.
- `app / chat` preset 진입 시점에 `mode evaluate` chatbot 모드를 동시에 cut할지, 단독 슬라이스로 분리할지.
- `archetype-boundary.spec.md` retire는 spec follow-up 5번. 모든 preset 출시 후 한 번에 정리할지, 더 빨리 끊을지.
- 잔여 신호의 fixture vs. AGENTS.md 정직성 결정 — `app / chat` 슬라이스 작업 중 자연스럽게 닿을 수 있음.
- `repo/skill` 슬라이스에 대한 self-dogfood real-codex/claude 증거 수집 시점.

## References

- [docs/master-plan.md](../master-plan.md)
- [docs/specs/evaluation-surfaces.spec.md](../specs/evaluation-surfaces.spec.md)
- [docs/contracts/runtime-fingerprint-optimization.md](../contracts/runtime-fingerprint-optimization.md)
- [docs/contracts/scenario-history.md](../contracts/scenario-history.md)
- [corca-ai/charness#66](https://github.com/corca-ai/charness/issues/66) — ideation/spec의 enum-axis consistency 점검 제안 (여전히 열려 있음)
