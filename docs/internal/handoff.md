# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — specdown 코퍼스 재구조화(proof-spine + typed traceability) Slice 1이 착지했습니다. 계약 charness-artifacts/spec/2026-06-21-specdown-corpus-proof-spine-restructure.md 를 먼저 읽고, charness:impl 로 다음 슬라이스를 이어가세요.`

첫 tool call = 계약 파일 read → `charness:impl`. doc 멘션만으로 픽업해도 재독에 그치지 말고 이 workflow를 실행하세요. Slice 2에는 실제 설계 결정 1건(아래 Discuss D1)이 있어 impl 중 짧은 spec 터치가 필요할 수 있음.

## Current State

- **방향 전환(user 결정):** apex가 7/7 proven으로 "Proven On Itself"는 완성. 이번 세션 user가 다음 무게중심을 **specdown 코퍼스 재구조화**로 잡음 — 옛 multi-view doc-site IA를 풀어 **하나의 proof-spine + specdown typed traceability**로. 제약: 소스 가드 최대한 지양, specdown run은 빨라야 함(느려지면 red flag).
- **Slice 1 착지(`010f8e2a`):** `specdown.json`에 trace 설정(apex/promise type, apex→promise `badges` edge `1→1..*`, ignore=old/archive/generated/charness-artifacts/node_modules) + apex·7 promise leaf를 `type:`로 타이핑 + 7개 proof 링크에 `badges::` + `lint-specs.mjs`에 `specdown trace -strict` 결선(비공허성 가드 + 테스트 2개) + **Class A reachability 가드 17개 삭제**(Class B 내용검사·Class C !fail은 유지) + `gap.traceability-config` 닫음. `npm run verify` green, hooks ready, honesty audit 여전히 7/7.
- **계약(SOT):** `charness-artifacts/spec/2026-06-21-specdown-corpus-proof-spine-restructure.md` — 전체 목표·Slice 맵·Slice 1 Delivered·deviation·residual risk 기록. specdown 도구 이해 자산: `charness-artifacts/gather/2026-06-21-specdown-tool-purpose-and-authoring.md`(핵심: `.spec.md`는 legacy no-op, trace+alloy 사용 가능).
- **미push:** 이번 세션 `1d321cf2`+`010f8e2a` 포함 backlog 55개 대기(push는 user 몫). 작업트리 clean.

## Next Session

1. **Slice 2(다음):** `rule`/`contract` 노드 타입 + promise→rule `governed-by`, promise→contract `implemented-by` edge 추가 + **multi-view sprawl 정리**(같은 약속이 user/contracts/rules/evidence/ledger에 6번 반복; promise↔rule/contract 관계는 현재 ledger 페이지에 있음 → leaf edge로 옮기고 view/index 페이지 demote/생성화). 매핑 source = `ledger/promise-ledger.spec.md` Workflow Audit Matrix.
2. **Slice 3:** 구조 이동(`promises/` 디렉토리, `generated/` 격리, history 그래프 분리) — `surface-registry.json`·`build-surface-audit.mjs`·projection·claim chain의 하드코딩 경로를 lockstep 업데이트. **Slice 4(deferred):** Alloy 불변식, `.spec.md`→`.md` rename(check-specs.mjs 결합).
3. claim-source(docs/specs/** 등) 편집 시 push 전 `npm run claims:refresh:all`. **주의: `user/claim-discovery.spec.md`가 이 repo의 live `.cautilus/claims` 버킷을 exact-assert해서 docs 편집마다 깨질 수 있음**(residual risk) — Slice 2에서 structural assert(subset/floor)로 바꾸는 것 고려.

## Discuss

- **D1(Slice 2 설계 결정):** view/index 페이지를 trace에서 **생성**(`specdown trace --format dot/matrix`)할지 vs 얇은 nav로 **trim**할지. edge가 관계를 derive하게 된 뒤 결정. impl 중 짧은 spec/ideation 터치 권장.

## References

- 계약(SOT): `charness-artifacts/spec/2026-06-21-specdown-corpus-proof-spine-restructure.md`
- specdown 자산: `charness-artifacts/gather/2026-06-21-specdown-tool-purpose-and-authoring.md`
- 증명 머신 경로(이동 시 lockstep): `docs/specs/audit/surface-registry.json` · `scripts/agent-runtime/build-surface-audit.mjs` · `scripts/check-specs.mjs`(reachability, trace와 병행) · `scripts/lint-specs.mjs`(trace 게이트)
