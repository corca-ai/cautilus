# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행 — Fork B slice 1+2 + gate-router coherence guard landed/committed(미push, origin 대비 9 ahead). 다음은 (a)와 (b)를 둘 다 진행한다(분기 아님, 순차 실행). 먼저 charness-artifacts/eval-trust/2026-06-21-fork-b-eval-overassignment-measurement.md "After: CLI-flag-semantics"+"Remaining" 와 charness-artifacts/debug/2026-06-21-gate-router-verb-coverage-deaths.md 를 읽고, 아래 "Next Session"의 (a)·(b) 계획을 사용자에게 제시한 뒤 진행하라. (a) Fork B 다음 슬라이스(권장 shape #10 schema-field-persistence → 그다음 #9 command-absence). (b) gate-router per-verb dead-case 저blast 실수정.`

mention-only 픽업이어도 재독에 그치지 말고 (a)·(b) 둘 다 진행하라. 각 Fork B shape는 spec→critique→impl→measure→review 풀 사이클이고 over-flip 위험이 named-packet/CLI-flag보다 크니, 슬라이스 시작 시 선택 shape와 frozen golden/negative control 계획을 사용자에게 제시하고(이번 세션 패턴) 진행한다. 사용자가 순서·shape를 바꾸면 그에 따른다.

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

## Next Session — (a)와 (b) 둘 다 진행

**(a) Fork B 다음 슬라이스 [먼저].** 잔여 eval→det 6개 중 권장 순서 **#10 → #9**:
   - **#10 schema-field-persistence**("Claim-graph facets persist … the agent emits them: `primaryEpic`, `supportingEpics`, `multiEpic`, `edgeRationale`") — backtick 필드 리스트 구조 신호, named-packet spec이 명시적으로 deferred한 그것. 答키 `88ae4b…` deterministic.
   - **#9 command-absence**("The workflow should avoid a `claim group` command") — R12 capability-existence의 역, "avoid/no/should not add a \`cmd\` command" 구조 신호. 答키 `cf9b99…` deterministic. (주: `" should "` 이미 lexicon → 게이트 통과함.)
   - 각 슬라이스: spec→critique(위임)→impl→measure(over-flip surface 전수)→review(위임) 풀 사이클, frozen golden + negative control 필수. 나머지(#1 packet-prose, #2 static-taxonomy, #4 status-routing, #8 R6-ish)는 over-flip 위험 더 커서 그 뒤로.
   - **새 라우터 case 추가 규칙:** 트리거 verb가 `defaultClaimLexiconTerms` 게이트를 통과하는지 확인하고 `TestGateRouterCoherence`에 reachable 행 추가(안 하면 ships-class 사망 재발). 게이트에 없으면 게이트도 같이 손봐야 함.

**(b) gate-router per-verb dead-case 저blast 실수정 [그다음].** `follow-up: gate-router-deadcase-fixes`. 5개 latent death(debug 아티팩트) 중 **저blast부터**:
   - `historicalObservationClaim`(`" showed "`), `deterministicCLIGatingClaim`(특정 phrase "not gated"/"works without credential" admit + 라우터 double-miss 동시 수정), lint `" enforces "` — 저blast verb는 lexicon 추가 또는 case별 phrase admit.
   - **`" needs "`(claimNeedsScenario), failover verb는 lexicon 추가 금지**(ubiquitous/너무 generic) → case가 lexicon-companion을 동반 요구하도록 restructure, 또는 latent로 유지.
   - 각 수정 = 해당 death를 `TestGateRouterCoherence` allowlist에서 reachable로 이동 + 코퍼스 재측정. 현재 영향 0이라 정확도엔 비긴급이지만 (a) 직후 묶어 처리.

**(c) #8 R6-ish boundary**는 Fork B가 아니라 R6/R12 family(human→det ×9와 동형) 결정으로 별도.

**선재 latent 버그(범위 밖):** `truncateReviewSourceRefs`(claim_discovery.go) byte-slice excerpt 멀티바이트 rune 분할 가능.

**push 전:** claim-source 추가 편집 시 `npm run claims:refresh:all` 후 push.

## Discuss

- (a)·(b)는 둘 다 진행으로 확정(사용자 지시). 남은 미세 선택만: (a) 슬라이스 시작 시 shape(#10 권장) 확정, (b) 어느 death부터(저blast 권장). 슬라이스 계획 제시 후 진행, 사용자가 바꾸면 따른다.
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
