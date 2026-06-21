# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행 — Fork B slice 3+4(#10,#9) + gate-router 저blast deadcase 수정 landed/committed(미push, origin 대비 14 ahead). (a)·(b) 둘 다 완료. 남은 eval→det overlap=4(전부 over-flip 위험 큰 deferred shape). 먼저 charness-artifacts/eval-trust/2026-06-21-fork-b-eval-overassignment-measurement.md "After: command-absence"를 읽고, 아래 "Next Session"의 세 방향(C1 Fork B harder shapes / C2 R6/R12 family / C3 push 후 pivot)을 사용자에게 제시한 뒤 선택대로 진행하라.`

이번 세션의 명시적 (a)+(b) 위임은 끝났다. 남은 일은 over-flip 위험이 더 큰 영역이라 방향 선택이 필요하니, mention-only 픽업이면 "Next Session"의 세 방향을 제시하고 사용자 선택을 받아 진행한다(자동으로 한 방향 착수하지 말 것). 새 Fork B 슬라이스는 spec→critique(위임)→impl→measure→review(위임) 풀 사이클 + frozen golden/negative control 필수(이번 세션 패턴).

## Current State

- **Fork B slice 3 (#10 schema-field-persistence → deterministic) landed — `ae369fa7`.** `schemaFieldPersistenceClaim`: persistence verb {persist,persists,persisted} AND ≥2 distinct backtick camelCase field tokens, read from ORIGINAL-case line(라우터가 lowercase하므로 camelCase 신호 보존 위해). judgment guard 공유.
- **Fork B slice 4 (#9 command-absence → deterministic) landed — `30b79b55` (+ review followup `12ce8128`).** `commandAbsenceClaim`: R12 capability-existence의 역. command-addition absence phrasing {avoid a/the/adding, should not add, should not introduce, does not add} AND backtick token AND command/subcommand. bare should not/does not/without는 제외(danger axis: 진짜 eval claim과 공존).
- **gate-router 저blast deadcase 수정 landed — `dddfef0f`.** lexicon에 특정 phrase 추가(` not gated `/` not blocked `/` sessions showed `/` runs showed `/` enforces `) + deterministicCLIGatingClaim에 "runs/run without … credential" branch(double-miss 해소). 4 death를 `TestGateRouterCoherence` allowlist→reachable로 이동.
- 모든 슬라이스 spec→critique(위임)→impl→measure→review(위임) 풀 사이클, 모든 delegated review **clean**. `npm run verify` green, `hooks:check` ready.
- **미push** (origin/main 대비 14 ahead). claim-source 편집 후 `claims:refresh:all` 반영 완료, 패킷 HEAD와 sync. push 가능 상태.

## 측정 핵심 (누적, SOT는 References)

- overlap eval→det **6→5→4**(#10, #9 해소). agreeing **36→37→38**. over-correction(det→eval-key=5, det→human-key=0) 신규 0 유지. live `cautilus-eval` 165→164.
- deadcase 수정: gold-overlap 불변(38/4/5/0, live eval 164), ` enforces `가 dropped됐던 deterministic lint-gate claim 2건 정상 recall 회복(net +2 deterministic). 나머지 4 phrase는 +0.
- **잔여 overlap eval→det = 4**: deferred shape #1 packet-emission prose, #2 static-taxonomy, #4 status-routing, #8 R6-ish boundary. `human→det` ×9는 R6/R12 scope.

## Next Session — 방향 선택 (자동 착수 금지, 사용자 제시 후 진행)

**C1. Fork B 남은 shape (#1/#2/#4).** 잔여 eval→det 4 중 #8을 제외한 셋. 모두 named-packet/CLI-flag/#10/#9보다 **over-flip 위험 큼**(handoff 기존 평가). 착수 시 각 shape의 over-flip surface 전수 측정 후 tight gold-seed discriminator + frozen golden/negative control, 풀 사이클. #1 packet-prose가 가장 모호(broad positioning과 경계).
**C2. R6/R12 family 결정.** `human-auditable → deterministic` ×9 + #8 R6-ish boundary는 Fork B discriminator가 아니라 R6/R12 ownership-family 정책 결정. 별도 spec 필요(어디까지 deterministic로 볼지 경계).
**C3. push 후 pivot.** 14 commit push하고 master-plan의 다른 우선순위로 전환. (push는 outward-facing이니 사용자 확인.)

**deferred gate-router deaths (저blast 아님, 별건):** ` needs `(claimNeedsScenario)는 ubiquitous → case가 lexicon-companion 동반 요구하도록 restructure 필요(bare 추가 금지). provider-failover, provider-caveat도 deferred(`TestGateRouterCoherence` allowlist에 DEATH-로 잔존). 현재 코퍼스 영향 0.

## Discuss

- 다음 방향은 C1/C2/C3 중 사용자 선택. 권장: 남은 Fork B(C1)는 한계효용 체감+위험 증가 구간이라, C2(R6/R12 family로 human→det ×9까지 한번에)나 C3(push 후 pivot)가 ROI 더 높을 수 있음. 사용자 판단 필요.
- accepted residual(기록 유지): agent-behavior + flag-effect verb 조합 라인은 flip됨(slice 2). 현재 live 0건. 나타나면 actor-guard.
- 선재 latent 버그(범위 밖): `truncateReviewSourceRefs`(claim_discovery.go) byte-slice excerpt 멀티바이트 rune 분할 가능.

## References

- Fork B 측정(SOT): `charness-artifacts/eval-trust/2026-06-21-fork-b-eval-overassignment-measurement.md`("After: schema-field-persistence", "After: command-absence")
- 슬라이스 build contract: `charness-artifacts/eval-trust/2026-06-22-fork-b-schema-field-persistence.spec.md`, `2026-06-22-fork-b-command-absence.spec.md`
- gate-router deadcase: `charness-artifacts/debug/2026-06-21-gate-router-verb-coverage-deaths.md`(LANDED 노트에 저blast batch + deferred 기록)
- 계약: `docs/contracts/facet-decomposition.md`(Fork B slice 1–4), `docs/contracts/claim-discovery-workflow.md`(lexicon)
- 엔진: `internal/runtime/claim_discovery.go`(`schemaFieldPersistenceClaim`, `commandAbsenceClaim`, `deterministicCLIGatingClaim`, `defaultClaimLexiconTerms`, `classifyClaimLine` switch)
- 테스트: `internal/runtime/claim_discovery_test.go`(`TestClaimClassificationForkB*RoutingIsFrozen`, `Test*ClaimGuard`, `TestGateRouterCoherence`, `TestClaimClassificationPortableDefaultsAreFrozen`)
- ground truth: `charness-artifacts/eval-trust/goldset-v2-reextract-head/gold-set-proposal.json`(answer key, overlap 56)
