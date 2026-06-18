# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — 리드 프라이오리티(eval-judge frontier)로 갑시다.`

doc 멘션만으로 픽업하면 이 트리거의 workflow를 실행하세요(파일 재독만 하지 말 것).
**eval-trust 토대(①·②·③) 종결. judge frontier도 정의적 결론 도달(2026-06-19).** 이제 본 게임 = **배지 기준 결정(유지보수자 콜)** — frontier 결과를 입력으로 Behavior Evaluation declared→reasoning-backed 기준을 정함.
먼저 `docs/contracts/eval-judge-collaboration.md`(특히 "Frontier result 2026-06-19")를 읽고 아래 "Next Session" 1번에서 시작.
(④ specdown 재설계는 맨 마지막 — eval-trust와 직교, 인프라성.)

## Current State

- **리드 프라이오리티 judge — 메커니즘은 섰고, 모집단 일반화가 frontier:**
  - 빌드 완료: 블라인드 capture→replay judge harness `scripts/agent-runtime/reasoning-soundness-judge.mjs`(codeFacets ∧ judgeFacets composite; always-sound judge는 게이트가 reject). calibration 3종(routing 6/6, bug→debug 5/5, conversation-goal harmony 5/5 + sc5 semantic control). 레퍼런스 템플릿 = `facet-decomposition.md`.
  - **per-facet routing 배선 — 첫 착륙 완료(2026-06-19)**: wp-45 규율을 휴리스틱 floor에 착륙 — cautilus adapter `non_claim_section_headings`에 `Premortem` 추가(383→375, process-note 8개 제거, 답안지 충돌 0, engine 무변경). per-claim recommendedProof를 hint family로 만드는 길은 Fixed Decision(routing=agent-primary, extraction template)으로 닫힘; 증거 `charness-artifacts/eval-trust/2026-06-19-wp45-premortem-nonclaim-heading-wiring.md`. 배선 방향 = adapter-owned `claim_discovery.classification_hints`(Agent 제안 → 유지보수자 비준; family `non_claim_section_headings`·`claim_lexicon_terms` 라이브). facet gold set = HEAD 답안지 기준 재생성 + **유지보수자 비준 완료**(2026-06-19): `charness-artifacts/eval-trust/2026-06-19-recommendedproof-facet-gold-set-v2head.{md,json}`(36엔트리; 32 as-proposed / readme-139 corrected→det / wp-61 retire-candidate; 2026-06-10판은 108커밋 stale라 superseded-as-labels). 이게 per-facet 배선의 설계 입력+테스트 픽스처. 비준 신호: dominant-correct 29/35(구판 18/35), R6/R12 적용으로 det 12/12 exact, 답안지 relabel 3건 facet view 일치, 답안지 accept인데 facet 재라우팅 비준된 divergence 2건(cdw-23→human, wp-45→det = non_claim_section_headings 규율과 직결).
  - **judge 모집단 일반화 — 정의적 결론(2026-06-19)**: judge reject-capability를 **자연 unsound 모집단**으로 입증하려 시도 → 실패가 아니라 정의적 발견. 사전등록 후 31개 blind harvest(factual-soundness 15 + source-grounded faithfulness 16, 2 tier, easy+hard 함정), **자연 unsound 0건**(haiku조차 false-premise 정정·source grounding·gap abstention·misquote 거부·overclaim 거부 전부 통과). 프로그램 전체 ~44 응답 중 자연 unsound는 conversation-goal sc2(길이=code 영역) 단 1건. **현 모델은 well-posed semantic task에서 자연 semantic unsound를 안 만든다** → 자연 reject-population harvest는 비실용적(judge 약점 아님, generator 속성). manufacture 금지 규율 유지. 재해석: natural harvest=현 행동이 sound라는 양성 증명, judge reject=regression guard로 constructed control(sc5·rubber-stamp)이 입증·load-bearing 테스트가 고정. 증거 `charness-artifacts/eval-trust/2026-06-19-judge-natural-unsound-population-frontier.md`.
  - **회귀 탐지 입증 — on-target 착륙(2026-06-19)**: natural-unsound 우회를 떠나 제품의 진짜 일(회귀 탐지)을 입증. 망가뜨린 instruction surface(find-skills 부트스트랩 "deprecated, skip")를 진짜 라우팅 에이전트(blind 서브에이전트)에 줘서 **양 tier 모두 부트스트랩을 건너뛰는 회귀를 유도**. 새 decomposed claim `dev-repo-routing-regression`이 회귀 로그를 worse로 잡음 — **process facet(code: `emitted_find_skills_bootstrap`)이 건너뜀을 결정론적으로, judge가 right-route-wrong-reason 구성 control(부트스트랩은 emit되어 토큰체크는 통과, 이유는 fabricated)을 잡음**. 양쪽이 각자 negative를 carry → always-sound judge가 gate fail(load-bearing). 16/16 테스트 green. 단 harness-level(judge가 `cautilus evaluate` CLI에 미배선, provenance는 서브에이전트 harvest). 증거 `charness-artifacts/eval-trust/2026-06-19-regression-variant-eval-routing.md`.
  - **apex 배지**: Behavior Evaluation = **declared**(저장 번들 projection, 라이브 eval 아님; `docs/specs/index.spec.md`). reasoning-backed로 올리는 건 유지보수자 결정 + 별도 슬라이스. **열린 결정**: 회귀 탐지가 harness에서 입증된 지금, (a) 이 증거(process+judge가 유도된 회귀를 잡음 + natural-sound 행동 harvest)를 충분조건으로 받아 배지를 올릴지 vs (b) bar 유지. 올리려면 다음 단계 = judge를 `cautilus evaluate` CLI에 배선 + 풀 러너 provenance.
