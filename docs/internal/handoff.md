# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행 — item 1+2 landed/committed(미push). 다음 substantive 슬라이스를 사용자와 결정: (a) Fork B 다음 슬라이스(잔여 eval→det shape 중 하나에 gold-confirmed discriminator 추가), 또는 (b) gate↔router verb-coverage 감사 follow-up. 먼저 charness-artifacts/eval-trust/2026-06-21-fork-b-eval-overassignment-measurement.md 의 "After" + "Remaining" 섹션을 읽고 분기를 제시하세요.`

첫 tool call = Fork B 측정 아티팩트의 "After"/"Remaining" read. mention-only 픽업이어도 재독에 그치지 말고 위 분기를 사용자에게 제시하세요.

## Current State

- **item 2 (rune-bound recall + R12 ships) landed — commit `acfc03fc`.** 상한 260→2000 sanity cap, `" ships "` lexicon 추가(R12가 lexicon gate에서 구조적으로 죽어있던 latent 버그 수정, debug `charness-artifacts/debug/2026-06-21-r12-ships-lexicon-gate-dead.md`). GEPA seam `claim-readme-md-140` 이제 deterministic.
- **item 1 / Fork B slice 1 (named-packet routing) landed — commit `881ee566`.** `namedPacketEmissionClaim`: 버전드 `cautilus.<name>.vN` packet 방출 / 명시적 non-LLM → deterministic, eval-judgment over-flip 가드 포함. per-claim schema 미도입(facet-decomposition.md:69 준수).
- 두 슬라이스 모두 spec→critique→impl→measure→review 풀 사이클(bounded fresh-eye 각 2회), `npm run verify` green(350s), `claims:refresh:all` 반영, `hooks:check` ready.
- **아직 push 안 함.** claim-source 편집(docs/contracts/**) 있었고 `claims:refresh:all`는 이미 돌림 → push 가능 상태.

## 측정 핵심 (누적, SOT는 References)

- 모집단 397→487. overlap agreeing count **26→34** (R6/R12 26 → rune-bound 30 → Fork B 34), over-correction(live=det/key=human, det→key-eval) **0 신규 유지**.
- **잔여 overlap `cautilus-eval→deterministic` = 8** (Fork B 타깃). `human-auditable→deterministic` ×9는 R6/R12 scope(Fork B 아님).
- 모집단 증가분 일부는 contract-realign prose self-extraction(정직하게 측정 표에 분리 기록).

## Next Session

1. **Fork B 다음 슬라이스(권장):** 잔여 8개 eval→det 중 하나에 gold-confirmed discriminator 추가. 후보 shape(측정 "Remaining" 참조): schema-field-persistence(#10 "agent emits them: <fields>"), static-taxonomy(#2), CLI-flag-semantics(#3), status-routing(#4), extraction(#7), command-absence(#9), R6-ish boundary(#8). 각자 over-flip 위험 더 큼 → frozen golden + negative control 필수.
2. **gate↔router verb-coverage 감사(follow-up):** `classifyClaimLine`의 모든 트리거 토큰이 `claimLineLooksUseful` lexicon gate를 통과하는지(또는 동반 verb로 커버되는지) 체계 점검. `" ships "` 같은 구조적 사망 재발 방지. debug sibling-search `follow-up: gate-router-coverage`.
3. **선재 latent 버그(범위 밖, 기록됨):** `truncateReviewSourceRefs`(claim_discovery.go ~3318)의 byte-slice excerpt 절단 — 멀티바이트 rune 분할 가능(review-input 렌더 경로).
4. **push 전:** claim-source(docs/specs/**, docs/contracts/**, README, AGENTS, internal/runtime/claim_discovery.go 등) 추가 편집 시 `npm run claims:refresh:all` 후 push.

## Discuss

- 다음 Fork B shape 선택: 모두 실재하나 named-packet보다 over-flip 위험 큼. 사용자와 우선순위 합의 후 진행.
- Fork B를 더 갈지 vs gate-coverage 감사를 먼저 할지(후자가 cheaper, 재발 방지).

## References

- Fork B 측정+게이트(SOT): `charness-artifacts/eval-trust/2026-06-21-fork-b-eval-overassignment-measurement.md`
- Fork B build contract: `charness-artifacts/eval-trust/2026-06-21-fork-b-named-packet-routing.spec.md`
- rune-bound 측정/contract: `charness-artifacts/eval-trust/2026-06-21-rune-bound-recall{-measurement,}.md` / `.spec.md`
- R12 debug: `charness-artifacts/debug/2026-06-21-r12-ships-lexicon-gate-dead.md`
- 계약: `docs/contracts/facet-decomposition.md`(Fork B 상태), `docs/contracts/claim-discovery-workflow.md`(rune bound + lexicon gate)
- 엔진: `internal/runtime/claim_discovery.go`(`namedPacketEmissionClaim`, `claimLineMaxRunes`, `defaultClaimLexiconTerms`, `classifyClaimLine`)
- ground truth: `charness-artifacts/eval-trust/goldset-v2-reextract-head/gold-set-proposal.json`(answer key)
