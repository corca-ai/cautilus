# Cautilus Handoff

## Workflow Trigger

reasoning-soundness 심판 **프로토타입은 완료**(2026-06-09, 게이트 green). 다음 세션은 **두 갈래** 중 maintainer가 고르는 쪽:
(1) **일반화** — 같은 (지능 추출 → 코드 비교) 패턴을 dev/repo 닻 너머 *다른 claim*에 적용. 여기서 비로소 심판의 **거부 능력**(unsound 잡기)이 자연 변이로 시험됨 (닻에선 deferred).
(2) **배지 결정 슬라이스** — 프로토타입을 apex 스펙 projection에 배선하고 `Behavior Evaluation` 배지를 `declared` → reasoning-backed로 옮길지 maintainer가 결정. **자동 flip 금지**(consequential, owner-facing).

설계: [docs/contracts/eval-judge-collaboration.md](../contracts/eval-judge-collaboration.md) — 끝에 "Prototype result (2026-06-09)" 박혀 있음.
버그/예상 밖은 `charness:debug`. 막히면 설계로 올라와 같이 정함.

## Current State (2026-06-09)

긴 협업 세션에서 proof-debt 골을 활성화해 돌리다, **닻(dev/repo 픽스처)을 HITL로 직접 까보니 골의 전제 자체가 바뀌었음.**

- **Apex(이전 세션):** `docs/specs/index.spec.md` = "Cautilus, Proven On Itself" 최상위. 정직한 배지(proven/declared/promised) + Proof Debt 표.
- **골 활성화 → 슬라이스 진행:**
  - 슬라이스 1 (`31d27c7`): Readiness render 버그. 진짜 원인 = specdown이 `run:shell` stdout을 HTML에 안 그림. `cat`→doctest로 adapter YAML이 inline+assert.
  - 슬라이스 2 (`00c701f`): `consumer:onboard:smoke` fresh green(`ok:true`). 단 내부 eval은 `declared-eval-runner`/`productProofReady:false` self-report.
  - 슬라이스 3 (닻 HITL): 체크인 픽스처 result가 **손-작성**이고 진짜 5/4 캡처와 불일치(`dd3f5e6`에서 진짜 캡처로 교체) → 적용하니 **live가 실패**(러너가 find-skills를 provision 안 함) → **러너 fix**(`426c421`, isolated home에 charness plugins+config provision, find-skills 이제 live 가용) → HITL로 namespace 주장 정정(scorer가 이미 leaf-정규화) → 픽스처를 **stable invariant만 단언**하게 robust화(`846d027`, workSkill 핀 제거) → **maintainer가 배지를 declared로 HOLD**(thin proxy에 proven 안 붙임).
- **핵심 전환 — DF-2:** 모든 dogfood 심판이 결정적 코드. `cautilus-eval`(지능) 층이 코드로 붕괴. behavior-vs-intent를 아무도 안 judge. 정직한 proven은 코드+지능 협업 설계 뒤에야 가능. Finding: `charness-artifacts/findings/2026-06-09-determinism-intelligence-eval-skew.md`. 결정: `docs/contracts/eval-judge-collaboration.md`. master-plan Immediate Next Moves의 lead priority로 박음.
- **골 재형성:** `charness-artifacts/goals/2026-06-09-clear-proof-debt-live-proven.md` — "배지 flip" 프레임은 조기, 무게중심이 "정직한 eval 먼저"로 이동. (골 hook은 사용자가 `/goal clear`로 해제함.)

### 이번 세션(2026-06-09 오후): reasoning-soundness 프로토타입 완성

