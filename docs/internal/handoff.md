# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행 — 이슈 #51 final-acceptance-set 메커니즘 슬라이스 완료(커밋 9개, verify green, 아직 push 안 함). 다음 슬라이스: acceptance read의 risk-tier 정책. 먼저 9개 커밋 push 여부를 사용자에게 확인한 뒤, charness:spec으로 risk-tier 계약을 좁히고 charness:impl로 구현한다.`

mention-only 픽업이면 현재 상태(아래)만 확인하고, push 여부와 risk-tier 스코프를 사용자와 좁힌 뒤 진행한다. 자동 push 금지.

## Continuation Capability

#51의 **메커니즘**은 끝났다 — `split: acceptance`(+`all`=train+test로 재정의), `acceptance` results mode, 검색 결과의 `heldOutExposureCount`/`heldOutScenarioIds`, `cautilus evaluate acceptance`(contamination 가드 + 일반화 갭 + reliability flag + `acceptanceReads` history), advisory-only(자동 적용/거부 없음).
남은 건 **정책**: 어떤 행동 표면에 acceptance read를 required/optional/skippable로 강제할지를 정하는 risk-tier 축. 메커니즘은 출시됨, 정책 미출시.

## Current State

- 이슈 #51 슬라이스: 커밋 `dc16402f`…`b49aaee1`(9개), `npm run verify` all phases passed(운영자 보고), golangci 0 issues, claims packet refresh됨(`claims:evidence-state:check` green). **아직 push 안 함 — push 후 이 상태 줄을 갱신/삭제할 것.**
- origin/main = `b82dd7b9`(v0.17.1). #51 9개가 그 위에 미push(base = origin/main).
- 계약 SOT: `docs/contracts/final-acceptance-set.md`(Status: Implemented). risk-tier는 "Deferred Decisions"에 명시됨.
- 잠정 product 상수(`internal/runtime/acceptance.go`): reliability floor=10, gap tolerance=5.0 — **둘 다 현재 고정 product 상수**. 계약이 deferred한 건 **reliability floor의 adapter 설정화뿐**이다(gap-tolerance를 adapter로 옮기는 건 risk-tier 슬라이스가 새로 정당화해야 하는 결정, 자동 이월 아님).
- 2회 fresh-eye critique 반영 완료(spec: profile-split 공허 가드 → contamination 검사 / impl: empty-held-out 우회 + baseline 부재 시 accept 차단).

## Next Session — risk-tier 정책 슬라이스

1. #51 커밋 9개 push 여부 사용자 확인(자동 금지).
2. charness:spec — 먼저 `final-acceptance-set.md` Deferred Decisions + `improvement-search.md` 65-66(budget-tier 소유 모델)을 읽고 좁힌다. **product**는 축/라벨 형태 + "tier가 acceptance를 required/optional/skippable로 표시한다"는 계약만 소유, **adapter**는 어떤 표면이 어느 tier인지 + reliability floor 임계값 소유. (gap-tolerance의 adapter화는 계약상 deferred 아님 — 필요하면 이 슬라이스에서 별도 정당화.)
3. charness:impl — required tier에서 acceptance read 미수행 시 doctor/readiness 또는 명령이 blocked 또는 명시적 waiver를 표면화하고, reliability floor를 adapter-configurable로 전환.

## Discuss

- risk-tier **카테고리는 host/adapter 소유**(working rules: adapter schema repo-agnostic). product가 위험 범주를 정의하면 안 됨 — 라벨/계약 형태만.
- (별도 dormant 트랙) HITL 스펙다운 리뷰는 여전히 사용자 신호 대기. 재개 시 charness:quality → charness:hitl, 스코프는 사용자가 좁힌다. 자동 착수 금지.

## References

- 계약: `docs/contracts/final-acceptance-set.md`(Deferred Decisions = risk-tier), `docs/contracts/improvement-search.md`(budget-tier 소유 모델 lines 65-66)
- 코어: `internal/runtime/acceptance.go`, `internal/app/app.go`(`handleEvalAcceptance`), `internal/cli/command-registry.json`(`evaluate acceptance`)
- 로드맵: `docs/master-plan.md`(Phase 5: shipped + risk-tier deferred)
- dormant 트랙 상세(단일소스): 릴리시 `charness-artifacts/release/latest.md`; Fork B/gate-router/latent bug `charness-artifacts/eval-trust/2026-06-21-fork-b-eval-overassignment-measurement.md`, `charness-artifacts/eval-trust/2026-06-21-rune-bound-recall.spec.md`; specdown 아펙스 `docs/specs/index.spec.md`
