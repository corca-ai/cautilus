# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — 남은 Proof Debt(app 표면 라이브 증명)와 자연-unsound harvest 중 무엇을 먼저 할지 같이 정합시다.`

doc 멘션만으로 픽업하면 이 트리거의 workflow를 실행하세요(파일 재독만 하지 말 것).
**liveness 축 종결(2026-06-19): apex `Behavior Evaluation` 배지가 `declared` → `proven`으로 flip됨(dev/repo 코딩-에이전트 flagship 범위).** maintainer가 "라이브 에이전트 비용 OUT" 제약을 이번 슬라이스 한정 해제했고, 실제 에이전트(claude/Sonnet)를 repo 자신의 AGENTS.md에 대해 온디맨드로 라이브 구동해 stable invariant를 증명했다.
먼저 `charness-artifacts/eval-trust/2026-06-19-behavior-eval-live-proven.md`(증거)와 `docs/specs/index.spec.md`(apex 배지 SOT)를 읽고 아래 "Next Session"에서 시작.

## Current State

- **liveness 축 종결 + 배지 flip:** `npm run proof:behavior-eval:live`가 실제 에이전트(claude/Sonnet, claude_code 백엔드)를 repo의 진짜 AGENTS.md에 대해 라이브 구동하고, 신선 캡처에서 stable cross-runtime invariant(`observationStatus=observed` ∧ `entryFile=AGENTS.md` ∧ `bootstrapHelper=charness:find-skills`)를 assert. 두 독립 라이브 런이 reasoning 텍스트는 달랐지만 invariant는 유지 — 라이브 증명이 진짜(비결정적 reasoning, 결정적 invariant). 증거 `charness-artifacts/eval-trust/2026-06-19-behavior-eval-live-proven.md`.
- **온디맨드 게이팅(매 실행 아님):** 라이브 런은 `npm run proof:behavior-eval:live`로만; 상시 `npm run verify`/`specdown run`엔 없음. 결정론적 표준 테스트(`scripts/on-demand/behavior-eval-live-proof.test.mjs`, 7/7)가 operator-witnessed 캡처를 동일한 `assertLiveInvariant`로 replay → 표시 invariant와 등급 invariant가 drift 불가. 신규 라이브-네이티브 픽스처는 `fixtures/eval/dev/repo/live/`에 격리, codex replay 픽스처는 무손상.
- **PROVE(블라인드 Sonnet, no tools, tool_uses 0):** 진짜 라이브 캡처 → sound(0.95), 구성된 wrong-reason control → unsound(0.95). 라이브 표면에서도 judge가 load-bearing. 라이브 reasonSummary는 캡처와 byte-identical(provenance honesty, 테스트가 assert).
- **judge는 prove-then-project 유지(설계상 live-judge-per-CI 없음):** judge의 "live" 조각은 이번 슬라이스의 신선 캡처 1회 블라인드 Sonnet 등급. **AGENT 행위**가 라이브로 도는 부분.
- **apex 배지:** `Behavior Evaluation` = **proven**(dev/repo flagship 범위). proven-count 2→3. 앱-쉽 표면(`app/chat`, `app/prompt`)은 여전히 projection → Proof Debt에 유지. 자연-unsound 모집단(양 표면 모두 구성된 control만)은 배지에 **한계로 명시**.

## Next Session: 남은 Proof Debt / 라이브 확장 (같이 결정)

1. **(리드 후보 A) 앱-표면 라이브 증명.** `app/chat`(멀티턴) + `app/prompt`(단일)이 apex Proof Debt의 유일한 잔여 항목. owner-confirmed 앱 시나리오에 대한 라이브 app-runner eval을 evaluation.spec.md에 배선하면 배지 범위를 코딩-에이전트 + 앱 전체로 넓힐 수 있음. `eval live` 커맨드 표면(master-plan)과 live-run-invocation 계약 참조.
2. **(리드 후보 B) dev/skill 라이브 온디맨드 spec.** 스킬 표면은 현재 fresh-capture-replay(라이브 온디맨드 spec 아님). dev/repo와 동형으로 `npm run proof:...:live`를 스킬 no-input orientation에 추가하면 스킬 표면도 라이브-proven.
3. **(리드 후보 C) 자연-unsound harvest.** 양 표면 모두 reject-capability를 구성된 control로만 증명. 자연 발생 unsound 캡처를 harvest하면 배지의 명시 한계를 해소.
4. **(선택) 잔여:** follow-up skill-fixture-command-fragment-lint; per-facet routing 잔여; consumer-shaped corpus 복제(external-validity); specdown 재설계(맨 마지막).

## Discuss (열린 결정)

- 위 1/2/3 중 우선순위. 앱-표면(A)이 apex Proof Debt를 직접 줄이고, dev/skill(B)이 코딩-에이전트 표면을 라이브로 완성하며, 자연-unsound(C)가 배지 한계를 해소. 라이브 비용 범위(런 횟수·runtime)는 maintainer 결정.

## 제약

push는 사용자 몫(보류). claim-source 편집 후 `npm run claims:refresh:all`(소스 커밋 → refresh → 패킷 커밋); push가 `status-summary.json is stale`로 실패할 때 필요(이번 슬라이스는 apex가 claim source라 refresh 수행). 제네릭 엔진·제네릭 런타임 러너에 repo-specific judge 로직 금지(adapter-owned·SOT 헬퍼 소유). ground truth 제조 금지(sound 케이스는 진짜 라이브 캡처, control만 구성). 새 런타임 표면엔 executable test. bug/error/regression은 `charness:debug`. critique/fresh-eye는 서브에이전트 위임. 검증 서브에이전트·라이브 runtime은 Sonnet.

## References

- **계약/spec/증거**: `docs/contracts/behavior-eval-live-proof.md`(닫힌 결정)·`realsurface-judge-convergence.md`·`skill-surface-judge-convergence.md`·`eval-judge-collaboration.md`(forward pointer); `charness-artifacts/eval-trust/2026-06-19-behavior-eval-live-proven.md`·`2026-06-19-realsurface-judge-convergence.md`·`2026-06-19-skill-surface-judge-convergence.md`.
- **라이브 증명 코드(이번 슬라이스)**: 드라이버 `scripts/on-demand/behavior-eval-live-proof.mjs`(+test, 결정론적 표준 게이트); npm `proof:behavior-eval:live`; 라이브 러너 `scripts/agent-runtime/run-local-eval-test.mjs --backend claude_code`.
- **픽스처**: `fixtures/eval/dev/repo/live/behavior-eval-live-cases.json`·`behavior-eval-live-capture.json`(operator-witnessed 신선 캡처)·`behavior-eval-live-verdicts.json`(블라인드 Sonnet verdicts).
- **배지 SOT**: `docs/specs/index.spec.md`(apex)·`docs/specs/user/evaluation.spec.md`(라이브-proven headline subclaim). 로드맵 `docs/master-plan.md`. draft goal `charness-artifacts/goals/2026-06-09-clear-proof-debt-live-proven.md`(Slice 4 = Behavior Evaluation→proven, 이번에 실질 전달).
