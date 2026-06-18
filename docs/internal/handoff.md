# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — 다음 마일스톤을 시작해주세요. 먼저 Discuss의 "다음 마일스톤 선택"부터 확정.`

doc 멘션만으로 픽업하면 이 트리거의 workflow를 실행하세요(파일 재독만 하지 말 것).
Both-track 골드셋 ground truth는 **완료**됐으니, 다음은 measurement 완성(recall) · harvest 반영(slice-3 템플릿) · 위생(소스편집→재생성) 중 택1.

## Current State

- **Developer track 232 HITL 완료 (2026-06-18, `hitl-devtrack-v2head-20260618`)**: 운영모델 = 소스별 서브에이전트 6개 사전채점(R1–R18) → 인간 예외-비준, **오버라이드 0건**. 결과 **232/232, pending 0**: accept 192(46 reservation note 기록) / relabel 25 / not-a-claim 7 / badly-bounded 5 / rewrite-source 3. durable graded 220, tier T1 13·T2 85·T3 122(예측대로 T3 skew). 부모 `gold-set-proposal.json` **306/306, pending 0**(user-product 74 보존, 0 mismatch). 앵커: 기존 232를 `558cda7`로 HITL, **재번호 재차 defer**(claim-discovery-workflow.md만 리워드됐고 assertion 전부 무손상). 상세=`goldset-v2-head/HITL-CLOSEOUT.developer.md`.
- **핵심 harvest**: proof-route 약점이 지배·정량화됐다 — relabel 25 중 24가 `→deterministic`(18 ha→det, 6 ce→det, 1 ha→ce outlier). 292 분석이 예측한 "클레임은 잘 찾되 proof 라우팅 ~20% 약함"이 232 계약 코퍼스에서 **10.8% relabel / ~10.3% proof-misroute**로 측정됨. R16/R12가 "systematic agent error 측정되면" 걸어둔 게이트 충족 → slice-3 템플릿 lean 일반화 후보가 이제 unblocked.
- **그 전 (2026-06-18)**: user-product 74/74 ratified(`HITL-CLOSEOUT.md`); apex-consistency sweep(레포 전체를 잠긴 apex `docs/specs/index.spec.md` proof-badge에 정합); needs-decision 해소; specdown 전면 재작성 예정이라 verify/pre-push에서 `lint:specs` **임시 주석처리**(`run-verify.mjs`+`run-verify.test.mjs` 두 줄 같이 복원).

## 다음 세션: 다음 마일스톤 (Discuss에서 택1)

1. **cli.md recall probe**: 과분할 표면(over-split) 점검. 골드셋 무접근 fresh 서브에이전트로 recall blind spot 측정 — precision은 양 트랙 끝났고 남은 측정 갭이 recall.
2. **slice-3 템플릿 반영**: 정량화된 proof-route 오류를 추출 템플릿에 lean 일반화(R16/R12 scope 준수 — 선제 per-bullet 열거 금지, lean generalization만). master-plan slice 3.
3. **위생 → 재생성**: deferred 소스편집(rewrite-source 3 trim + badly-bounded 5 curator split, `HITL-CLOSEOUT.developer.md` §A/B) 적용 → claims:refresh:all → 전면 both-track 재생성(여기서 line 재번호 실현).

## Discuss (열린 결정 / 이월 follow-up)

- **다음 마일스톤 선택**: 위 1/2/3 중 어디부터. 권장 순서 = recall probe(측정 완성) → slice-3(harvest 반영) → 위생+재생성. 단 maintainer가 harvest를 먼저 제품에 반영하고 싶으면 2부터.
- **앵커 재번호**: 양 트랙 verdict는 `claimFingerprint`로 carry. 기계적 line 재번호는 다음 전면 재생성에 접힘(소스편집 A/B 선반영 후).
- **specdown 재설계 (예정, verify에서 임시 제거됨)**: 재작성 때 흡수 — `docs/specs/old/**` archived proof inert화/삭제, ledger·evidence "open gap"↔apex "proven" 2축 표현. 완료 후 `lint:specs` 주석 복원.
- 심판 모델 고정값(sonnet) vs 제품 러너 정합/비용 (이월), harmony judge 배지 배선 (이월).

## 핵심 수확·비준 모델 (pointer — 상세는 closeout들)

- **292의 정체**: 과추출 아님 = audience 혼합 + 카운트 착시 + flatness + proof-route 라벨 ~20% 오류. developer 트랙이 이 proof-route 오류를 정량 확증(위 harvest).
- **모델**: APEX(유저-가치 1줄, `docs/specs/index.spec.md`) / 6 에픽 브랜치 / 클레임=DAG(supportingEpics facet) / recall blind spot=원칙·경계 2종. R1–R18 durable 전문 = 두 closeout + `hitl-devtrack-v2head-20260618/rules.yaml`.

## 제약

push는 사용자 몫(의도적 보류). claim-source 편집 후 `npm run claims:refresh:all`. ground truth 전 큐레이션 빌드 금지. raw를 큐레이션 후 채점 금지(recall은 별도 probe). docs/internal/* 제외 금지. critique/fresh-eye 리뷰는 서브에이전트 위임.

## References

- `charness-artifacts/eval-trust/goldset-v2-head/` — 비준 골드셋(both-track 306/306) + `HITL-CLOSEOUT.md`(user-product) + `HITL-CLOSEOUT.developer.md`(developer) + `ANCHOR.md`(re-anchor status).
- `.charness/hitl/runtime/hitl-devtrack-v2head-20260618/` — developer 사전채점 슬라이스·pregrade·apply 스크립트·rules.yaml(R1–R18).
- `scripts/build-gold-set-proposal.mjs`·`segment-goldset-by-audience.mjs`·`build-epic-dag.mjs`(전부 +test) — 골드셋·세그먼트·DAG 도구.
- `docs/contracts/claim-extraction-template.md`·`docs/contracts/claim-discovery-workflow.md` — 추출 시임·워크플로우 계약(slice-3 편집 대상).
- `docs/master-plan.md` — 로드맵.
