# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행 — specdown 코퍼스 재구조화 Slice 1/2 착지. 계약 charness-artifacts/spec/2026-06-21-specdown-corpus-proof-spine-restructure.md 를 먼저 읽고, 먼저 아래 Discuss(D2)를 확정한 뒤 charness:impl 로 Slice 3 를 이어가세요.`

첫 tool call = 계약 파일 read. doc 멘션만으로 픽업해도 재독에 그치지 말고 이 workflow를 실행하세요. Slice 3 진입 전 D2(아래) 한 건만 확정하면 됨.

## Current State

- **Slice 1/2 착지(미push):** proof-spine + typed traceability 전환. apex→promise `badges`, promise→rule `governed-by`, promise→contract `implemented-by` 엣지가 `specdown.json` `trace`에 설정되고 `specdown trace -strict`로 게이트됨(현재 26 typed docs / 45 edges, cardinality `1..* → 0..*` = orphan rule/contract 금지, 음성 테스트 통과). `npm run verify` green, honesty audit 7/7, hooks ready.
  - `daf24d18` Slice 2a: rule/contract 노드 타이핑 + 7 leaf에 edge.
  - `408eb8a6` Slice 2b-1: `ledger/promise-ledger.spec.md`를 trace 그래프에서 **생성**(`scripts/agent-runtime/render-promise-ledger.mjs` + `specdown:ledger:check` verify phase).
  - `4cc0dff2` Slice 2b-2: 순수 restatement 5개 삭제(`ledger/{readiness,claim-discovery,evaluation,improvement}`, `ledger/how-views-relate`) + per-view index 5개 thin-nav로 trim.
- **계약(SOT):** 위 파일에 Slice 1/2a/2b Delivered, cardinality 결정/한계, critique(2a·2b 모두 full PASS), deviation 기록.
- **미push backlog:** 이번 전환 4커밋 포함 다수 대기(push는 user 몫). 작업트리 clean.

## Next Session

1. **D2 확정 후 진행(아래 Discuss).** `evidence/evidence-map.spec.md`·`ledger/names-and-keys.spec.md`는 non-subsumed lens라 **유지**했음(approved Hybrid delete-list에서 의도적 이탈, critique가 유지 타당 확인). user가 trim/삭제를 원하면 그때 처리.
2. **Slice 3(다음, 규모 큼):** 구조 이동 — `promises/` 디렉토리(7 leaf), `generated/` 격리, history 그래프 분리. `docs/specs/audit/surface-registry.json`·`scripts/agent-runtime/build-surface-audit.mjs`(하드코딩 apex/leaf 경로)·projection·claim chain을 **lockstep** 업데이트. `check-specs.mjs`도 함께.
3. **Slice 4(deferred):** Alloy 불변식(claim-state partition, badge↔route bijection), `.spec.md`→`.md` rename(check-specs/specdown entry/registry 결합).
4. **Residual:** `user/claim-discovery.spec.md`가 live `.cautilus/claims` 버킷을 exact-assert(현재 7) → docs 편집마다 재churn 위험. structural(subset/floor) assert로 바꾸는 follow-up 권장. claim-source 편집 후 push 전 `npm run claims:refresh:all` 필수.

## Discuss

- **D2(Slice 3 진입 전):** `evidence-map`·`names-and-keys` 두 페이지를 (a) 그대로 유지(현재, 권장 — non-subsumed) / (b) 부분 trim(중복 행 제거, 고유 lens만 유지) / (c) 삭제(고유 콘텐츠 손실 감수) 중 무엇으로 둘지.

## References

- 계약(SOT): `charness-artifacts/spec/2026-06-21-specdown-corpus-proof-spine-restructure.md`
- specdown 자산: `charness-artifacts/gather/2026-06-21-specdown-tool-purpose-and-authoring.md`
- 증명 머신(이동 시 lockstep): `docs/specs/audit/surface-registry.json` · `scripts/agent-runtime/build-surface-audit.mjs` · `scripts/check-specs.mjs`(reachability, trace와 병행) · `scripts/lint-specs.mjs`(trace 게이트) · `scripts/agent-runtime/render-promise-ledger.mjs`(생성 ledger)