- **eval-trust 토대 (①·②·③ 종결):** `goldset-v2-reextract-head` = HEAD 비준 답안지(375; accept 346 / relabel 19 / not-a-claim 10 / bb 0), `goldset-v2-head`(306) supersede. ③ Epic DAG: 365 gold claim → 11-epic R14 tree + R15 DAG(`EPIC-DAG.md`; epic 구조는 DRAFT 미비준). 측정 확증 dev proof-route relabel **10.8%→6.4%**. 이 답안지가 judge frontier의 claim 모집단 + proof-route 규율 샘플.

## Next Session: 큰 작업 (리드 프라이오리티 먼저 → specdown 맨 끝)

1. **배지 길 (리드)**: 회귀 탐지가 harness에서 입증됨(위 Current State) — 자연 unsound는 비실용적이라 회귀-탐지가 reject-capability의 on-target 형태. 두 갈래: (a) **judge를 `cautilus evaluate` CLI에 배선 + 풀 러너(codex/claude) provenance로 회귀 페어 재현** → 그래야 배지를 declared→reasoning-backed로 정직하게 올릴 수 있음(현재 harness-level이라 미배선이 유일한 갭), 또는 (b) 유지보수자가 현 harness 증거를 충분조건으로 받아 spec projection만 배선. **(선택) 회귀 claim 확대**: routing 외 다른 pinned behavior(bug→debug, gather, conversation-goal)에도 회귀 페어를 추가해 process+judge 회귀 탐지 폭을 키움.
2. **(선택) per-facet 잔여 + 큰 후속**: per-facet routing 첫 착륙(wp-45→Premortem)은 끝났고 더는 리드 프라이오리티 아님 — routing은 별도 스키마가 아니라 (a) agent-primary extraction template + (b) `non_claim_section_headings` discipline으로 실현됨. 잔여 후보 = Deprecated Surface Names / Probe Questions / Deliberately Not Doing 섹션의 혼재 claim(헤딩 일괄 제외 불가 — 실재 claim + kept capability-boundary, per-claim source 정리로만). 그 밖에: ③ epic-structure 비준 패스; consumer-shaped corpus로 facet 측정 복제(external-validity 백로그); 개선 레이어 다음 seam(`docs/master-plan.md` Immediate Next Moves).
3. **④ specdown 재설계 (맨 마지막)**: 재작성 후 `lint:specs` 주석 복원(`run-verify.mjs`+`run-verify.test.mjs` 두 줄). eval-trust와 직교 — 언제든 단독 세션 가능.

## Discuss (열린 결정)

- judge 모델 고정값(sonnet) vs 제품 러너 정합/비용 (이월).
- ③ epic 구조 비준 시점 — judge가 epic을 신뢰하려면 필요, 급하지 않음.
- documented-content 일반화 재시도? (이월, 선택): cet under-route(8.75%)는 실재하나 lean 문장이 README narrative precision을 깎음 — 더 좁은 규칙으로 recall만 취할지 보류 유지할지.

## 제약

push는 사용자 몫(의도적 보류). claim-source 편집 후 `npm run claims:refresh:all`(소스 커밋 → refresh → 패킷 커밋 순서; gitState.isStale은 소스 드리프트 기준). 운영 추출 템플릿은 doc이 아니라 `internal/runtime/claim_extraction.go`에 있음(편집 시 패리티 가드+doc 동기). ground truth 전 큐레이션 빌드 금지. raw를 큐레이션 후 채점 금지(recall은 별도 probe). docs/internal/* 제외 금지. critique/fresh-eye 리뷰는 서브에이전트 위임. bug/error/regression은 `charness:debug` 라우팅.

## References

- **리드 프라이오리티**: 계약 `docs/contracts/eval-judge-collaboration.md` + `facet-decomposition.md`; 근거 findings `charness-artifacts/findings/2026-06-09-{determinism-intelligence-eval-skew,code-intelligence-harmony-boundary}.md`; harness `scripts/agent-runtime/reasoning-soundness-judge.mjs`(+calibration/verdicts `fixtures/eval/dev/repo/reasoning-soundness-*.json`); facet gold set(재생성·비준, HEAD 답안지 기준) `charness-artifacts/eval-trust/2026-06-19-recommendedproof-facet-gold-set-v2head.{md,json}`(선택규칙=goldset-v2-reextract-head gold 365 중 blind route별 12; 구판 `2026-06-10-...proposal.{md,json}`는 superseded-as-labels); 배선 목표 `charness-artifacts/goals/2026-06-10-adapter-owned-discovery-classification.md`.
- **eval-trust 답안지**: `charness-artifacts/eval-trust/goldset-v2-reextract-head/`(`ANCHOR.md` + `HITL-CLOSEOUT.md` + `MEASUREMENT.proof-route.md` + `EPIC-DAG.md` + `epic-{tree,dag}-proposal*.json` + `family-fold-coverage.md`). 종결 체인/RCA: `residual-misroute-cut2.md`·`residual-key-readjudication-cutC.md`·`../../debug/2026-06-18-goldset-closeout-helper-fold-overclaim.md`. before: `goldset-v2-head/`(306, `558cda7`) + `RECALL-PROBE-cli.md`.
- **도구/템플릿**: `scripts/build-epic-dag-from-facets.mjs`(facet-native DAG)·`build-gold-set-proposal.mjs`·`segment-goldset-by-audience.mjs`. `docs/contracts/claim-extraction-template.md`(doc) ↔ `internal/runtime/claim_extraction.go`(운영, 가드 `claim_extraction_test.go`). `docs/master-plan.md` — 로드맵(lead-priority preamble은 프로토타입 완료 미반영; 계약 문서가 최신).