- **재정렬(maintainer가 전제 도전):** 처음엔 손-작성 calibration 6케이스로 갔으나, maintainer가 "픽스처 실행이 어떤 *프롬프트*를 쓰는 거냐, 잘 안 될 판별력 있는 걸로 테스트해야"라고 지적 → 두 레이어(에이전트 eval=프롬프트 vs judge calibration=라벨된 추론)를 내가 뭉갰음을 인정. **판별력 프롬프트로 재수화** 선택.
- **수확(`fdec519`):** P1(명확 pickup)·P2(오타 함정)·P3(복잡 URL+버그+결정)을 blind read-only 서브에이전트로 2티어 실행 → 5개 실제 추론. **발견: 5/5가 startup find-skills를 지킴**(haiku도 함정에서 안 건너뜀). 자연 unsound 안 나옴. → maintainer가 "이건 검증된 것으로 봐도 됨, 거부 능력은 다른 케이스에서 드러날 것" 결정.
- **harness(`5315164`)+심판 캡처(`d14e809`):** `scripts/agent-runtime/reasoning-soundness-judge.mjs`(루브릭 스키마 + 누수차단 blind 프롬프트 빌더 + 결정적 comparator + rubber-stamp 가드) + `*.test.mjs`. calibration = 실제 5 sound + 라벨된 rubber-stamp control 1. **고정 sonnet judge가 blind로 6/6 정답(control 거부) → 게이트 green, 462/462 node 테스트 통과.** 캡처는 `fixtures/eval/dev/repo/reasoning-soundness-judge-verdicts.json`, 결정적 replay.
- **HITL:** calibration verdict HITL 세션은 `concluded_with_realignment`(`charness-artifacts/hitl/latest.md`). 옛 6케이스 큐는 superseded.
- **배지:** `Behavior Evaluation`은 여전히 **declared**. 프로토타입은 메커니즘+실제 soundness 증명, 거부 능력은 deferred. 배지 이동은 maintainer 결정 + 별도 배선 슬라이스.
- HEAD = `d14e809`. origin/main보다 로컬 다수 앞섬 — **push는 사용자 몫.**
- 러너 assessment(`dev-repo-self-dogfood.assessment.json`)는 의도적으로 stale로 둠.

## Next Session

1. `git status --short` clean 확인, 필요시 push.
2. Workflow Trigger의 두 갈래 중 maintainer가 고른 쪽 (일반화 / 배지 배선).
3. 일반화 시: AGENTS.md엔 검증할 라우팅 클레임이 더 많음(P1~P3에서 본 handoff-pickup, URL→gather, bug→debug 등). discover-driven claim eval로 같은 패턴 확장 — 거기서 자연 unsound가 나와 거부 능력이 시험됨.

## Discuss

- 일반화의 첫 적용 범위: 어떤 claim부터 (facet 단위 라우팅 D2의 첫 케이스).
- 심판 모델 고정값(현재 sonnet) — 제품 러너(codex)와의 정합/비용.
- (백로그) discover 클레임을 deterministic/intelligence/human으로 라우팅하는 분류를 gold-set로 검증(D3).

## References

- [docs/contracts/eval-judge-collaboration.md](../contracts/eval-judge-collaboration.md) — 합의된 설계 + "Prototype result (2026-06-09)"
- [scripts/agent-runtime/reasoning-soundness-judge.mjs](../../scripts/agent-runtime/reasoning-soundness-judge.mjs) — harness(스키마/blind 프롬프트/comparator) + `.test.mjs`
- [fixtures/eval/dev/repo/reasoning-soundness-calibration.json](../../fixtures/eval/dev/repo/reasoning-soundness-calibration.json) — 실제 수확 calibration + control
- [fixtures/eval/dev/repo/reasoning-soundness-judge-verdicts.json](../../fixtures/eval/dev/repo/reasoning-soundness-judge-verdicts.json) — blind judge 1회 캡처(결정적 replay)
- [charness-artifacts/eval-trust/2026-06-09-discriminating-prompt-harvest.md](../../charness-artifacts/eval-trust/2026-06-09-discriminating-prompt-harvest.md) — 수확 + "자연 unsound 희귀" 발견
- [charness-artifacts/findings/2026-06-09-determinism-intelligence-eval-skew.md](../../charness-artifacts/findings/2026-06-09-determinism-intelligence-eval-skew.md) — 문제(DF-2)
- [charness-artifacts/goals/2026-06-09-clear-proof-debt-live-proven.md](../../charness-artifacts/goals/2026-06-09-clear-proof-debt-live-proven.md) — 재형성된 골
- [charness-artifacts/hitl/latest.md](../../charness-artifacts/hitl/latest.md) — 닻 HITL 기록
- [charness-artifacts/debug/debug-2026-06-09-dev-repo-runner-cannot-provision-find-skills.md](../../charness-artifacts/debug/debug-2026-06-09-dev-repo-runner-cannot-provision-find-skills.md) — 러너 provisioning RCA
- [docs/specs/index.spec.md](../specs/index.spec.md) — apex
