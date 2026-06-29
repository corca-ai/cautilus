# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행 — risk-tier read-time enforcement 구현 완료(커밋 ac9bada6·9ccd8634·34df49af, 미push). 먼저 사용자에게 push 여부를 확인한 뒤, 승인되면 charness:impl로 skip-time readiness 게이트 슬라이스를 구현한다.`

mention-only 픽업이면 현재 상태(아래)만 확인하고, push·다음 슬라이스 착수 여부를 사용자와 좁힌 뒤 진행한다.
자동 push·자동 impl 착수 금지.

## Continuation Capability

#51 risk-tier 정책의 **read-time enforcement**가 끝났다 — adapter `acceptance_risk` 블록 파서, per-tier reliability floor, `cautilus evaluate acceptance`의 block-or-waiver 결정이 모두 landed(테스트 green).
read를 *실제로 돌렸을 때* `required` 미충족이면 차단(exit 1)·waiver로 override, per-tier floor 적용, undeclared→default `optional`.
남은 건 **skip-time readiness 게이트**: read를 *아예 안 돌린* `required` target을 accept 전에 잡아내고(doctor/readiness가 scenario history에서 read/waiver 유무를 확인), `optional`/default는 waiver-on-skip을 기록, `skippable`은 면제.
이걸 하려면 acceptance read 기록(`RecordAcceptanceRead`)에 target id를 추가해야 한다(현재는 candidate id·scenario id만 기록 → read를 target에 매칭 불가).

## Current State

- 커밋 `ac9bada6`(slice1: 블록+resolution) → `9ccd8634`(slice2: 명령 enforcement) → `34df49af`(fail-closed fix + 계약 sync). **3개 미push — push 후 이 줄 갱신/삭제.** base = origin/main `06f421e9`(그 위에 이전 risk-tier 계약 커밋 4개 + 이번 3개 = 총 7개 미push).
- 계약 `docs/contracts/acceptance-risk-tier.md` Status: **Partially implemented**. read-time success criteria는 proven(테스트명 명시), skip-time SC2/SC3은 readiness 게이트로 deferred. Probe 4개 모두 resolved(Probe Questions 섹션).
- 구현 critique 1회(verdict `ready`, 0 blockers). should-fix(invalid adapter + 정책 의도 시 fail-open) 반영 완료. nit(exit 1이 policy-block과 input-error 공유)은 report의 `acceptanceDecision`로 구분 — 코드 변경 불필요로 판단.
- 새 필드(`riskTier`/`acceptanceDecision`/`waiver` on report, `acceptanceWaivers` in history)는 `cautilus.acceptance_report.v1`·scenario history에 additive(strict schema 없음) → contract-version bump 불필요.
- gap-tolerance는 균일 product 상수 유지(adapter화 안 함). reliability floor는 per-tier adapter-resolvable로 landed.

## Next Session — skip-time readiness 게이트 슬라이스

1. 사용자에게 push 여부 확인(자동 금지).
2. 승인 시 charness:impl — `acceptance-risk-tier.md` `Implementation Status` 항목 5가 스펙. 먼저 좁힐 것:
   - `RecordAcceptanceRead`에 target id 추가(현 시그니처: candidate id·scenario ids만) + `handleEvalAcceptance` 호출부·기존 테스트 갱신.
   - readiness/doctor 게이트: adapter `acceptance_risk.targets` 중 effect=`required`인 target마다 scenario history에 read 또는 waiver 있는지 확인 → 없으면 blocked 보고. `optional`/default는 read 없으면 waiver-on-skip 기록, `skippable`은 면제.
   - "accept" 시점 정의: Cautilus엔 기계적 accept 명령이 없음 → doctor/readiness가 enforcement 표면. operator-acceptance.md 인간 단계와 어떻게 연결할지 결정.
3. 각 skip-time Success Criterion(SC2/SC3)에 executable test 1개씩.

## Discuss

- read-time enforcement·4개 probe·구현 critique는 확정 — 재론 불필요. 열린 건 skip-time 게이트의 "accept 시점" 정의(doctor/readiness vs operator 단계)뿐.
- risk-tier **카테고리·tier 이름은 host/adapter 소유**(product가 위험 범주 정의 금지, 라벨/effect 어휘만).
- (별도 dormant 트랙) HITL 스펙다운 리뷰는 사용자 신호 대기. 재개 시 charness:quality → charness:hitl, 스코프는 사용자가 좁힌다. 자동 착수 금지.

## References

- 계약(canonical): `docs/contracts/acceptance-risk-tier.md`(Implementation Status = 남은 슬라이스); 메커니즘 SOT: `docs/contracts/final-acceptance-set.md`
- 코어: `internal/runtime/risk_tier.go`(`ResolveAcceptanceRiskTier`·`RecordAcceptanceWaiver`·effect 상수), `internal/runtime/adapter.go`(`validateAdapterAcceptanceRisk`), `internal/app/app.go`(`handleEvalAcceptance`), `internal/runtime/acceptance.go`(`RecordAcceptanceRead`에 target id 추가 대상)
- 테스트: `internal/runtime/risk_tier_test.go`, `internal/app/cli_smoke_test.go`(`TestCLIEvaluateAcceptance*`)
- 로드맵: `docs/master-plan.md`(Phase 5: read-time landed + skip-gate 남음)
- dormant 트랙 상세(단일소스): 릴리스 `charness-artifacts/release/latest.md`; eval-trust `charness-artifacts/eval-trust/2026-06-21-fork-b-eval-overassignment-measurement.md`; specdown 아펙스 `docs/specs/index.spec.md`
