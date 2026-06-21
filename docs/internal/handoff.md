# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행 — Fork B slice 1+2 landed/committed(미push, origin 대비 5 ahead). 다음 substantive 슬라이스를 사용자와 결정: (a) Fork B 다음 슬라이스(잔여 overlap eval→det 6개 중 하나에 gold-confirmed discriminator 추가), 또는 (b) gate↔router verb-coverage 감사 follow-up. 먼저 charness-artifacts/eval-trust/2026-06-21-fork-b-eval-overassignment-measurement.md 의 "After: CLI-flag-semantics" + "Remaining" 섹션을 읽고 분기를 제시하세요.`

첫 tool call = Fork B 측정 아티팩트의 최신 "After"/"Remaining" read. mention-only 픽업이어도 재독에 그치지 말고 위 분기를 사용자에게 제시하세요.
shape 선택은 named-packet/CLI-flag보다 over-flip 위험이 큰 잔여 6개라 사용자와 우선순위 합의 후 진행(아래 Discuss).

## Current State

- **Fork B slice 2 (CLI-flag-semantics → deterministic) landed — commit `8f8a01f9`.** `cliFlagSemanticsClaim`: long `--flag` 토큰 + gold-confirmed flag-effect verb `{keeps,copies,extracts}` → deterministic. judgment-verb guard가 bare noun `" judge "`는 **허용**(flag 출력의 reader이지 품질 판정 아님 → gold-confirmed #7 extraction 살림). tight verb set(guard 아님)이 정밀 제어: agent-behavior flag claim(`doctor status --json` → agent가 branch choose)은 verb가 set 밖이라 eval 유지. `namedPacketEmissionClaim` 바로 다음에 case 삽입.
- **Fork B slice 1 (named-packet routing) landed — commit `881ee566`.** rune-bound recall + R12 ships는 `acfc03fc`.
- 세 슬라이스 모두 spec→critique→impl→measure→review 풀 사이클(bounded fresh-eye 각 2회). slice 2: 2차 review가 counterfactual로 "정확히 3 flip" 검증, honesty nit 2건 측정 아티팩트에 반영.
- `npm run verify` green(367s), `claims:refresh:all` 반영(population 489), `hooks:check` ready.
- **아직 push 안 함** (origin/main 대비 5 ahead). claim-source 편집(internal/runtime/claim_discovery.go, docs/contracts/facet-decomposition.md) 후 `claims:refresh:all` 이미 돌림 → push 가능 상태.

## 측정 핵심 (누적, SOT는 References)

- 모집단 488→489(+1 contract-realign prose self-extraction, 측정 표에 분리 기록). overlap 분모 54→56(슬라이스 누적).
- overlap agreeing **34→36**, overlap `eval→det` **8→6**(#3 codex flags, #7 output-text-key 해소), over-correction(det→eval-key=5, det→human-key=0) **신규 0 유지**.
- live `cautilus-eval` **168→165**(−3 = overlap flip #3/#7 + off-overlap collateral `5eb5` canonical-filename contract). predicate는 live 7개의 routing authority지만 true flip은 3개(나머지 4개는 이미 deterministic, outcome 불변).
- **잔여 overlap `eval→det` = 6** (Fork B 타깃). `human-auditable→deterministic` ×9는 R6/R12 scope(Fork B 아님).

## Next Session

1. **Fork B 다음 슬라이스(권장):** 잔여 6개 eval→det 중 하나에 gold-confirmed discriminator 추가. 후보 shape(측정 "Remaining" 참조): packet-emission prose(#1 "durable eval packets"), static-taxonomy(#2 "two top-level surfaces: dev/app"), status-routing(#4 "if setup ready but runner proof not…"), R6-ish boundary(#8 "agent-first without … host-specific agent runtime"), command-absence(#9 "avoid a `claim group` command"), schema-field-persistence(#10 "agent emits them: `primaryEpic`, …"). 모두 named-packet/CLI-flag보다 over-flip 위험 큼 → frozen golden + negative control + over-flip surface 전수 측정 필수.
2. **gate↔router verb-coverage 감사(follow-up, cheaper):** `classifyClaimLine`의 모든 트리거 토큰이 `claimLineLooksUseful` lexicon gate를 통과(또는 동반 verb로 커버)하는지 체계 점검. `" ships "` 같은 구조적 사망 재발 방지. debug sibling-search `follow-up: gate-router-coverage`.
3. **선재 latent 버그(범위 밖, 기록됨):** `truncateReviewSourceRefs`(claim_discovery.go) byte-slice excerpt 절단 — 멀티바이트 rune 분할 가능(review-input 렌더 경로).
4. **push 전:** claim-source(docs/specs/**, docs/contracts/**, README, AGENTS, internal/runtime/claim_discovery.go 등) 추가 편집 시 `npm run claims:refresh:all` 후 push.

## Discuss

- 다음 Fork B shape 선택: 잔여 6개 모두 실재하나 named-packet/CLI-flag보다 over-flip 위험 큼. 특히 static-taxonomy(#2)·status-routing(#4)는 열거/조건 패턴이 eval 라인과 겹침. 사용자와 우선순위 합의 후 진행.
- Fork B를 더 갈지 vs gate-coverage 감사를 먼저 할지(후자가 cheaper, 재발 방지).
- accepted residual(기록됨): agent-behavior + flag-effect verb 조합 라인은 flip됨. 현재 live 0건, 측정 시 재검증. 나타나면 actor-guard 필요.

## References

- Fork B 측정+게이트(SOT): `charness-artifacts/eval-trust/2026-06-21-fork-b-eval-overassignment-measurement.md`
- CLI-flag build contract: `charness-artifacts/eval-trust/2026-06-21-fork-b-cli-flag-semantics.spec.md`
- named-packet build contract: `charness-artifacts/eval-trust/2026-06-21-fork-b-named-packet-routing.spec.md`
- 계약: `docs/contracts/facet-decomposition.md`(Fork B 상태, slice 1+2)
- 엔진: `internal/runtime/claim_discovery.go`(`cliFlagSemanticsClaim`, `cliFlagOptionPattern`, `namedPacketEmissionClaim`, `classifyClaimLine`)
- 테스트: `internal/runtime/claim_discovery_test.go`(`TestClaimClassificationForkBCLIFlagSemanticsRoutingIsFrozen`, `TestCliFlagSemanticsClaimGuard`)
- ground truth: `charness-artifacts/eval-trust/goldset-v2-reextract-head/gold-set-proposal.json`(answer key)
