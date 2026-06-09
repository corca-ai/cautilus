# Cautilus Handoff

## Workflow Trigger

다음 세션 첫 수는 **결정 frame**: per-facet 라우팅을 `discover`에 배선할지 maintainer와 정함.

harmony facet 분해는 **완료**(이번 세션). 의미 클레임 conversation-goal이 composite로 **4/4 통과**, `calibrationExpectation` fail→pass 승격됨. 템플릿은 `docs/contracts/facet-decomposition.md`에 박힘. 레지스트리 전체 green: startup-routing 6/6, bug-debug 5/5, conversation-goal 4/4.

남은 일반화는 **코드 슬라이스 + 스키마 결정**이라 작지 않음 — 그래서 명명만 하고 안 지음:
- `discover`는 지금 클레임마다 단일 `recommendedProof`(deterministic|cautilus-eval|human-auditable)를 붙임. 하지만 harmony 발견은 그 선이 클레임 *안* facet 단위라고 말함.
- 다음 단계: 발견된 클레임이 **facet별** recommendedProof를 들고 나오게 해서, 제너레이터가 facet-수준 라우팅을 emit → 이 harness가 바로 소비. 이건 `discover` 스키마를 바꾸는 일이라 maintainer 결정 사안.
- 결정 전엔 발견 클레임 분해는 `facet-decomposition.md`의 "How to decompose a new claim" 절차로 수동 적용.

그러니 다음 세션은 바로 코딩 들어가지 말고, "per-facet recommendedProof를 discover 스키마에 넣을지 / 우선순위" 결정 frame을 먼저 올릴 것. (라우팅은 361 클레임 중 ~0.3%였음 — D3 gold-set로 recommendedProof 분류부터 검증하는 게 더 높은 레버리지일 수 있음. Discuss 참고.)

설계: [docs/contracts/facet-decomposition.md](../contracts/facet-decomposition.md) (템플릿) + [docs/contracts/eval-judge-collaboration.md](../contracts/eval-judge-collaboration.md) (끝 "Harmony decomposition result" + "Next step").
배지: `Behavior Evaluation` **declared 유지**. 단일 의미 클레임 1개가 통과했다고 eval surface 전체가 'proven'은 아님 — 배지 이동은 별개 maintainer 결정 슬라이스.
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
- HEAD = `79a9d44`(+ 마무리 커밋). origin/main보다 로컬 다수 앞섬 — **push는 사용자 몫.**
- 러너 assessment(`dev-repo-self-dogfood.assessment.json`)는 의도적으로 stale로 둠.

### 이번 세션(2026-06-09 컴팩트 후): harmony facet 분해 완료 → 템플릿화

