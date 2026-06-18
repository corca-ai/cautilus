# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — ② 재큐레이션부터 시작해주세요.`

doc 멘션만으로 픽업하면 이 트리거의 workflow를 실행하세요(파일 재독만 하지 말 것).
**① 잔여-misroute는 종결**(cut-2 → Option C 재심 → 3차 cut): key 수정 적용, 운영 템플릿은 보류로 결론.
다음은 **② 재큐레이션**(granularity/family-fold + `cli-268` split). 그 다음 ③→④.

## Current State

- **이번 세션 (2026-06-18, ① 잔여-misroute 종결):**
  - **cut-2 (routing-replication probe, 3 독립 라우터 + control)**: 잔여는 class-specific(control 94% vs 잔여 19%) — 노이즈 아님. 단 정답키를 재현하는 라우터 0(README 0/21) → contested-key 가설. fresh-eye 카운터웨이트 리뷰 반영(control inflation·contested-key·옵션C 선행). `residual-misroute-cut2.md`.
  - **Option C (sharpened-R3 재심, substance-check 강제)**: R3 과적용이 **불균등**. README 잔여 7개 중 5개가 gold-key over-relabel(agent가 옳았음) → un-relabel, README 잔여 **13.5%→3.8%**. cet documented-content 7개는 HOLD(진짜 under-route, 8.75%). key 수정 적용: **accept 344 / relabel 19 / not-a-claim 10 / badly-bounded 1**(374 불변). `residual-key-readjudication-cutC.md`.
  - **3차 cut (scoped Option A 사전검증)**: documented-content 일반화 후보가 recall은 달성(cet 21/21 det)하나 README narrative precision 회귀(5/12) → **landing 보류**. 운영 템플릿 `b922fd5d` 유지. 결함(과대 relabel)은 이미 key 수정으로 해결됨.
- **지난 세션 (2026-06-18, 재추출). 전면 both-track 재추출 완료 + 측정 확증:**
  - **선결 버그 발견·수정 (`b2a7291`)**: M2 "편집 템플릿 DONE(`080e7d0`)"은 실은 **doc-only**였고, 추출기가 소비하는 **바이너리 운영 템플릿**(`internal/runtime/claim_extraction.go`)은 stale였음 → doc↔바이너리 드리프트. `charness:debug` 라우팅(`charness-artifacts/debug/2026-06-18-extraction-template-doc-binary-routing-drift.md`), 일반화를 운영 템플릿에 folding(templateHash `41323548`→`b922fd5d`) + 패리티 가드 + critique SHIP. 이 수정이 없었으면 before/after 측정이 null이었음.
  - **재추출 ground truth (`c4d28a6`+`4cffcd6`)**: `charness-artifacts/eval-trust/goldset-v2-reextract-head/` — 5소스 블라인드 재추출(opus, 0 reject) → apply → segment → 6 소스별 사전채점(R1–R18) → 예외 비준(override 3). **374/374, pending 0** (accept 338 / relabel 25 / not-a-claim 10 / badly-bounded 1; user 75 / dev 299). 이게 HEAD 기준 **새 both-track 답안지**이고 `goldset-v2-head`(306, `558cda7`)를 supersede. before는 측정 baseline로 frozen.
  - **측정 확증** (`MEASUREMENT.proof-route.md`): 개발자 트랙 proof-route relabel율 **10.8%→6.4%**(동일 locked R1–R18), dense behavioral contract `claim-discovery-workflow` **2.5%**. 잔여 misroute 2곳: `claim-extraction-template` 메타-내용 11.3%, `README` 구조-scope 13.5% — 다음 한 수 신호.
  - **이전 deferred 마감**: line 재번호(HEAD 앵커로 실현), curator over-merge(재추출로 재바운딩, `cli-268` 1건만 남음), 9 cli recall-gap helper(포착됨, 단 family-fold 아닌 별도 claim).

## Next Session: 후속 작업 (① 종결, 남은 순서 ②→③→④)

- **② 재큐레이션 (granularity/family-fold + `cli-268` split)** (먼저): cli 101 helper 서브커맨드를 family-representative로 fold할지 별도 T3로 둘지 결정 + 유일한 badly-bounded(`cli-268`: 266행 shipped-surface를 268-269 preset 카탈로그에서 분리) 마감. 한 패스. cli 소스라 ① 작업과 독립.
- **③ Epic DAG**: 비준된 트랙 위에 build(goldset-v2-head도 DAG 없었음 — slice-3 follow-up). 저위험.
- **④ specdown 재설계**: 재작성 후 `lint:specs` 주석 복원(`run-verify.mjs`+`run-verify.test.mjs` 두 줄). eval-trust와 직교 — 언제든 단독 세션 가능.

## Discuss (열린 결정)

- **granularity 정책** (②에서 결정): cli helper를 family-fold vs 별도 T3.
- **documented-content 일반화 재시도?** (이월, 선택): cet documented-content under-route(8.75%)는 실재하나 lean 문장이 README narrative precision을 깎음(3차 cut). 더 좁게 스코프한 규칙으로 recall만 취할지, 그냥 보류 유지할지 — 급하지 않음.
- 심판 모델 고정값(sonnet) vs 제품 러너 정합/비용 (이월), harmony judge 배지 배선 (이월).

## 제약

push는 사용자 몫(의도적 보류). claim-source 편집 후 `npm run claims:refresh:all`(소스 커밋 → refresh → 패킷 커밋 순서; gitState.isStale은 소스 드리프트 기준). 운영 추출 템플릿은 doc이 아니라 `internal/runtime/claim_extraction.go`에 있음(편집 시 패리티 가드+doc 동기). ground truth 전 큐레이션 빌드 금지. raw를 큐레이션 후 채점 금지(recall은 별도 probe). docs/internal/* 제외 금지. critique/fresh-eye 리뷰는 서브에이전트 위임. bug/error/regression은 `charness:debug` 라우팅.

## References

- `charness-artifacts/eval-trust/goldset-v2-reextract-head/` — 답안지(374/374, accept 344 / relabel 19) + `ANCHOR.md` + `HITL-CLOSEOUT.md` + `MEASUREMENT.proof-route.md`. ① 잔여-misroute 종결 체인: `residual-misroute-cut2.md`(probe) → `residual-key-readjudication-cutC.md`(key 재심+3차 cut) → 증거 `cut2/`·`cutC/`·`cut3/`. 사전채점 스크래치: `.charness/hitl/runtime/`(gitignored).
- `charness-artifacts/eval-trust/goldset-v2-head/` — frozen before(306, `558cda7`); 그 closeout들은 이제 superseded snapshot을 가리킴(doc 정리 시 참고).
- `charness-artifacts/debug/2026-06-18-extraction-template-doc-binary-routing-drift.md` — doc↔바이너리 템플릿 드리프트 진단 + 패리티 가드.
- `docs/contracts/claim-extraction-template.md` (doc) ↔ `internal/runtime/claim_extraction.go` (운영 템플릿) — 둘은 손으로 동기, 가드는 `claim_extraction_test.go`.
- `scripts/build-gold-set-proposal.mjs`·`segment-goldset-by-audience.mjs`·`build-epic-dag.mjs` — 골드셋·세그먼트·DAG 도구. `docs/master-plan.md` — 로드맵.
