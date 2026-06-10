# Cautilus Handoff

## Workflow Trigger

다음 세션의 운영 표면은 **셰이핑된 골**: [charness-artifacts/goals/2026-06-10-adapter-owned-discovery-classification.md](../../charness-artifacts/goals/2026-06-10-adapter-owned-discovery-classification.md).
**활성화하지 말 것** — maintainer가 의도적으로 shaped-only로 둠(모든 슬라이스에 ratification 일시정지가 있음). 골 아티팩트를 슬라이스 메모리로 쓰되 일반 인터랙티브 세션으로 실행.

첫 수 선택지 (maintainer 가용성에 따라):
- **S1 (maintainer 불필요):** 3개 코퍼스(`../yt-digest` 한국어, `../charness`, `../ceal`) baseline 측정 — read-only 측정 대상(편집/커밋 금지), 현 엔진으로 discovery 돌려 추출량/모양을 이 repo의 아티팩트로 기록. yt-digest가 거의 0으로 나오는 게 언어 갭의 증거.
- **S0 (maintainer 필요):** gold-set HITL 재개 — 세션 `.charness/hitl/runtime/hitl-20260609-235609`, 커서 c02, 큐 36개 중 c01만 승인됨. tie-break 부담 없음(dominance는 채점 각주로 강등됨).

## Current State (2026-06-10)

- **classification_hints 첫 패밀리 가동:** `claim_discovery.classification_hints.non_claim_section_headings` — 엔진은 어댑터 힌트를 실행만 하고(`a09505e`), control 테스트가 "필터는 어댑터에서만"을 고정. 라이브 실증: 승인된 비-클레임 1건만 소멸(375→374), 스펙 예시로 박힘.
- **승격 기준 + 하드코딩 인벤토리 = 계약:** `docs/contracts/claim-discovery-workflow.md` (repo-varying 관례 + gold-set 증거 + agent 제안/maintainer 승인 3박자; 우선순위 = 동사 어휘 → proof-routing → Deferred Decisions 잔재).
- **D3 gold-set 제안 완료:** 36개 facet 라벨, fresh-eye critique 반영, 외부 타당성 caveat 명시. cautilus-eval 태그가 최저 신뢰(6/12 명백 misroute). 라벨 정답은 maintainer 승인 대기(HITL S0).
- **sc5 추인됨**, conversation-goal calibration 라벨 5개 전부 maintainer 확인.
- verify 전체 green (Go 1.26.4 범프, coverage floor 회귀 수정 포함). **push는 사용자 몫 — origin 대비 40+ 커밋 앞.**

## Discuss

- S2 어휘 힌트 패밀리의 이름/모양(동사 리스트만 vs 문장 모양 포함) — S1 결과 보고 결정.
- 심판 모델 고정값(sonnet) vs 제품 러너 정합/비용 (이월).
- 배지 배선: harmony judge를 apex 스펙 projection에 배선할지 (이월, 배지는 declared 유지).

## References

- [골 아티팩트](../../charness-artifacts/goals/2026-06-10-adapter-owned-discovery-classification.md) — 슬라이스 계획·경계·수용 기준·코퍼스 결정 전부 여기
- [docs/contracts/claim-discovery-workflow.md](../contracts/claim-discovery-workflow.md) — classification_hints 계약 + 승격 기준 로드맵
- [docs/contracts/facet-decomposition.md](../contracts/facet-decomposition.md) — 재정의된 Next Step (dominant 폐기, 힌트 흡수)
- [charness-artifacts/eval-trust/2026-06-10-recommendedproof-facet-gold-set-proposal.md](../../charness-artifacts/eval-trust/2026-06-10-recommendedproof-facet-gold-set-proposal.md) — gold-set 제안 + 포터빌리티 경계
- `.charness/hitl/runtime/hitl-20260609-235609/` — HITL 재개 상태 (queue/state/scratchpad)