- **harness composite화(`a24b822`):** `FORMAT_FACET_CHECKERS` 레지스트리(결정론적 형식 facet) + `computeCodeFacets` + `compareVerdicts`를 composite-aware로. 클레임이 `codeFacets`를 선언하면 verdict = AND(코드 형식 facet, judge 의미 verdict); 아니면 기존 direct(라우팅) 경로. rubber-stamp 가드는 composite verdict 기준으로 일반화(코드가 negative를 내도 게이트 비-공허 유지). 합성 단위테스트로 핀. 라우팅 replay 불변.
- **conversation-goal 승격(`e87e935`):** fixture에 `codeFacets` 선언 + judgeFacets/brief/verdictDefinition을 **의미 전용**으로 재작성(judge에게 형식·길이 판단 금지 명시). blind judge를 의미 전용 프롬프트로 **재캡처**(sonnet 4개, `tool_uses:0` 진짜 blind) → 4개 모두 content-sound, **일관**(sc4 포함 — 이번엔 구조를 안 물음). composite 4/4. sc2의 유일한 negative는 이제 **코드 facet**(240>200)에서 옴. `calibrationExpectation` fail→pass.
- **적대적 리뷰 → judge load-bearing 봉합:** bounded fresh-eye 회의론자(subagent)가 진짜 갭 발견 — 4/4에서 유일 negative(sc2)가 code에서 와서 **always-sound judge도 동일 통과**(judge가 일 안 함). 해법 = 라우팅 rubber-stamp control의 의미 버전 **sc5**: 형식 완벽(code facet 전부 통과)·정의 뒤바뀜 → 오직 judge만 잡음. blind judge가 `answered_substantively:false`로 잡음. 이제 **always-sound judge는 게이트 실패**(테스트로 영구 고정: "모든 decomposed 클레임은 always-sound judge를 거부"). sc1/sc3 `lengthChars`(444/412)→471 교정(주석 일관성). composite **5/5**, code(sc2)+judge(sc5) 양쪽 negative로 실증.
- **결과:** 레지스트리 3클레임 전부 green — startup-routing 6/6(direct), bug-debug 5/5(direct), **conversation-goal 5/5(composite, judge load-bearing)**. node 14/14. harmony를 end-to-end 실증.
- **maintainer 우려(DF-2)에 대한 데이터 답 확정:** "지능과 코드가 조화롭게 협업" = 각 facet을 신뢰가능한 도구에. 코드가 형식에 일관, judge가 의미에 일관, composite가 둘 다. judge를 형식 일에서 빼니 비일관 사라짐.
- **템플릿화(docs):** `docs/contracts/facet-decomposition.md` 신규 — claim = codeFacets(결정론) + judgeFacets(의미 blind), AND 합성. discover의 per-claim `recommendedProof`를 **per-facet**으로 읽어야 한다는 규칙. discover 스키마 배선은 명명만(다음 결정 사안). finding/eval-judge-collaboration.md를 resolved로 갱신.
- HEAD 이동: `a24b822`(harness) → `e87e935`(승격) → docs/template 커밋들. **push는 사용자 몫.**

## Next Session

1. `git status --short` clean 확인, 필요시 push, 권장 `npm run verify` 1회(현재 다수 미푸시).
2. **결정 frame 먼저**(위 Workflow Trigger): per-facet `recommendedProof`를 `discover` 스키마에 넣을지 + 우선순위. 바로 코딩 금지.
3. 대안 레버리지: D3 — discover `recommendedProof` 분류(245/361 heuristic)를 gold-set로 검증·교정. "어디에 지능이 필요한가"를 신뢰가능하게(Discuss 참고).

## Discuss

- **sc5 의미 control 추인:** conversation-goal에 추가한 sc5(정의 뒤바뀜, expected unsound)는 적대적 리뷰 발견에 따라 agent가 구성함(maintainer 미확인). 뒤바뀜이 객관적이라 라벨은 안전하나, co-own 원칙상 한 번 봐주면 좋음. fixture `agreedFacetSpec.semanticControl`에 기록.
- 심판 모델 고정값(현재 sonnet) — 제품 러너(codex)와의 정합/비용.
- (백로그) discover의 `recommendedProof` 분류(245/361 heuristic)를 gold-set로 검증·교정(D3) — "어디에 지능이 필요한가"를 신뢰가능하게.
- (백로그) 배지 배선: harmony judge가 서면 apex 스펙 projection에 배선할지.

## References

- [docs/contracts/facet-decomposition.md](../contracts/facet-decomposition.md) — **일반화 템플릿**: claim = codeFacets + judgeFacets, AND 합성; per-facet recommendedProof 규칙 + discover 배선 다음 단계
- [docs/contracts/eval-judge-collaboration.md](../contracts/eval-judge-collaboration.md) — 합의된 설계 + "Harmony decomposition result (2026-06-09)"
- [fixtures/eval/dev/repo/reasoning-soundness-judge-verdicts.conversation-goal.json](../../fixtures/eval/dev/repo/reasoning-soundness-judge-verdicts.conversation-goal.json) — 의미 전용 blind 재캡처(composite 4/4)
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
