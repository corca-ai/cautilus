# Cautilus Handoff

## Workflow Trigger

다음 세션의 기본 pickup은 `charness:find-skills`로 설치된 스킬 지도를 먼저 재확인한 뒤, [docs/master-plan.md](../master-plan.md)의 `Immediate Next Moves`에서 evidence가 축적된 슬라이스를 고르는 것이다.
첫 행동은 `git status --short`로 live worktree를 확인하는 것이고, 그 다음 이 handoff의 `Next Session` 섹션을 읽는다.
이 handoff는 mention-only pickup 기준 문서이며, handoff adapter는 `docs/internal/handoff.md`를 canonical artifact로 해석한다.

## Current State

- Cautilus `v0.13.0` 게시 상태 그대로 ([release](https://github.com/corca-ai/cautilus/releases/tag/v0.13.0)).
  release-artifacts / verify-public-release / install-sh smoke 모두 green.
  세부 기록은 [charness-artifacts/release/latest.md](../../charness-artifacts/release/latest.md).
- `evaluation-surfaces` 재설계의 **`mode evaluate` cut + archetype-boundary retire 슬라이스**가 2026-04-26에 들어왔다 — [docs/specs/evaluation-surfaces.spec.md](../specs/evaluation-surfaces.spec.md).
  - `cautilus mode evaluate` CLI 표면 제거: router/handler/parser, 전용 헬퍼, 6개 `TestCLIModeEvaluate*` 모두 잘림.
  - `iterate / held_out / comparison / full_gate _command_templates` 어댑터 슬롯과 `*_samples_default` 정수 슬롯 모두 제거; `applyScenarioOverlay`의 chatbot/workflow 분기 제거 (skill 분기는 `cautilus eval test` 시드를 위해 유지).
  - `internal/contracts/constants.go`의 `AdapterModeEvaluationPacketSchema` 제거.
  - `internal/cli/command-registry.json`의 `mode evaluate` 항목 제거.
  - Node 측: `evaluate-adapter-mode.{mjs,test.mjs}`, `mode-evaluation-summary.{mjs,test.mjs}`, `run-self-dogfood{,-experiments}.mjs`와 그 on-demand 테스트, `self-dogfood-experiment-prompt.{mjs,test.mjs}` 모두 삭제. `dogfood:self` / `dogfood:self:experiments` npm 스크립트 제거; `dogfood:self:eval`만 유지.
  - `optimizeSearchEvaluateCandidate`와 `optimizeSearchRunFullGateCheckpoint` 둘 다 honest-skip(`status=skipped`, `skipReason=surface_unavailable`).
    optimize-search 후보 차등에 사용하던 held-out 신호가 사라져 mutation 후보들은 seed로 collapse — 의도된 진실. 6개 `TestCLIOptimizeSearchRun*`(mutation/merge 차등 가정) 삭제, 새 `TestCLIOptimizeSearchRunHonestSkipsHeldOutAndFullGateAfterModeEvaluateCut` 한 개로 honest-skip 어서션 정착.
  - 운영-페이싱 docs / examples / 스킬 미러 모두 새 어휘로 정렬: README, master-plan, cli-reference, contracts/{adapter-contract, active-run, reporting, scenario-results, scenario-history}, guides/{evaluation-process, consumer-adoption}, maintainers/{operator-acceptance, consumer-readiness}, examples/adapter.example.yaml, examples/starters/{chatbot, skill, workflow}/cautilus-adapter.yaml, skills/cautilus/{SKILL.md, references/*}, plugins/cautilus/skills/cautilus/* 미러.
  - **archetype-boundary retire 동시 처리** (decision 3 b): `docs/specs/archetype-boundary.spec.md` 삭제. AGENTS.md / CLAUDE.md / README.md / master-plan.md / docs/specs/index.spec.md 모두 evaluation-surfaces.spec.md를 가리키도록 갱신. `scripts/check-archetype-completeness.mjs`는 spec 의존을 끊고 `scenario normalize` 런타임-완결성 체크만 유지 — `npm run lint:archetypes` green.
- `cautilus eval test` / `eval evaluate`의 `repo/whole-repo`, `repo/skill`, `app/chat` preset은 그대로 유지. `app/chat`의 cross-runtime equivalence 필드(provider, model, harness, mode=`messaging`, durationMs, observed.messages, observed.finalText)도 evaluator 경계에서 강제됨.
- 잔여 신호: `repo/skill`/`app/chat` 모두 real-codex/claude self-dogfood 증거는 아직 없다.
  `charness-artifacts/cautilus/latest.md` refresh도 self-dogfood 재배선 슬라이스로 미룬다.
- 잔여 신호 (`repo/whole-repo`): 현재 fixture는 `expectedRouting: { selectedSkill: "none" }`을 기대하지만 real-codex로 cautilus 실제 AGENTS.md를 돌리면 `reject`가 난다.
  fixture 기대치 vs. 실제 AGENTS.md routing 사이 정직성 결정은 `app/chat` 후속 또는 별도 fixture 정직성 마이크로-슬라이스에서 처리.
- premortem deferral 상태:
  (a) Result packet surface-agnostic 필드 — `app/chat` evaluator에서 require로 명시 정착됨; `repo/whole-repo`/`repo/skill`로 backport는 후속 hardening 슬라이스에서.
  (b) `cautilus eval evaluate` 디스패처는 여전히 schemaVersion만으로 라우팅; fixture preset cross-check는 follow-up.
  (c) Node 측 `scripts/agent-runtime/evaluate-skill.mjs`와 동반 모듈은 self-test와 coverage floor에만 의해 살아있다 — dead-code sweep slice에서 정리.
  (d) **NEW** optimize-search held-out gating은 honest-skip 상태 — 새 surface 위로 재배선은 별도 슬라이스(아래 Next Session #4 참조).
  (e) **NEW** consumer onboarding smoke (`npm run consumer:onboard:smoke`)는 `doctor ready`까지만 검증; eval-test 기반 first bounded run으로 재배선은 별도 슬라이스.
- 마이그레이션 트래킹: [corca-ai/cautilus#32](https://github.com/corca-ai/cautilus/issues/32).

## Next Session

1. `git status --short`로 사용자 변경 여부를 먼저 확인한다.
2. `charness:find-skills`로 설치된 public / support / integration 스킬 지도를 한 번 갱신한다.
3. **spec follow-up #3 — `app / prompt` preset.**
   `cautilus.evaluation_input.v1`이 `surface=app, preset=prompt`를 받아 `cautilus.app_prompt_test_cases.v1` (또는 동등한) 케이스 슈트로 번역, `cautilus eval test`가 messaging-runtime 단일-턴 러너를 호출, 결과를 `cautilus.app_prompt_evaluation_inputs.v1`로 emit, `cautilus eval evaluate`가 해당 packet에 대해 `BuildAppPromptEvaluationSummary` 같은 dispatcher를 추가하는 흐름.
   `app/chat` 슬라이스 패턴을 그대로 따른다.
4. self-dogfood / consumer onboarding 재배선 — `cautilus eval test` 위로 `dogfood:self`(canonical)와 `consumer:onboard:smoke`의 first bounded run을 재구축.
   대상 fixture, 호출 시퀀스, `report.json` 대체 산출물(observed packet 기반)을 결정한다.
   optimize-search held-out 신호의 재배선도 같은 슬라이스 또는 직후 슬라이스에서 결정.
5. spec follow-up #4 — C2/C3/C4 composition primitives (extends / multi-step / snapshot), 슬라이스당 하나.
6. spec follow-up #5 — `scenario normalize` 재범위만 남음.
   archetype-boundary retire는 cut 슬라이스에 흡수됨.
7. fixture vs AGENTS.md 정직성 결정 (잔여 신호 — `repo/whole-repo`)을 `app/chat` 후속 또는 fixture 정직성 마이크로-슬라이스에서 처리.

## Discuss

- runtime fingerprint의 두 번째 슬라이스 (automatic prior-evidence selection, provider API 연동)를 언제 시작할지.
- self-dogfood / consumer onboarding 재배선 슬라이스에서 optimize-search held-out gating까지 같이 풀지, 별도 슬라이스로 분리할지.
- `dogfood:self:eval`이 현재 단일 entry point — tuning experiments(`dogfood:self:experiments`)에 해당하는 강한 클레임을 어떤 형태로 부활시킬지(예: 새 preset, 새 fixture 시리즈, 또는 그대로 폐기).
- premortem deferral (a)–(e) 중 어느 것을 다음 hardening 슬라이스로 묶을지.

## References

- [docs/master-plan.md](../master-plan.md)
- [docs/specs/evaluation-surfaces.spec.md](../specs/evaluation-surfaces.spec.md)
- [docs/contracts/runtime-fingerprint-optimization.md](../contracts/runtime-fingerprint-optimization.md)
- [docs/contracts/scenario-history.md](../contracts/scenario-history.md)
- [corca-ai/charness#66](https://github.com/corca-ai/charness/issues/66) — ideation/spec의 enum-axis consistency 점검 제안 (여전히 열려 있음)
