# Cautilus Handoff

## Workflow Trigger

다음 세션의 기본 pickup은 `charness:find-skills`로 설치된 스킬 지도를 먼저 재확인한 뒤, [docs/master-plan.md](../master-plan.md)의 `Immediate Next Moves`에서 evidence가 축적된 슬라이스를 고르는 것이다.
첫 행동은 `git status --short`로 live worktree를 확인하는 것이고, 그 다음 이 handoff의 `Next Session` 섹션을 읽는다.
이 handoff는 mention-only pickup 기준 문서이며, handoff adapter는 `docs/internal/handoff.md`를 canonical artifact로 해석한다.

## Current State

- Cautilus `v0.13.0` 게시 상태 그대로 ([release](https://github.com/corca-ai/cautilus/releases/tag/v0.13.0)).
  release-artifacts / verify-public-release / install-sh smoke 모두 green.
  세부 기록은 [charness-artifacts/release/latest.md](../../charness-artifacts/release/latest.md).
- `evaluation-surfaces` 재설계의 네 preset은 모두 shipped 상태다 — [docs/specs/evaluation-surfaces.spec.md](../specs/evaluation-surfaces.spec.md).
  `repo/whole-repo`, `repo/skill`, `app/chat`, `app/prompt` 모두 `cautilus eval test --fixture ...` / `cautilus eval evaluate --input ...` 경로가 있다.
  `app/prompt`는 2026-04-26에 추가됐고 `cautilus.app_prompt_test_cases.v1` / `cautilus.app_prompt_evaluation_inputs.v1` / `cautilus.app_prompt_evaluation_summary.v1`를 쓴다.
  evaluator는 app-surface 공통 runtime 필드(provider, model, harness, mode=`messaging`, durationMs, observed.messages, observed.finalText)에 더해 `app/prompt`에서 `observed.input`을 요구한다.
- 이번 세션의 closeout verification: `go test ./internal/runtime ./internal/app`, `npm run lint:skill-disclosure`, `npm run lint:specs`, `npm run verify`, `npm run hooks:check` green.
- `mode evaluate` cut + archetype-boundary retire 슬라이스는 이미 들어왔고, 상세 기록은 이 spec의 follow-up notes와 git history를 본다.
- 잔여 신호: `repo/skill` / `app/chat` / `app/prompt` 모두 real-codex/claude self-dogfood 증거는 아직 없다.
  `charness-artifacts/cautilus/latest.md` refresh도 self-dogfood 재배선 슬라이스로 미룬다.
- 잔여 신호 (`repo/whole-repo`): 현재 fixture는 `expectedRouting: { selectedSkill: "none" }`을 기대하지만 real-codex로 cautilus 실제 AGENTS.md를 돌리면 `reject`가 난다.
  fixture 기대치 vs. 실제 AGENTS.md routing 사이 정직성 결정은 self-dogfood 재배선 또는 별도 fixture 정직성 마이크로-슬라이스에서 처리.
- premortem deferral 상태:
  (a) Result packet surface-agnostic 필드 — `app/chat` / `app/prompt` evaluator에서 require로 명시 정착됨; `repo/whole-repo`/`repo/skill`로 backport는 후속 hardening 슬라이스에서.
  (b) `cautilus eval evaluate` 디스패처는 여전히 schemaVersion만으로 라우팅; fixture preset cross-check는 follow-up.
  (c) Node 측 `scripts/agent-runtime/evaluate-skill.mjs`와 동반 모듈은 self-test와 coverage floor에만 의해 살아있다 — dead-code sweep slice에서 정리.
  (d) optimize-search held-out gating은 honest-skip 상태 — 새 surface 위로 재배선은 별도 슬라이스(아래 Next Session #3 참조).
  (e) consumer onboarding smoke (`npm run consumer:onboard:smoke`)는 `doctor ready`까지만 검증; eval-test 기반 first bounded run으로 재배선은 별도 슬라이스.
- 마이그레이션 트래킹: [corca-ai/cautilus#32](https://github.com/corca-ai/cautilus/issues/32).

## Next Session

1. `git status --short`로 사용자 변경 여부를 먼저 확인한다.
2. `charness:find-skills`로 설치된 public / support / integration 스킬 지도를 한 번 갱신한다.
3. self-dogfood / consumer onboarding 재배선 — `cautilus eval test` 위로 `dogfood:self`(canonical)와 `consumer:onboard:smoke`의 first bounded run을 재구축.
   대상 fixture, 호출 시퀀스, `report.json` 대체 산출물(observed packet 기반)을 결정한다.
   optimize-search held-out 신호의 재배선도 같은 슬라이스 또는 직후 슬라이스에서 결정.
4. spec follow-up #4 — C2/C3/C4 composition primitives (extends / multi-step / snapshot), 슬라이스당 하나.
5. spec follow-up #5 — `scenario normalize` 재범위만 남음.
   archetype-boundary retire는 cut 슬라이스에 흡수됨.
6. fixture vs AGENTS.md 정직성 결정 (잔여 신호 — `repo/whole-repo`)을 self-dogfood 재배선 또는 fixture 정직성 마이크로-슬라이스에서 처리.

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
