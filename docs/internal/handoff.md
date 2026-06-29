# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행 — risk-tier 계약 슬라이스 완료(커밋 76aa5165, Status: Specified, impl deferred, 미push). 먼저 사용자에게 (1) 계약 리뷰 통과 여부와 (2) push 여부를 확인한 뒤, 승인되면 charness:impl로 enforcement 슬라이스를 구현한다.`

mention-only 픽업이면 현재 상태(아래)만 확인하고, 계약 리뷰·push·impl 착수 여부를 사용자와 좁힌 뒤 진행한다.
자동 push·자동 impl 착수 금지.

## Continuation Capability

#51 risk-tier 정책의 **계약**이 끝났다 — `docs/contracts/acceptance-risk-tier.md`(Status: Specified)가 축·effect 어휘·소유권 분리·기본값을 결정했다.
product는 닫힌 effect enum `required`/`optional`/`skippable`와 각 effect의 accept-step 의미만 소유, adapter는 tier 이름·surface→tier 매핑·per-tier 임계값(reliability floor 포함) 소유.
남은 건 **구현(enforcement)**: adapter 블록 파서, `required` tier에서 clean·reliable·accept read 또는 명시적 waiver 없으면 accept 차단, waiver 기록, reliability floor를 adapter-resolvable로 전환.
gap-tolerance는 균일한 product 상수로 유지(이번 슬라이스에서 adapter화하지 않음).

## Current State

- 커밋 `76aa5165`(계약 + final-acceptance-set.md·master-plan 정렬). **아직 push 안 함 — push 후 이 줄 갱신/삭제.** base = origin/main `06f421e9`.
- bounded fresh-eye critique 1회 실행(verdict revise, 0 blockers). should-fix 2 + nit 2를 런타임 대조 후 모두 반영(계약 Critique 섹션에 기록).
- 코드 변경 없음. docs-only. `lint:links`/`lint:contracts`/`lint:specs` green. 전체 `npm run verify`는 push 전 실행 필요.
- 잠정 product 상수(`internal/runtime/acceptance.go`): reliability floor=10, gap tolerance=5.0. 계약은 floor를 adapter-owned per-tier로 전환하기로 결정(impl 미착수).

## Next Session — impl(enforcement) 슬라이스

1. 사용자에게 계약 리뷰 통과 여부 + 커밋 `76aa5165` push 여부 확인(자동 금지).
2. 승인 시 charness:impl — 먼저 `acceptance-risk-tier.md`의 `First Implementation Slice`와 `Probe Questions`를 읽고 좁힌다.
   - surface 키잉은 near-now 결정: `cautilus.improve_search_result.v1`에 top-level surface 키가 없음(`inputFile`/`improveInputFile` 경로만). 키를 result에 추가(스키마 등록)하거나 `improveInputFile`→target 정규 복원 경로를 정의. path-as-identity는 fragile.
   - `BehaviorSurface` enum(`internal/runtime/intent.go`)과 이름 충돌 주의 — tiered 단위는 그 enum 값이 아니라 consumer target.
3. 스키마 신규 surface는 Node·Go contract-version 양쪽 등록, 각 Success Criterion에 acceptance check 1개씩.

## Discuss

- **기본 effect = `optional`** 결정이 리뷰의 핵심 쟁점: undeclared surface에 net-new waiver-on-skip을 도입함(현재 런타임엔 waiver 메커니즘 자체가 없음). zero-churn 대안은 `skippable` 기본값. 계약은 intent-fidelity를 택함 — 사용자 확정 필요.
- risk-tier **카테고리·tier 이름은 host/adapter 소유**(product가 위험 범주 정의 금지, 라벨/effect 어휘만).
- (별도 dormant 트랙) HITL 스펙다운 리뷰는 사용자 신호 대기. 재개 시 charness:quality → charness:hitl, 스코프는 사용자가 좁힌다. 자동 착수 금지.

## References

- 계약(canonical): `docs/contracts/acceptance-risk-tier.md`; 메커니즘 SOT: `docs/contracts/final-acceptance-set.md`; budget-tier 소유 모델: `docs/contracts/improvement-search.md` lines 65-66
- 코어: `internal/runtime/acceptance.go`(`BuildAcceptanceReport` floor/tolerance 인자), `internal/runtime/intent.go`(`BehaviorSurfaces` enum), `fixtures/improve-search/result.schema.json`
- 로드맵: `docs/master-plan.md`(Phase 5: 메커니즘 shipped + risk-tier specified, enforcement deferred)
- dormant 트랙 상세(단일소스): 릴리스 `charness-artifacts/release/latest.md`; eval-trust `charness-artifacts/eval-trust/2026-06-21-fork-b-eval-overassignment-measurement.md`; specdown 아펙스 `docs/specs/index.spec.md`
