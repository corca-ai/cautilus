# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — 전면 both-track 재추출을 시작해주세요. 먼저 Discuss의 "재추출 스코프 확정"부터.`

doc 멘션만으로 픽업하면 이 트리거의 workflow를 실행하세요(파일 재독만 하지 말 것).
남은 큰 한 수는 **전면 both-track 재추출**입니다 — 비준된 306/306 ground truth를 다시 열어 재비준(또 한 번의 HITL)이 필요한 대형 작업이라, 시작 전 스코프를 확정하세요.

## Current State

- **이번 세션 (2026-06-18, recall + template + hygiene). 마일스톤 1·2·3(위생) 완료:**
  - **M1 cli.md recall probe DONE** (`goldset-v2-head/RECALL-PROBE-cli.md`): gold 자기 recall 68/68(phantom 0), over-split 가설 **기각**(blind oracle가 더 잘게; gold가 둘 다보다 잘게 쪼갠 건 23클러스터 중 2뿐), 진짜 누락은 scenarios/review/evidence/plugin 계열 **helper 서브커맨드 9개**(deterministic, 4×T2/5×T3)뿐 — 원칙·경계 blind spot **0**. **입도 정책 확정 = family-representative**(9개는 family 클레임에 coverage note로 fold, 별도 클레임 아님). 부수 확증: blind이 cautilus-eval proofGuess 4건을 deterministic으로 강등 → proof-route harvest와 동방향.
  - **M2 slice-3 템플릿 lean 일반화 DONE** (`080e7d0`): proof-route 약점을 추출 템플릿 routing guidance에 R16-locked 단일 일반화로 반영(ownership/boundary/isolation + reviewable/reproducible → deterministic). critique가 잡은 세션-수치 bleed 제거(원칙만).
  - **M3 위생 DONE**: rewrite-source 2건 적용(`3bc1b06`: README "shortest" 제거, template "(ratified 2026-06-10)" 제거). cli `evaluate evaluate review` 오타는 **바이너리 command-registry 버그**로 판명 → 제품 전역 + 23 doc/skill 사이트 수정 + 구조적 회귀 가드(`dc1837c`, `charness-artifacts/debug/2026-06-18-evaluate-review-doubled-verb.md`). `template:358`은 게이트 미착지로 유지.
- **재추출로 이월(maintainer 결정 2026-06-18):** curator split 5(closeout §B, 특히 workflow:289 8항목 claim/premise) + line 재번호 + 9 recall-gap 서브커맨드. 부분 hand-renumber는 리워드된 workflow.md 위에서 혼합-앵커를 만들어 회피. 양 트랙 **306/306 비준 보존**(verdict carry by fingerprint), 앵커 `558cda7`.

## 다음 세션: 전면 both-track 재추출

- 편집된 v2 템플릿(`080e7d0`)으로 306 전량 재추출 → 재세그먼트 → DAG 재구성 → **fresh HITL 재비준** → line 재번호 실현. ground truth 재개봉이므로 재비준 필수.
- **고정 입력**: family-representative 입도, 적용된 소스편집(README/template/cli), 이월 curator split(§B), 9 recall-gap(family fold + coverage note). 측정 목표: 편집 템플릿의 proof-route 효과(template 계약 Implementation Slice 4 비교; S1/S2 = before).

## Discuss (열린 결정 / 이월)

- **재추출 스코프 확정**: 전면 재추출은 비싸고 ground truth를 재개봉. 시작 전 범위·HITL 운영모델(소스별 사전채점→예외 비준 등) 확정.
- **specdown 재설계 (예정, verify에서 임시 제거됨)**: 재작성 때 `lint:specs` 주석 복원(`run-verify.mjs`+`run-verify.test.mjs` 두 줄). archived proof inert화, ledger↔apex 2축 표현.
- 심판 모델 고정값(sonnet) vs 제품 러너 정합/비용 (이월), harmony judge 배지 배선 (이월).

## 제약

push는 사용자 몫(의도적 보류). claim-source 편집 후 `npm run claims:refresh:all`(소스 커밋 → refresh → 패킷 커밋 순서; gitState.isStale은 소스 드리프트 기준). ground truth 전 큐레이션 빌드 금지. raw를 큐레이션 후 채점 금지(recall은 별도 probe, 완료). docs/internal/* 제외 금지. critique/fresh-eye 리뷰는 서브에이전트 위임. bug/error/regression은 `charness:debug` 라우팅.

## References

- `charness-artifacts/eval-trust/goldset-v2-head/` — 비준 골드셋(306/306) + `HITL-CLOSEOUT.md`(user-product) + `HITL-CLOSEOUT.developer.md`(developer, §A/B/C 갱신) + `RECALL-PROBE-cli.md`(+`recall-probe-cli/`) + `ANCHOR.md`(re-anchor status 2026-06-18 갱신).
- `charness-artifacts/debug/2026-06-18-evaluate-review-doubled-verb.md` — doubled-verb 바이너리 버그 진단 + 회귀 가드.
- `docs/contracts/claim-extraction-template.md` — slice-3 routing guidance 편집됨(§4); 재추출이 소비하는 v2 템플릿 계약.
- `scripts/build-gold-set-proposal.mjs`·`segment-goldset-by-audience.mjs`·`build-epic-dag.mjs` (전부 +test) — 골드셋·세그먼트·DAG 도구.
- `docs/master-plan.md` — 로드맵.
