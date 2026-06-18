# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — 리드 프라이오리티(eval-judge frontier)로 갑시다.`

doc 멘션만으로 픽업하면 이 트리거의 workflow를 실행하세요(파일 재독만 하지 말 것).
**eval-trust 토대(①·②·③) 종결.** 이제 본 게임 = **리드 프라이오리티: eval determinism skew를 닫는 judge frontier.**
먼저 `docs/contracts/eval-judge-collaboration.md` + `docs/contracts/facet-decomposition.md`를 읽고 아래 "Next Session" frontier 슬라이스에서 시작.
(④ specdown 재설계는 맨 마지막 — eval-trust와 직교, 인프라성.)

## Current State

- **리드 프라이오리티 judge — 메커니즘은 섰고, 모집단 일반화가 frontier:**
  - 빌드 완료: 블라인드 capture→replay judge harness `scripts/agent-runtime/reasoning-soundness-judge.mjs`(codeFacets ∧ judgeFacets composite; always-sound judge는 게이트가 reject). calibration 3종(routing 6/6, bug→debug 5/5, conversation-goal harmony 5/5 + sc5 semantic control). 레퍼런스 템플릿 = `facet-decomposition.md`.
  - **frontier(미해결)**: per-claim `recommendedProof`를 **per-facet routing**으로. 배선 방향 = adapter-owned `claim_discovery.classification_hints`(Agent 제안 → 유지보수자 비준; 첫 family `non_claim_section_headings` 라이브). facet gold set = HEAD 답안지 기준 재생성 + **유지보수자 비준 완료**(2026-06-19): `charness-artifacts/eval-trust/2026-06-19-recommendedproof-facet-gold-set-v2head.{md,json}`(36엔트리; 32 as-proposed / readme-139 corrected→det / wp-61 retire-candidate; 2026-06-10판은 108커밋 stale라 superseded-as-labels). 이게 per-facet 배선의 설계 입력+테스트 픽스처. 비준 신호: dominant-correct 29/35(구판 18/35), R6/R12 적용으로 det 12/12 exact, 답안지 relabel 3건 facet view 일치, 답안지 accept인데 facet 재라우팅 비준된 divergence 2건(cdw-23→human, wp-45→det = non_claim_section_headings 규율과 직결).
  - **apex 배지**: Behavior Evaluation = **declared**(저장 번들 projection, 라이브 eval 아님; `docs/specs/index.spec.md`). reasoning-backed로 올리는 건 유지보수자 결정 + 별도 슬라이스.
- **eval-trust 토대 (①·②·③ 종결):** `goldset-v2-reextract-head` = HEAD 비준 답안지(375; accept 346 / relabel 19 / not-a-claim 10 / bb 0), `goldset-v2-head`(306) supersede. ③ Epic DAG: 365 gold claim → 11-epic R14 tree + R15 DAG(`EPIC-DAG.md`; epic 구조는 DRAFT 미비준). 측정 확증 dev proof-route relabel **10.8%→6.4%**. 이 답안지가 judge frontier의 claim 모집단 + proof-route 규율 샘플.

## Next Session: 큰 작업 (리드 프라이오리티 먼저 → specdown 맨 끝)

1. **per-facet routing 배선** (권장 첫 발): 비준된 facet gold set(`2026-06-19-...v2head.{md,json}`)을 설계 입력+픽스처로, 다음 `classification_hints` family(또는 per-facet recommendedProof)를 discover에 착륙 — facet 단위로 code/judge/human 라우팅. portability: 엔진 하드코딩 금지, adapter-owned hint로. 비준이 직접 가리킨 첫 후보 = wp-45가 입증하는 `non_claim_section_headings` 규율 확장(rejected-decision 배치 + negative "안 한다" 문장 retire — Discuss 참조). (facet gold set 비준은 2026-06-19 완료.)
2. **judge 모집단 일반화 + 배지**: contestable/semantic claim들을 decompose해 judge reject-capability를 자연 unsound 케이스로 입증(judge의 진짜 frontier). 충분하면 apex Behavior Evaluation을 declared→reasoning-backed로 올리는 슬라이스.
3. **(선택) 큰 후속**: ③ epic-structure 비준 패스; consumer-shaped corpus로 facet 측정 복제(external-validity 백로그); 개선 레이어 다음 seam(`docs/master-plan.md` Immediate Next Moves).
4. **④ specdown 재설계 (맨 마지막)**: 재작성 후 `lint:specs` 주석 복원(`run-verify.mjs`+`run-verify.test.mjs` 두 줄). eval-trust와 직교 — 언제든 단독 세션 가능.

