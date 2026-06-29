# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행 — #51 risk-tier 정책 read-time + skip-time 게이트 구현 완료 + v0.18.0 릴리즈 완료(공개 검증됨). 다음 트랙(아래 Discuss)을 사용자와 좁힌 뒤 착수한다.`

mention-only 픽업이면 현재 상태(아래)만 확인하고, 다음 트랙 착수 여부를 사용자와 좁힌 뒤 진행한다.
자동 트랙 착수 금지.

## Continuation Capability

#51 risk-tier 정책이 **read-time + skip-time 모두 landed**다 — 정책 트랙은 닫혔다(계약 Status: Implemented, 전 Success Criteria proven).
read-time: `cautilus evaluate acceptance`가 read를 *실제로 돌렸을 때* `required` 미충족이면 차단(exit 1)·waiver override, per-tier floor 적용.
skip-time: `cautilus doctor`가 read-only `acceptanceReadiness` 게이트를 보고 — `required` target에 read도 waiver도 없으면 `blocked`(ready=false), `optional`/default는 `skip_pending_waiver`(non-blocking), `skippable`은 `exempt`. nil/empty history는 fail-closed.
skip을 명시적으로 기록하려면 `cautilus evaluate acceptance waive-skip --target <id> --reason <why> --history-file <path>`(doctor는 read-only 유지, 기록은 이 명령이 소유).

## Current State

- skip-gate 코드/문서 커밋 + **v0.18.0 릴리즈 완료**. 릴리즈는 repo-owned `scripts/release/prepare-release.mjs`(버전 5개 표면 bump + skills:sync-packaged + claim-freshness) → 내러티브 작성 → `publish-release.mjs`(branch+tag push) → tag-triggered `release-artifacts.yml` 워크플로(run `28349446031`)가 GitHub 릴리즈 생성+공개 검증. 공개 URL `https://github.com/corca-ai/cautilus/releases/tag/v0.18.0` HTTP 200(distinct-channel) 확인. 릴리즈 기록: `charness-artifacts/release/latest.md`.
- ⚠️ 릴리즈 트랩(재발): charness `release` 스킬의 generic `publish_release.py`/`bump_version.py`는 `package.json`에 `claude.manifest.version` 구조를 가정해서 이 repo(flat package.json)에선 `KeyError: 'claude'`로 첫 스텝부터 실패. **repo-owned `scripts/release/*`가 정식 경로**. 다음 릴리즈도 repo 스크립트로 직접 진행할 것(charness 릴리즈 스킬 publisher 사용 금지).
- 계약 `docs/contracts/acceptance-risk-tier.md` Status: **Implemented**. Implementation Status 항목 5–9가 landed 명세, 전 SC proven(테스트명 명시).
- 구현 critique 1회(fresh-eye 서브에이전트, verdict `ready`, 0 blockers). should-fix 2건 반영: (1) non-`required` target에 `--waiver` 주면 무시 대신 stderr warning, (2) acceptance 게이트만 실패할 때 doctor summary가 "adapter 불완전" 대신 "pending acceptance read"를 명시. nit(history-file이 `--scope agent-surface`에선 무시됨; status가 `incomplete_adapter` 공유)은 deferred로 계약에 기록.
- 설계 결정(사용자 확정): enforcement 표면 = read-only `cautilus doctor`(Cautilus엔 기계적 accept 명령 없음), operator-acceptance.md 인간 단계가 이 게이트를 가리킴; waiver-on-skip 기록은 별도 `waive-skip` 명령.
- 스키마: read 기록의 `targetId`, doctor의 `acceptanceReadiness` 블록 모두 additive(strict schema 없음) → contract-version bump 불필요.
- `npm run verify` green, `npm run hooks:check` ready. claim 패킷은 이미 refresh됨(계약·master-plan이 claim source) → push 시 staleness 나면 `npm run claims:refresh:all` 후 재push.

## Next Session

1. 다음 트랙을 Discuss에서 사용자와 좁힌다. risk-tier 정책 트랙엔 남은 슬라이스 없음(Deferred Decisions만 — 실제 consumer 필요 시 별도 계약).
2. 후보 트랙: (a) dormant HITL 스펙다운 리뷰 재개(사용자 신호 시), (b) master-plan Phase 5 "Still open" 항목, (c) risk-tier Deferred Decisions 중 consumer 수요가 생긴 것. 자동 착수 금지.

## Discuss

- risk-tier 정책 트랙은 닫혔다 — read-time·skip-time·"accept 시점" 정의·구현 critique 모두 확정, 재론 불필요.
- 계약에 남긴 Deferred Decisions(필요 시 별도 슬라이스): `default_effect: required`에서 *미선언* target은 doctor 게이트가 열거 불가(read-time `--target`로만 강제); acceptance 게이트만 실패해도 top-level status는 `incomplete_adapter` 공유(전용 status는 consumer 분기 필요 시).
- risk-tier **카테고리·tier 이름은 host/adapter 소유**(product가 위험 범주 정의 금지, effect 어휘만).
- (별도 dormant 트랙) HITL 스펙다운 리뷰는 사용자 신호 대기. 재개 시 charness:quality → charness:hitl, 스코프는 사용자가 좁힌다. 자동 착수 금지.

## References

- 계약(canonical): `docs/contracts/acceptance-risk-tier.md`(Implementation Status = landed 전체); 메커니즘 SOT: `docs/contracts/final-acceptance-set.md`
- 코어: `internal/runtime/acceptance_readiness.go`(`BuildAcceptanceReadiness`), `internal/runtime/adapter.go`(`DoctorRepo` + `onlyAcceptanceReadinessFailing`), `internal/app/app.go`(`handleEvalAcceptanceWaiveSkip`·`handleEvalAcceptance`·`parseDoctorArgs`), `internal/runtime/acceptance.go`(`RecordAcceptanceRead` w/ targetId), `internal/runtime/risk_tier.go`(`ResolveAcceptanceRiskTier`·`RecordAcceptanceWaiver`)
- 테스트: `internal/runtime/acceptance_readiness_test.go`, `internal/app/cli_smoke_test.go`(`TestCLIDoctorAcceptanceSkipGate*`·`TestCLIEvaluateAcceptance*`)
- 로드맵: `docs/master-plan.md`(Phase 5 Also shipped: risk-tier read-time + skip-gate landed)
- dormant 트랙 상세(단일소스): 릴리스 `charness-artifacts/release/latest.md`; eval-trust `charness-artifacts/eval-trust/2026-06-21-fork-b-eval-overassignment-measurement.md`; specdown 아펙스 `docs/specs/index.spec.md`
