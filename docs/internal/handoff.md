# Cautilus Handoff

## Workflow Trigger

다음 세션은 **eval determinism skew를 닫는 설계 프로토타입**부터 합니다.
합의된 설계: [docs/contracts/eval-judge-collaboration.md](../contracts/eval-judge-collaboration.md)
(지능 = 독립 log-observer, 코드 = 결정적 비교자, 심판은 calibration set로 규율).

첫 수: **dev/repo 닻에 reasoning-soundness 심판 프로토타입.**
지능이 run 로그를 읽어 `reasoning_soundness`(에이전트가 *왜* find-skills로 갔는지가 AGENTS.md에 비춰 타당한가)를 구조화 추출 → 코드가 임계 검증.
**calibration set 3~5개**(명백히 타당/부실한 라우팅 추론)로 심판을 먼저 검증.
이게 되면 dev/repo 배지가 "find-skills 토큰" 너머 "추론 backed"로 — 그때 비로소 `declared`를 벗어남.

## Current State (2026-06-09)

긴 협업 세션에서 proof-debt 골을 활성화해 돌리다, **닻(dev/repo 픽스처)을 HITL로 직접 까보니 골의 전제 자체가 바뀌었음.**

- **Apex(이전 세션):** `docs/specs/index.spec.md` = "Cautilus, Proven On Itself" 최상위. 정직한 배지(proven/declared/promised) + Proof Debt 표.
- **골 활성화 → 슬라이스 진행:**
  - 슬라이스 1 (`31d27c7`): Readiness render 버그. 진짜 원인 = specdown이 `run:shell` stdout을 HTML에 안 그림. `cat`→doctest로 adapter YAML이 inline+assert.
  - 슬라이스 2 (`00c701f`): `consumer:onboard:smoke` fresh green(`ok:true`). 단 내부 eval은 `declared-eval-runner`/`productProofReady:false` self-report.
  - 슬라이스 3 (닻 HITL): 체크인 픽스처 result가 **손-작성**이고 진짜 5/4 캡처와 불일치(`dd3f5e6`에서 진짜 캡처로 교체) → 적용하니 **live가 실패**(러너가 find-skills를 provision 안 함) → **러너 fix**(`426c421`, isolated home에 charness plugins+config provision, find-skills 이제 live 가용) → HITL로 namespace 주장 정정(scorer가 이미 leaf-정규화) → 픽스처를 **stable invariant만 단언**하게 robust화(`846d027`, workSkill 핀 제거) → **maintainer가 배지를 declared로 HOLD**(thin proxy에 proven 안 붙임).
- **핵심 전환 — DF-2:** 모든 dogfood 심판이 결정적 코드. `cautilus-eval`(지능) 층이 코드로 붕괴. behavior-vs-intent를 아무도 안 judge. 정직한 proven은 코드+지능 협업 설계 뒤에야 가능. Finding: `charness-artifacts/findings/2026-06-09-determinism-intelligence-eval-skew.md`. 결정: `docs/contracts/eval-judge-collaboration.md`. master-plan Immediate Next Moves의 lead priority로 박음.
- **골 재형성:** `charness-artifacts/goals/2026-06-09-clear-proof-debt-live-proven.md` — "배지 flip" 프레임은 조기, 무게중심이 "정직한 eval 먼저"로 이동. 슬라이스 4-8(추가 배지 flip)은 설계 뒤로 deferred. (골 hook은 사용자가 `/goal clear`로 해제함.)
- HEAD = `846d027`. origin/main보다 로컬 다수 앞섬 — **push는 사용자 몫.**
- 러너 assessment(`dev-repo-self-dogfood.assessment.json`)는 의도적으로 stale로 둠(픽스처 바뀜, live는 정직하게 미재스탬프).

## Next Session

1. `git status --short` clean 확인, 필요시 push.
2. 설계 프로토타입 시작: reasoning-soundness 심판 + calibration set(위 Workflow Trigger). 버그/예상 밖은 `charness:debug`로.
3. 프로토타입이 서면 dev/repo 배지를 정직하게 갱신하고, 같은 패턴을 discover-driven 클레임 eval 설계로 일반화.

## Discuss

- 지능 심판을 어디까지 도입할지 facet 단위 라우팅(D2)의 첫 적용 범위.
- calibration set를 어떻게 만들고 유지하는가(심판의 단위테스트).
- (백로그) discover 클레임을 deterministic/intelligence/human으로 라우팅하는 분류를 gold-set로 검증(D3, canonicalization finding과 연결).

## References

- [docs/contracts/eval-judge-collaboration.md](../contracts/eval-judge-collaboration.md) — 합의된 설계 결정
- [charness-artifacts/findings/2026-06-09-determinism-intelligence-eval-skew.md](../../charness-artifacts/findings/2026-06-09-determinism-intelligence-eval-skew.md) — 문제(DF-2)
- [charness-artifacts/goals/2026-06-09-clear-proof-debt-live-proven.md](../../charness-artifacts/goals/2026-06-09-clear-proof-debt-live-proven.md) — 재형성된 골
- [charness-artifacts/hitl/latest.md](../../charness-artifacts/hitl/latest.md) — 닻 HITL 기록
- [charness-artifacts/debug/debug-2026-06-09-dev-repo-runner-cannot-provision-find-skills.md](../../charness-artifacts/debug/debug-2026-06-09-dev-repo-runner-cannot-provision-find-skills.md) — 러너 provisioning RCA
- [docs/specs/index.spec.md](../specs/index.spec.md) — apex
