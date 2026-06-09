# Cautilus Handoff

## Workflow Trigger

다음 세션 첫 수: **harmony facet 분해** — 의미 judge를 통과시키는 단계.

의미 클레임(app-chat conversation-goal)에서 judge가 calibration **실패**(3/4)했음. 원인 = judge가 *결정론적* 형식 facet(길이·구조)을 일관성 없이 함. 해법(설계 D2, 데이터로 증명됨): **형식 facet은 코드, 의미 facet만 지능, verdict는 AND.**

합의된 스펙은 픽스처에 박혀 있음: `fixtures/eval/dev/repo/reasoning-soundness-calibration.conversation-goal.json`의 `agreedFacetSpec`.
- 구조 기준(maintainer 결정): **"한 문단"은 본문에만, 요약 줄은 별개 필수 요소(문단 수 제외).**
- 코드 facet: language/no-lists/has-요약/answer-body-one-paragraph(요약 제외)/within-length. 지능 facet: answered_substantively/no_fabrication.
- 라벨(maintainer 확정): sc1 sound, sc2 unsound(240>200), sc3 sound, **sc4 sound**(judge가 틀림).
- **예상: 4/4 일관 → `calibrationExpectation`를 fail→pass로 승격.** 그게 harmony를 end-to-end로 실증.

그다음: 같은 facet-분해를 discover 클레임을 deterministic/지능/human으로 라우팅하는 **템플릿**으로 일반화.

설계: [docs/contracts/eval-judge-collaboration.md](../contracts/eval-judge-collaboration.md) (끝 "Generalization and the code/intelligence boundary" + "Next step").
배지: `Behavior Evaluation` **declared 유지**(의미 judge 미통과 → eval surface 'proven' 불가, maintainer 결정).
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
- 프로토타입: 고정 sonnet judge가 blind로 **6/6**(control 거부) → 게이트 green.

### 이번 세션 후반(2026-06-09): 일반화 → 의미 클레임 → 경계 발견

- **2번째 라우팅 클레임 bug→debug(`26ce3a9`):** multi-claim 레지스트리로 harness가 claim-agnostic 실증. 4개 실제 수확(B1/B2×haiku/sonnet) + control, judge **5/5**·control 거부. **누적 발견: 2클레임·9런·2티어에서 자연 unsound 0건** — 에이전트가 라우팅 규칙에 견고. (수확: `2026-06-09-discriminating-prompt-harvest.md`)
- **라우팅은 sliver 확인:** `cautilus discover`가 361 클레임을 뽑는데(`recommendedProof`: cautilus-eval 140·deterministic 119·human 102) 라우팅은 ~0.3%. 닻이 우연히 라우팅이라 과대취급됐던 것. cautilus-eval 분류는 245/361 heuristic이라 그 자체로 미검증(D3).
- **의미 클레임 prototype(`79a9d44`):** harness를 claim-defined facets로 일반화 + app-chat conversation-goal 클레임(실제 채팅 응답 4개). **자연 unsound 즉시 출현(sc2: 240자>200)**, judge가 잡음·코드도 길이 동의. 그러나 judge가 **calibration 실패(3/4)**: sc4의 본문+요약줄 구조를 "한 문단 위반"이라며 거부 — sc1/sc3 동일 구조는 통과시켜놓고. **비일관.** 게이트는 `calibrationExpectation: fail-pending-facet-decomposition`로 정직히 기록(suite green).
- **경계 발견(`2026-06-09-code-intelligence-harmony-boundary.md`):** 코드/지능 경계는 클레임 종류가 아니라 **클레임 *안* facet 단위**. 형식=코드, 의미=지능. judge가 코드 일을 해서 흔들린 것. = DF-2(창립 우려)에 대한 경험적 답.
- **maintainer 결정(2026-06-09):** (1) 구조 기준 = 요약 줄 별개(본문만 한 문단) → sc4=sound. (2) 배지 declared 유지.
- HEAD = `79a9d44`(+ 이 마무리 커밋). origin/main보다 로컬 다수 앞섬 — **push는 사용자 몫.**
- 러너 assessment(`dev-repo-self-dogfood.assessment.json`)는 의도적으로 stale로 둠.

## Next Session

1. `git status --short` clean 확인, 필요시 push, 권장 `npm run verify` 1회.
2. **harmony facet 분해**(위 Workflow Trigger). conversation-goal 클레임을 4/4로 승격.
3. 그다음 그 분해를 discover 클레임 라우팅(deterministic/지능/human)의 템플릿으로 일반화.

## Discuss

- 심판 모델 고정값(현재 sonnet) — 제품 러너(codex)와의 정합/비용.
- (백로그) discover의 `recommendedProof` 분류(245/361 heuristic)를 gold-set로 검증·교정(D3) — "어디에 지능이 필요한가"를 신뢰가능하게.
- (백로그) 배지 배선: harmony judge가 서면 apex 스펙 projection에 배선할지.

## References

- [docs/contracts/eval-judge-collaboration.md](../contracts/eval-judge-collaboration.md) — 합의된 설계 + "Prototype result (2026-06-09)"
- [scripts/agent-runtime/reasoning-soundness-judge.mjs](../../scripts/agent-runtime/reasoning-soundness-judge.mjs) — harness(스키마/blind 프롬프트/comparator) + `.test.mjs`
- [fixtures/eval/dev/repo/reasoning-soundness-calibration.json](../../fixtures/eval/dev/repo/reasoning-soundness-calibration.json) — 실제 수확 calibration + control
- [fixtures/eval/dev/repo/reasoning-soundness-calibration.bug-debug.json](../../fixtures/eval/dev/repo/reasoning-soundness-calibration.bug-debug.json) — 2번째 라우팅 클레임(judge 5/5)
- [fixtures/eval/dev/repo/reasoning-soundness-calibration.conversation-goal.json](../../fixtures/eval/dev/repo/reasoning-soundness-calibration.conversation-goal.json) — 의미 클레임 + `agreedFacetSpec`(다음 세션 입력)
- [charness-artifacts/eval-trust/2026-06-09-discriminating-prompt-harvest.md](../../charness-artifacts/eval-trust/2026-06-09-discriminating-prompt-harvest.md) — 라우팅 수확 + "자연 unsound 희귀" 발견
- [charness-artifacts/findings/2026-06-09-code-intelligence-harmony-boundary.md](../../charness-artifacts/findings/2026-06-09-code-intelligence-harmony-boundary.md) — **경계 발견(facet 단위), 다음 세션의 근거**
- [charness-artifacts/findings/2026-06-09-determinism-intelligence-eval-skew.md](../../charness-artifacts/findings/2026-06-09-determinism-intelligence-eval-skew.md) — 문제(DF-2)
- [charness-artifacts/goals/2026-06-09-clear-proof-debt-live-proven.md](../../charness-artifacts/goals/2026-06-09-clear-proof-debt-live-proven.md) — 재형성된 골
- [charness-artifacts/hitl/latest.md](../../charness-artifacts/hitl/latest.md) — 닻 HITL 기록
- [charness-artifacts/debug/debug-2026-06-09-dev-repo-runner-cannot-provision-find-skills.md](../../charness-artifacts/debug/debug-2026-06-09-dev-repo-runner-cannot-provision-find-skills.md) — 러너 provisioning RCA
- [docs/specs/index.spec.md](../specs/index.spec.md) — apex
