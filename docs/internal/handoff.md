# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — specdown 재작성(SC1~SC6)·claim-freshness 게이트(트랙 B) 모두 LANDED. 다음은 트랙 A(apex Proof Debt) 또는 C(개발자-트랙 투영) — 아래 Discuss D1. A는 대개 charness:spec부터(app/chat liveness·declared→proven·A Testable Agent는 새 계약 필요), C는 charness:impl. 버그/회귀는 charness:debug, 랜딩 전 critique는 포그라운드 Sonnet 서브에이전트 경유(백그라운드 결과 in-band 회수 안 됨). claim-source(docs/specs/** + README/AGENTS/CLAUDE + 링크 문서) 편집 시 push 전 npm run claims:refresh:all — 이제 verify의 claims:source-freshness:check가 강제하므로, 잊으면 게이트가 잡습니다.`

doc 멘션만으로 픽업하면 이 트리거의 workflow를 실행하세요(파일 재독만 하지 말 것).

## Current State

- **specdown 재작성 완료(SC1~SC6)** + **트랙 B(claim-freshness 게이트) 완료(`00d6893b`).** 미push(push는 user 몫). 작업트리 clean, `npm run verify` green.
- **트랙 B가 닫은 것:** `claims:evidence-state:check`는 *committed-diff* 기반이라 claim-source 편집이 자기 pre-commit verify를 통과하고 latent stale를 다음 세션에 떠넘겼음(어제 RCA). 신규 `claims:source-freshness:check`(verify 게이트)가 패킷의 `sourceInventory[].contentHash`를 디스크와 대조 — 스캔된 source가 바뀌면 fail하며 `npm run claims:refresh:all`을 지시. **이제 authoring 슬라이스에서 잡힘.** 표면: `scripts/check-claim-source-freshness.mjs`(+`.test.mjs`), npm `claims:source-freshness:check`, run-verify PHASES.
- **참고(이전 세션):** SC4 close(`b082597a` — 삭제 대상 없음, 투영이 facet 채움), Phase 3 old/archive reachability 가드(`1880dc78`), 패킷 refresh(`709d91cc`). FD3·FD6 전제가 경험적으로 거짓이었고 스펙에서 정정함. 상세는 References의 증거/RCA.

## Next Session

1. **프론티어 트랙 선택(Discuss D1)** 후 진행.
   - (A, 추천) apex **Proof Debt**(`docs/specs/index.spec.md` 소유): app/chat liveness(실제 live 재실행), host-ownership·reviewable-artifacts `declared→proven`(예: `consumer:onboard:smoke` 배선), A Testable Agent(스펙 부재). 본 제품 프론티어 — 대개 `charness:spec`부터.
   - (C) 개발자-트랙(232) 투영(FD4 deferred) — 별 audience/closeout.

## Discuss

- **D1(prioritization):** 다음 트랙 A vs C? (B 완료 후 — A가 제품 프론티어이나 크고 열려 있음. maintainer 결정.)
- 알려진 한계(blocker 아님): (1) `claims:source-freshness:check`는 인벤토리에 *기록된* source만 대조 → 엔트리에 **새로 링크된** source는 re-traversal 필요라 못 잡음(`follow-up: claim-source-newlink-detection`; committed-case는 evidence-state:check+pre-push가 backstop). (2) Phase 3 reachability 가드는 `.spec.md` 링크만 추적(생성 페이지 outbound 링크 0이라 현재 unexploitable).

## 제약

- **claim-source = docs/specs/** + README/AGENTS/CLAUDE + 링크 문서.** 편집 시 push 전 `npm run claims:refresh:all` — verify의 `claims:source-freshness:check`가 강제(잊으면 게이트 fail).
- critique/fresh-eye는 **포그라운드 Sonnet 서브에이전트**(백그라운드 in-band 회수 안 됨). bug/error/regression은 `charness:debug`.
- gold set은 체크인 아티팩트로만(Go 엔진 무오염), 앵커는 `claimFingerprint`. `lint:specs` ON 유지 — 약화 금지.

## References

- **재작성 계약(전 phase LANDED):** `charness-artifacts/spec/2026-06-20-specdown-rewrite-goldset-projection.md`.
- **증거:** 트랙 B `charness-artifacts/findings/2026-06-21-claim-source-freshness-staged-gate.md` · SC4 close `…/2026-06-20-specdown-phase2-remainder-sc4-close.md` · Phase 3 `…/2026-06-20-specdown-phase3-old-inert-guard.md` · debug RCA `charness-artifacts/debug/2026-06-20-claim-packet-stale-after-firstslice-docs-specs.md`.
- **연결 표면:** apex `docs/specs/index.spec.md`(Proof Debt 소유) · 클레임 refresh 체인 `npm run claims:refresh:all` · verify PHASES `scripts/run-verify.mjs`.
