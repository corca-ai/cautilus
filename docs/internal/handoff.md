# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — 트랙 A의 Host Ownership(declared→proven, 첫 human-auditable badge) LANDED. 다음 프론티어 아이템 선택(아래 Discuss D1): Reviewable Artifacts(declared→proven, 대개 charness:spec 소규모) · Behavior Eval app surfaces(app/chat liveness는 실제 live 앱 재실행=비용, app/prompt product-runner) · A Testable Agent(promised→proven, 새 스펙 필요) · 또는 트랙 C(개발자-트랙 투영). 방향 결정은 charness:spec부터, 버그/회귀는 charness:debug, 랜딩 전 critique는 포그라운드 Sonnet 서브에이전트. claim-source 편집 시 push 전 npm run claims:refresh:all.`

doc 멘션만으로 픽업하면 이 트리거의 workflow를 실행하세요(파일 재독만 하지 말 것).

## Current State

- **Host Ownership LANDED: declared→proven (첫 `human-auditable` badge).** 2커밋: `66c5d39e`(taxonomy 정렬), `c952c818`(badge proof). 미push(push는 user 몫). 작업트리 clean, `npm run verify` green, `hooks:check` ready.
- **Apex 현재: proven 5 / declared 1 / promised 1, 7/7 consistent, honest.**
- **무엇이 닫혔나(taxonomy):** apex proof-class 어휘를 제품 자신의 claim-route 어휘에 정렬. `live-replayed`→`cautilus-eval` 개명, **`human-auditable` proven class 신설**, `ROUTE_TO_PROOF_CLASS`를 항등맵으로(문서화돼 있던 `human-auditable: null` 갭 해소). 신선도(replay/opt-in 재실행)는 audit 페이지 Freshness 컬럼이 보유.
- **무엇이 닫혔나(Host Ownership proof):** `consumer:onboard:smoke`가 이제 안정적 operator-witnessed 캡처(`fixtures/eval/consumer/onboard/live/consumer-onboarding-live-capture.json`, 휘발 경로 상대화, drift 없이 재생성) 기록. `ownership.spec.md`가 매 `lint:specs`에서 리플레이, surface audit가 바인딩(evidenceReferenced+evidenceSubstantive). on-demand 테스트가 동일 불변식 검증.

## Next Session

1. **다음 프론티어 아이템 선택(Discuss D1)** 후 진행. 대개 `charness:spec`부터.
   - (추천 소규모) **Reviewable Artifacts** declared→proven: 스펙 안에서 패킷을 live 재생성+shape 검증. 결정적/human-auditable 둘 다 가능.
   - **Behavior Eval app surfaces:** app/chat liveness(실제 live 앱 재실행=비용, owner 시나리오 확인), app/prompt product-runner proof.
   - **A Testable Agent** promised→proven: runner-readiness/verification 계약 기반 새 스펙 작성(최대 규모).
   - (C) 개발자-트랙(232) 투영.

## Discuss

- **D1(prioritization):** 다음 Track A 아이템 vs C? (Host Ownership 완료. 이제 `human-auditable`은 operator 보증이 허용 기준인 곳의 재사용 가능한 declared→proven 레버.)
- 알려진 비차단 사항: `human-auditable` badge는 그 badge의 T1 headline claim이 결정적으로 라우팅되면 비차단 reconciliation `route-class-mismatch`를 유지(host-ownership의 `claim-readme-md-6`는 deterministic). `projected-claim-state.md`가 read-only로 표면화, 설계상 정직·비게이팅.

## 제약

- **claim-source = docs/specs/** + README/AGENTS/CLAUDE + 링크 문서.** 편집 시 push 전 `npm run claims:refresh:all` — verify의 `claims:source-freshness:check`가 강제.
- critique/fresh-eye는 **포그라운드 Sonnet 서브에이전트**(백그라운드 in-band 회수 안 됨). bug/error/regression은 `charness:debug`.
- `human-auditable` 캡처는 operator가 `npm run consumer:onboard:smoke`로 재생성(drift 없음). `lint:specs` ON 유지.

## References

- **계약(LANDED):** `charness-artifacts/spec/2026-06-21-host-ownership-human-auditable-proofclass.md`(2-slice 계획·critique·정렬 근거).
- **연결 표면:** apex `docs/specs/index.spec.md` · audit `docs/specs/audit.spec.md` · 레지스트리 `docs/specs/audit/surface-registry.json`.
- **taxonomy 코드:** `scripts/agent-runtime/surface-audit-lib.mjs`(PROOF_CLASSES) · `scripts/agent-runtime/goldset-projection-lib.mjs`(ROUTE_TO_PROOF_CLASS=항등).
- **capture 표면:** `scripts/on-demand/smoke-external-consumer.mjs`(+`.test.mjs`) · `fixtures/eval/consumer/onboard/live/consumer-onboarding-live-capture.json`.