## Discuss (열린 결정)

- judge 모델 고정값(sonnet) vs 제품 러너 정합/비용 (이월).
- ③ epic 구조 비준 시점 — judge가 epic을 신뢰하려면 필요, 급하지 않음.
- documented-content 일반화 재시도? (이월, 선택): cet under-route(8.75%)는 실재하나 lean 문장이 README narrative precision을 깎음 — 더 좁은 규칙으로 recall만 취할지 보류 유지할지.
- **negative-claim retire 원칙** (2026-06-19 facet 비준에서 발생, wp-61): 유지보수자 "뭘 안 한다는 말은 거의 다 리타이어 대상". (a) discovery-curation 규칙으로 만들지, (b) 답안지 `goldset-v2-reextract-head`의 wp-61 accept를 재검토할지 — facet 세트엔 retire-candidate로만 기록, 답안지엔 미적용. per-facet 배선 첫 후보와 묶일 수 있음.

## 제약

push는 사용자 몫(의도적 보류). claim-source 편집 후 `npm run claims:refresh:all`(소스 커밋 → refresh → 패킷 커밋 순서; gitState.isStale은 소스 드리프트 기준). 운영 추출 템플릿은 doc이 아니라 `internal/runtime/claim_extraction.go`에 있음(편집 시 패리티 가드+doc 동기). ground truth 전 큐레이션 빌드 금지. raw를 큐레이션 후 채점 금지(recall은 별도 probe). docs/internal/* 제외 금지. critique/fresh-eye 리뷰는 서브에이전트 위임. bug/error/regression은 `charness:debug` 라우팅.

## References

- **리드 프라이오리티**: 계약 `docs/contracts/eval-judge-collaboration.md` + `facet-decomposition.md`; 근거 findings `charness-artifacts/findings/2026-06-09-{determinism-intelligence-eval-skew,code-intelligence-harmony-boundary}.md`; harness `scripts/agent-runtime/reasoning-soundness-judge.mjs`(+calibration/verdicts `fixtures/eval/dev/repo/reasoning-soundness-*.json`); facet gold set(재생성·비준, HEAD 답안지 기준) `charness-artifacts/eval-trust/2026-06-19-recommendedproof-facet-gold-set-v2head.{md,json}`(선택규칙=goldset-v2-reextract-head gold 365 중 blind route별 12; 구판 `2026-06-10-...proposal.{md,json}`는 superseded-as-labels); 배선 목표 `charness-artifacts/goals/2026-06-10-adapter-owned-discovery-classification.md`.
- **eval-trust 답안지**: `charness-artifacts/eval-trust/goldset-v2-reextract-head/`(`ANCHOR.md` + `HITL-CLOSEOUT.md` + `MEASUREMENT.proof-route.md` + `EPIC-DAG.md` + `epic-{tree,dag}-proposal*.json` + `family-fold-coverage.md`). 종결 체인/RCA: `residual-misroute-cut2.md`·`residual-key-readjudication-cutC.md`·`../../debug/2026-06-18-goldset-closeout-helper-fold-overclaim.md`. before: `goldset-v2-head/`(306, `558cda7`) + `RECALL-PROBE-cli.md`.
- **도구/템플릿**: `scripts/build-epic-dag-from-facets.mjs`(facet-native DAG)·`build-gold-set-proposal.mjs`·`segment-goldset-by-audience.mjs`. `docs/contracts/claim-extraction-template.md`(doc) ↔ `internal/runtime/claim_extraction.go`(운영, 가드 `claim_extraction_test.go`). `docs/master-plan.md` — 로드맵(lead-priority preamble은 프로토타입 완료 미반영; 계약 문서가 최신).
