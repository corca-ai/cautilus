# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — specdown 재작성은 SC1~SC6 전부 LANDED(완료). 다음 프론티어를 고르세요(아래 Discuss D1): (A) apex Proof Debt 트랙, (B) claim-freshness-precommit 게이트(이번 세션 debug가 surface한 detection gap), (C) 개발자-트랙(232) 투영(FD4 deferred). 고른 트랙을 charness:spec(새 계약 필요 시) 또는 charness:impl로 진행. 버그/회귀는 charness:debug, 랜딩 전 critique는 포그라운드 Sonnet 서브에이전트 경유(백그라운드 서브에이전트 최종 메시지는 이 호스트에서 in-band 회수 안 됨). docs/specs/** 또는 README/AGENTS/CLAUDE-링크 문서를 편집하면 그건 claim-source 편집이라 push 전 npm run claims:refresh:all 필수(아래 제약).`

doc 멘션만으로 픽업하면 이 트리거의 workflow를 실행하세요(파일 재독만 하지 말 것).

## Current State

- **specdown 재작성 완료(SC1~SC6 전부 LANDED).** 이번 세션 착지: SC4 close(`b082597a` — 삭제 대상 없음, 투영이 누락 facet을 채움), 클레임 패킷 refresh(`709d91cc` — debug fix), Phase 3 가드(`1880dc78` — old/archive reachability guard). 미push(push는 user 몫).
- **SC4/D3 결론:** `docs/specs/`의 모든 테이블을 읽어 확인 — 투영이 대체할 손-유지 tier/verdict/route 테이블은 **없음**(ledger=ownership, evidence-map=route ownership, claim-evidence-state=398 백로그, audit=badge honesty — 전부 별 lens). FD3 전제("ledger/evidence가 손으로 재진술")는 경험적으로 거짓이었고 스펙에서 정정함. retire-source(5)는 `3080482`에서 이미 trim, badly-bounded(2)는 `3bc1b06`에서 re-extraction 세션으로 deferred → source 편집/claims:refresh 불필요였음.
- **Phase 3/FD6 결론:** old/**의 11개 run:shell 블록은 apex 엔트리에서 **도달 불가**(archive/index.spec.md로 들어오는 링크가 repo 어디에도 없음)라 이미 inert였음(FD6 "live risk" 전제도 거짓). 우연한 inert를 **게이트 보장**으로: `check-specs.mjs`에 reachability 가드 추가 — apex 그래프가 `old/**`/`archive/**`에 도달하면 lint:specs/verify fail(+테스트 2개). 향후 re-link는 게이트에서 잡힘.
- **검증:** `npm run verify` green(21 phases, 307s); 클레임 게이트·lint:specs·check-specs 테스트 green at HEAD `1880dc78`. 포그라운드 Sonnet critique READY-WITH-EDITS, blocker 0(가드 정합성·양 reconciliation·스펙 정직성·SC6 배지 무변화 독립 확인). 배지 무변화(proven4/declared2/promised1).
- **이번 세션 debug(RCA):** 첫 슬라이스(`6dd78e77`)가 docs/specs claim-source(evidence/ledger index)를 편집하고 claims:refresh:all을 안 돌려 패킷이 stale였음(이전 세션이 docs/specs를 non-source로 오분류). refresh로 해소(candidateCount 398 불변, SC6 안전). 상세·detection gap: `charness-artifacts/debug/2026-06-20-claim-packet-stale-after-firstslice-docs-specs.md`.

## Next Session

1. **프론티어 트랙 선택(Discuss D1)** 후 진행.
   - (A) apex **Proof Debt**(`docs/specs/index.spec.md`): app/chat liveness, host-ownership·reviewable-artifacts declared→proven(`consumer:onboard:smoke` 배선), A Testable Agent(스펙 부재). 별개 트랙.
   - (B) **`follow-up: claim-freshness-precommit`**: verify의 git-state staleness가 committed-diff 기반이라 claim-source 편집이 자기 슬라이스 pre-commit verify를 통과하고 latent stale를 다음 세션에 떠넘김. staged/working-tree 인지 pre-commit 게이트로 authoring 슬라이스에서 잡기(RCA Prevention).
   - (C) 개발자-트랙(232) 투영(FD4 deferred) — 별 audience/closeout.

## Discuss

- **D1(prioritization):** 다음 트랙 A/B/C 중 무엇? (rewrite 완료 후의 frontier 선택 — maintainer 결정.)
- 알려진 가드 한계(blocker 아님): reachability 가드는 `.spec.md` 링크만 추적 → 비-`.spec.md` 중간 페이지를 통한 re-link은 모델 안 함. 현재 생성 페이지 2개가 outbound 링크 0이라 unexploitable. 그 페이지에 링크 섹션이 생기면 가드 traversal 확장 필요.

## 제약

- **claim-source 편집 = docs/specs/** + README/AGENTS/CLAUDE + 링크 문서.** 편집하면 push 전 `npm run claims:refresh:all` 필수(이번 세션 RCA의 핵심 교훈 — docs/specs도 source임).
- critique/fresh-eye는 **포그라운드 Sonnet 서브에이전트**로(백그라운드 결과 in-band 회수 안 됨). bug/error/regression은 `charness:debug`.
- gold set은 체크인 아티팩트로만 소비(Go 엔진 무오염), 앵커는 `claimFingerprint`. `lint:specs` ON 유지 — 약화 금지.

## References

- **재작성 계약(canonical, 전 phase LANDED):** `charness-artifacts/spec/2026-06-20-specdown-rewrite-goldset-projection.md`.
- **이번 세션 증거:** SC4 close `charness-artifacts/findings/2026-06-20-specdown-phase2-remainder-sc4-close.md` · Phase 3 `…/2026-06-20-specdown-phase3-old-inert-guard.md` · debug RCA `charness-artifacts/debug/2026-06-20-claim-packet-stale-after-firstslice-docs-specs.md`.
- **Phase 3 표면:** 가드 `scripts/check-specs.mjs`(+`.test.mjs`) · specdown 파이프라인 `scripts/lint-specs.mjs`·`check-specs.mjs` · 엔트리 `specdown.json`(apex).
- **연결 표면:** apex `docs/specs/index.spec.md`(Proof Debt 소유) · 생성 페이지 `docs/specs/evidence/projected-claim-state.md` · 클레임 refresh 체인 `npm run claims:refresh:all`.
