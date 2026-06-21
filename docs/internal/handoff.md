# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행 — eval per-facet routing의 측정 기반 다음 슬라이스 착수. 먼저 charness-artifacts/eval-trust/2026-06-21-heuristic-baseline-routing-vs-ratified.md 와 docs/contracts/facet-decomposition.md 의 'Status update (2026-06-21)' 를 읽고, R6/R12 를 deterministic 엔진 baseline(classifyClaimLine)에 반영하는 슬라이스를 spec→impl 로 진행할지 사용자에게 확인하세요.`

첫 tool call = 측정 아티팩트 read. mention-only 픽업이어도 재독에 그치지 말고 위 분기(R6/R12-into-baseline 슬라이스 확인)를 실행하세요. (build 전 사용자 의사 확인 — 슬라이스 shape 결정 남음.)

## Current State

- **specdown 코퍼스 재구조화: 완료(Slice 1~3 코어, 전부 push됨).** Slice 4(Alloy + optional rename)는 optional 폴리시 단계로 미착수.
- **Residual A 착지(push됨, `98b3724e`):** `promises/claim-discovery.spec.md`의 brittle exact/by-index 버킷 assert를 structural invariant(vocabulary subset + catalog order + floor)로 전환 → docs 편집마다 깨지던 재발 brittleness 제거. bounded fresh-eye 비평 PASS(must-fix 없음), verify green, honesty 7/7.
- **66커밋 backlog push 완료** (이번 세션 초, `818bd5c8..7f8d4946`).
- **eval determinism skew = 사실상 닫힘(중요):** master-plan은 stale였음. 계약(eval-judge-collaboration.md)대로 judge tier가 `cautilus evaluate` CLI에 wiring, regression detection 3개 pinned behavior 증명, apex `Behavior Evaluation` 배지 `proven`(dev/repo + dev/skill, live), 전체 apex 7/7 proven.
- **이번 세션 Fork C(정리+측정) 완료:**
  - master-plan lead-priority/Immediate-Next-Moves realign(eval skew 닫힘 반영 + 측정 기반 잔여 우선순위 기록).
  - facet-decomposition.md "Next step"에 2026-06-21 Status update 추가(2026-06-10 plan이 template+override에 부분 OBE; 엔진 baseline이 미반영 surface).
  - 내구 측정 아티팩트 작성: `charness-artifacts/eval-trust/2026-06-21-heuristic-baseline-routing-vs-ratified.md`.

## 측정 핵심 (다음 슬라이스의 근거)

- 체크인/CI claim 모집단은 `extractionMode: heuristic`(하드코딩 `classifyClaimLine`)이 생성 — agent template(R6/R12-aware)이 아님. `claims:refresh:all`이 deterministic이라 LLM 호출 불가하기 때문.
- live route 분포: cautilus-eval 36.3% / det 35.3% / human 28.5% — 비준 ground truth(det ~75% / eval ~11%) 대비 **eval 3.4배 과다배정**.
- fingerprint 오버랩 49개에서 route 정확도 **22/49 = 45%**; 불일치는 live `cautilus-eval` → key `deterministic`(R6/R12 패턴)가 다수.
- 결론: R6/R12가 agent template + override surface엔 들어갔지만 **엔진 baseline엔 미반영** → 최고가치 다음 슬라이스 = R6/R12를 `classifyClaimLine`에 반영(portable default + adapter routing-hint extension family, `non_claim_section_headings` 패턴 미러링), deterministic 유지.

## Next Session

1. **R6/R12-into-baseline 슬라이스(권장, 측정 기반):** spec→impl. `ownershipBoundaryClaim`(claim_discovery.go:1445, 현재 human-auditable) 등 R6/R12 위반 케이스를 deterministic로 교정 + adapter `classification_hints` routing family 추가. 성공기준 후보: live route 분포·fingerprint-overlap 정확도가 비준 ground truth 쪽으로 이동(측정 아티팩트가 baseline 숫자). 착수 전 슬라이스 shape(엔진 default vs adapter-only vs 둘 다) 사용자 확인.
2. **Fork B(deeper, gated):** true per-facet 분해(claim → code∧judge facet AND)를 discovered 모집단으로 일반화. baseline 교정 뒤로 미룸.
3. **app-surface Proof Debt(부분 차단):** app/chat liveness(production-log replay → live re-run), app/prompt product-runner proof. 이 repo엔 실제 app 없어 owner/runtime 필요.
4. **push 전 필수:** claim-source(docs/specs/**, docs/master-plan.md, docs/contracts/**, README, AGENTS, 어댑터 등) 편집 시 `npm run claims:refresh:all` 후 push. handoff.md는 adapter exclude라 refresh 무영향.

## Discuss

- R6/R12-into-baseline 슬라이스 shape: 엔진 portable default 교정만 / adapter routing-hint family만 / 둘 다(`non_claim_section_headings` 선례 = default+extension). 측정상 default+extension 권장.

## References

- 측정(SOT): `charness-artifacts/eval-trust/2026-06-21-heuristic-baseline-routing-vs-ratified.md`
- 계약: `docs/contracts/eval-judge-collaboration.md`, `docs/contracts/facet-decomposition.md`(Status update 2026-06-21)
- 엔진 routing: `internal/runtime/claim_discovery.go` (`classifyClaimLine` ~1420, `ownershipBoundaryClaim` 1760, classification_hints 소비 624-631)
- ground truth: `charness-artifacts/eval-trust/goldset-v2-reextract-head/gold-set-proposal.json`(answer key), `charness-artifacts/eval-trust/2026-06-19-recommendedproof-facet-gold-set-v2head.{md,json}`(R6/R12 facet gold set), `docs/specs/audit/claim-proof-route-overrides.json`(override surface)
