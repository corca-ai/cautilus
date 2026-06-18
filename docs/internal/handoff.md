# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — ③ Epic DAG부터 시작해주세요.`

doc 멘션만으로 픽업하면 이 트리거의 workflow를 실행하세요(파일 재독만 하지 말 것).
**① 잔여-misroute·② 재큐레이션 모두 종결.**
다음은 **③ Epic DAG**, 그 다음 ④ specdown.

## Current State

- **이번 세션 (2026-06-18, ② 재큐레이션 종결):**
  - **cli-268 curator split**: 유일한 badly-bounded over-merge를 split — `cli-268`(2-surface/4-preset 카탈로그) + 신규 `cli-266`(shipped-surface fact). accept 344→346, badly-bounded 1→0, **총 374→375**. fingerprint 알고리즘(`sha256(normalizeClaimSummary(primary excerpt))`) 재현 검증, 3파일 정합(main 375 = user 76 + dev 299). `gold-set-proposal*.json`.
  - **granularity = family-representative 재정렬**: 9 helper 서브커맨드는 family 대표 claim 아래 fold 유지(이미 ratified 정책, `RECALL-PROBE-cli.md`). 미착륙이던 coverage note 착륙 → `family-fold-coverage.md`.
  - **closeout 과대주장 RCA+교정**: 핸드오프/closeout이 "9 helper가 별도 claim으로 surface됐다"고 했으나 **거짓**(blind 추출기가 code-fence skip으로 0개 surface; +33 성장은 다른 detail). `charness:debug` 라우팅 → `../../debug/2026-06-18-goldset-closeout-helper-fold-overclaim.md`. closeout·ANCHOR 교정.
- **지난 세션 (① 잔여-misroute 종결):** cut-2(class-specific, 노이즈 아님) → Option C 재심(R3 불균등 과적용; README 13.5%→3.8% gold-key over-relabel) → 3차 cut(documented-content 일반화 보류, 운영 템플릿 `b922fd5d` 유지). `residual-misroute-cut2.md`·`residual-key-readjudication-cutC.md`.
- **재추출 ground truth:** `goldset-v2-reextract-head` — 5소스 블라인드 재추출 → 6 소스별 사전채점(R1–R18) → 비준. HEAD 기준 both-track 답안지, `goldset-v2-head`(306) supersede. 측정 확증: dev-track proof-route relabel **10.8%→6.4%**. `MEASUREMENT.proof-route.md`.

## Next Session: 후속 작업 (①·② 종결, 남은 순서 ③→④)

- **③ Epic DAG** (먼저): 비준된 트랙(375) 위에 build(`epic-tree-proposal.json`→`epic-dag-proposal.json`). goldset-v2-head도 DAG 없었음 — slice-3 follow-up. 저위험. `scripts/build-epic-dag.mjs`.
- **④ specdown 재설계**: 재작성 후 `lint:specs` 주석 복원(`run-verify.mjs`+`run-verify.test.mjs` 두 줄). eval-trust와 직교 — 언제든 단독 세션 가능.

## Discuss (열린 결정)

- **documented-content 일반화 재시도?** (이월, 선택): cet documented-content under-route(8.75%)는 실재하나 lean 문장이 README narrative precision을 깎음(3차 cut). 더 좁게 스코프한 규칙으로 recall만 취할지, 보류 유지할지 — 급하지 않음.
- 심판 모델 고정값(sonnet) vs 제품 러너 정합/비용 (이월), harmony judge 배지 배선 (이월).

## 제약

push는 사용자 몫(의도적 보류). claim-source 편집 후 `npm run claims:refresh:all`(소스 커밋 → refresh → 패킷 커밋 순서; gitState.isStale은 소스 드리프트 기준). 운영 추출 템플릿은 doc이 아니라 `internal/runtime/claim_extraction.go`에 있음(편집 시 패리티 가드+doc 동기). ground truth 전 큐레이션 빌드 금지. raw를 큐레이션 후 채점 금지(recall은 별도 probe). docs/internal/* 제외 금지. critique/fresh-eye 리뷰는 서브에이전트 위임. bug/error/regression은 `charness:debug` 라우팅.

## References

- `charness-artifacts/eval-trust/goldset-v2-reextract-head/` — 답안지(375 entries, accept 346 / relabel 19 / not-a-claim 10 / badly-bounded 0) + `ANCHOR.md` + `HITL-CLOSEOUT.md` + `MEASUREMENT.proof-route.md` + `family-fold-coverage.md`. ① 종결 체인: `residual-misroute-cut2.md` → `residual-key-readjudication-cutC.md` → 증거 `cut2/`·`cutC/`·`cut3/`. ② 종결: `cli-268` split + `family-fold-coverage.md`, RCA `../../debug/2026-06-18-goldset-closeout-helper-fold-overclaim.md`. 사전채점 스크래치: `.charness/hitl/runtime/`(gitignored).
- `charness-artifacts/eval-trust/goldset-v2-head/` — frozen before(306, `558cda7`) + `RECALL-PROBE-cli.md`(family-representative 정책의 출처).
- `charness-artifacts/debug/2026-06-18-extraction-template-doc-binary-routing-drift.md` — doc↔바이너리 템플릿 드리프트 진단 + 패리티 가드.
- `docs/contracts/claim-extraction-template.md` (doc) ↔ `internal/runtime/claim_extraction.go` (운영 템플릿) — 둘은 손으로 동기, 가드는 `claim_extraction_test.go`.
- `scripts/build-gold-set-proposal.mjs`·`segment-goldset-by-audience.mjs`·`build-epic-dag.mjs` — 골드셋·세그먼트·DAG 도구. `docs/master-plan.md` — 로드맵.
