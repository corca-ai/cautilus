# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행 — Fork B slice 1+2 + gate-router coherence guard landed/committed(미push, origin 대비 8 ahead). 다음 substantive 작업을 사용자와 결정: (a) Fork B 다음 슬라이스(잔여 overlap eval→det 6개 중 #9 command-absence 또는 #10 schema-field-persistence 권장), 또는 (b) gate-router per-verb dead-case 실수정(follow-up: gate-router-deadcase-fixes, 현재 영향 0). 먼저 charness-artifacts/eval-trust/2026-06-21-fork-b-eval-overassignment-measurement.md "After: CLI-flag-semantics"+"Remaining" 와 charness-artifacts/debug/2026-06-21-gate-router-verb-coverage-deaths.md 를 읽고 분기를 제시하세요.`

mention-only 픽업이어도 재독에 그치지 말고 위 분기를 사용자에게 제시하세요. shape 선택은 over-flip 위험이 named-packet/CLI-flag보다 큰 잔여 6개라 사용자 합의 후 진행.

## Current State

- **gate↔router coherence guard landed — commit `28ddb5cb`.** `TestGateRouterCoherence`: 라우터가 라우팅할 수 있는 shape는 반드시 게이트(`claimLineLooksUseful`)를 통과해야 한다는 invariant를 강제. reachable 10 case + 알려진 5 latent death(allowlist, 고치면 reachable로 옮기도록 강제). ships-class 구조적 사망을 빌드에서 잡는 가드. test-only.
- **gate-router verb-coverage 감사(debug) landed — commit `df978ac6`.** `charness-artifacts/debug/2026-06-21-gate-router-verb-coverage-deaths.md`: ships 디버그의 `follow-up: gate-router-coverage` 해소. 5개 구조적 사망 + ~12 부분 사망 발견, **현재 코퍼스 영향 0(latent)**, 실측 확인. ships 디버그의 "다른 case는 co-occurrence-safe" 가정 반증.
- **Fork B slice 2 (CLI-flag-semantics → deterministic) landed — commit `8f8a01f9`.** `cliFlagSemanticsClaim`: long `--flag` + flag-effect verb `{keeps,copies,extracts}`, judgment-verb guard가 bare `" judge "`는 허용. slice 1(named-packet) `881ee566`, rune-bound+R12 `acfc03fc`.
- 모든 슬라이스 spec→critique→impl→measure→review 풀 사이클(bounded fresh-eye 위임). `npm run verify` green, `hooks:check` ready.
- **미push** (origin/main 대비 8 ahead). claim-source 편집 후 `claims:refresh:all` 이미 반영, claim packet gitCommit도 HEAD로 sync됨 → push 가능.

## 측정 핵심 (누적, SOT는 References)

- overlap agreeing **34→36**, `eval→det` **8→6**(#3 codex flags, #7 output-text-key 해소), over-correction(det→eval-key=5, det→human-key=0) 신규 0.
- live `cautilus-eval` 168→165(−3 = overlap flip #3/#7 + off-overlap collateral `5eb5`). 모집단 488→489(+1 prose self-extraction).
- **잔여 overlap `eval→det` = 6**(Fork B 타깃). `human→det` ×9는 R6/R12 scope.

## Next Session

1. **Fork B 다음 슬라이스(권장):** 잔여 6개 중 #9 command-absence("avoid a `claim group` command", R12 capability-existence의 역, 깨끗한 구조 신호) 또는 #10 schema-field-persistence("agent emits them: `primaryEpic`, …" backtick 필드 리스트, named-packet spec이 deferred한 그것). 둘 다 named-packet/CLI-flag급 정밀. 나머지(#1 packet-prose, #2 static-taxonomy, #4 status-routing, #8 R6-ish)는 over-flip 위험 더 큼. 각자 frozen golden + negative control + over-flip surface 전수 측정 필수.
   - **주의:** #9/#10 같은 새 라우터 case를 추가하면 그 verb가 lexicon gate를 통과하는지 확인하고 `TestGateRouterCoherence`에 행 추가(안 하면 ships-class 사망 재발). 새 case의 트리거 verb가 게이트에 없으면 게이트도 같이 손봐야 함.
2. **gate-router per-verb dead-case 실수정(follow-up: gate-router-deadcase-fixes):** 5개 latent death 중 실제 라인이 생기는 것부터. 단 `" needs "`는 거의 모든 문장에 있어 lexicon 추가 금지 → case가 lexicon-companion을 동반 요구하도록 restructure. `" enforces "`/`" showed "`는 저blast. 현재 영향 0이라 비긴급.
3. **#8 R6-ish boundary**는 Fork B가 아니라 R6/R12 family(human→det ×9와 동형) 결정으로 묶을 것.
4. **선재 latent 버그(범위 밖):** `truncateReviewSourceRefs`(claim_discovery.go) byte-slice excerpt 멀티바이트 rune 분할 가능.
5. **push 전:** claim-source 추가 편집 시 `npm run claims:refresh:all` 후 push.

## Discuss

- 다음 Fork B shape 우선순위(잔여 6개) 또는 per-verb dead-case 실수정 중 무엇을 먼저 할지.
- accepted residual(기록됨): agent-behavior + flag-effect verb 조합 라인은 flip됨. 현재 live 0건, 측정 시 재검증. 나타나면 actor-guard.

## References

- Fork B 측정+게이트(SOT): `charness-artifacts/eval-trust/2026-06-21-fork-b-eval-overassignment-measurement.md`
- gate-router 감사 debug: `charness-artifacts/debug/2026-06-21-gate-router-verb-coverage-deaths.md`(sibling: `…r12-ships-lexicon-gate-dead.md`)
- CLI-flag build contract: `charness-artifacts/eval-trust/2026-06-21-fork-b-cli-flag-semantics.spec.md`
- named-packet build contract: `charness-artifacts/eval-trust/2026-06-21-fork-b-named-packet-routing.spec.md`
- 계약: `docs/contracts/facet-decomposition.md`(Fork B slice 1+2)
- 엔진: `internal/runtime/claim_discovery.go`(`cliFlagSemanticsClaim`, `namedPacketEmissionClaim`, `classifyClaimLine`, `claimLineLooksUseful`, `defaultClaimLexiconTerms`, `classifyClaimLine` switch)
- 테스트: `internal/runtime/claim_discovery_test.go`(`TestGateRouterCoherence`, `TestClaimClassificationForkBCLIFlagSemanticsRoutingIsFrozen`, `TestCliFlagSemanticsClaimGuard`)
- ground truth: `charness-artifacts/eval-trust/goldset-v2-reextract-head/gold-set-proposal.json`(answer key)
