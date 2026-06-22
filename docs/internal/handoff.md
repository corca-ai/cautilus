# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행 — v0.17.0 릴리시 완료(공개 검증됨). 다음은 HITL 스펙다운 리뷰(전체 spec 트리). 사용자가 먼저 직접 읽고 코멘트한 뒤 시작하기로 함 — 사용자가 "시작" 신호를 주기 전에는 quality 권고/HITL 루프를 자동 착수하지 말 것. 시작 신호가 오면: 먼저 charness:quality로 specdown 검증 권고를 받고(repo 계약: validation-shaped는 quality 먼저), 그다음 charness:hitl로 docs/specs 전체 트리(contracts/promises/evidence/rules/ledger/audit + index.spec.md)를 chunked/resumable 루프로 리뷰한다.`

이 트리거는 픽업 시 자동 착수가 아니라 **사용자 코멘트 대기**가 기본이다. mention-only 픽업이면 현재 상태만 확인하고, HITL 스펙다운을 사용자가 어떻게 좁히고 싶은지(전체 vs 특정 영역, 무엇을 사람이 판정할지) 물은 뒤 진행한다.

## Current State

- **v0.17.0 릴리시 완료 + 공개 검증됨.** tag `v0.17.0`@`0fa8a4cf` push, `release-artifacts` 워크플로 success(5m14s), 공개 GitHub 릴리시 published(non-draft) + 자산 7개(darwin/linux × arm64/x64 + checksums + sha256 + notes). install.sh smoke green(`--version`→0.17.0, `update`→already current, `ok:true`). minor 범프(additive runner-readiness + specdown 재구조), delegated release critique = ready-to-publish.
- **origin/main = `0fa8a4cf`** (릴리시 commit). 이 핸드오프 commit만 그 뒤에 있음.
- Fork B + gate-router 작업(이전 트랙)은 모두 land+push+release. 측정 SOT는 References.

## Next Session — HITL 스펙다운 (사용자 신호 대기)

- **타깃:** `docs/specs` 전체 트리 광범위 리뷰(사용자 선택). proof-spine + typed traceability로 최근 재구조됨. apex `index.spec.md`는 7/7 proven 주장.
- **경로:** charness:quality(검증 권고) → charness:hitl(chunked/resumable, 청크별 사람 판정). repo 계약상 validation-shaped/operator-reading은 quality를 먼저 거친다.
- **무엇을 판정?(사용자와 좁힐 것):** (a) promise/claim spec과 proof badge(proven/declared/promised)가 엔진 변경 후에도 정직한가, (b) executable specdown 체크 drift/실패, (c) 전체 트리 청크 리뷰. 사용자가 직접 읽고 코멘트한 결과로 스코프가 정해질 것.

## Carry-forward (릴리시로 응결됨, 재개 시 참고)

- **Fork B 잔여 eval→det = 4** (deferred, over-flip 위험 큼): #1 packet-emission prose, #2 static-taxonomy, #4 status-routing, #8 R6-ish boundary. #8은 R6/R12 ownership-family 결정(human→det ×9와 동형), Fork B discriminator 아님.
- **deferred gate-router deaths**(저blast 아님): ` needs `(claimNeedsScenario, restructure 필요), provider-failover, provider-caveat — `TestGateRouterCoherence` allowlist에 DEATH-로 잔존, 코퍼스 영향 0.
- 선재 latent 버그(범위 밖): `truncateReviewSourceRefs`(claim_discovery.go) byte-slice excerpt 멀티바이트 rune 분할 가능.

## Discuss

- HITL 스펙다운 스코프는 사용자 코멘트로 확정. 자동 착수 금지.
- Fork B 재개(C1)는 한계효용 체감+위험 증가 구간 — 재개한다면 R6/R12 family(C2)나 남은 #1/#2/#4 중 over-flip surface 측정 후 선택.

## References

- 릴리시 기록: `charness-artifacts/release/latest.md`(v0.17.0, Release Scope/Verification)
- Fork B 측정 SOT: `charness-artifacts/eval-trust/2026-06-21-fork-b-eval-overassignment-measurement.md`(After: schema-field-persistence / command-absence)
- 슬라이스 contract: `charness-artifacts/eval-trust/2026-06-22-fork-b-schema-field-persistence.spec.md`, `2026-06-22-fork-b-command-absence.spec.md`
- gate-router: `charness-artifacts/debug/2026-06-21-gate-router-verb-coverage-deaths.md`(LANDED: 저blast batch + deferred)
- 계약: `docs/contracts/facet-decomposition.md`(Fork B 1–4), `docs/contracts/claim-discovery-workflow.md`(lexicon)
- 엔진: `internal/runtime/claim_discovery.go` / 테스트: `internal/runtime/claim_discovery_test.go`
- specdown 아펙스: `docs/specs/index.spec.md`; ground truth: `charness-artifacts/eval-trust/goldset-v2-reextract-head/gold-set-proposal.json`(overlap 56)
