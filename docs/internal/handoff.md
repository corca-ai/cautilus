# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — A Testable Agent(promised→proven, 마지막 비증명 배지)의 스펙은 이미 설계·critique 끝났습니다(계약: charness-artifacts/spec/2026-06-21-a-testable-agent-promised-to-proven.md). ideation/spec 재실행 말고 charness:impl 로 그 계약을 바로 구현하세요. Slice 1(① deterministic readiness 바인딩: doctor runnerReadiness + runner_assessment.v1 예시/stale + claims plan requiredRunnerCapability + fixture proofClass를 라이브 단언 — Reviewable Artifacts와 동형) → Slice 2(② agent-helps-build: cautilus-agent 스킬에 runner 생성/assessment 라우팅 추가 + prepared-skill 증명, claim-discovery 패턴). 랜딩 시 apex 7/7 proven. 버그/회귀는 charness:debug, 랜딩 전 critique는 포그라운드 Sonnet 서브에이전트, claim-source 편집 시 push 전 npm run claims:refresh:all.`

doc 멘션만으로 픽업하면 이 트리거의 workflow(charness:impl)를 실행하세요(파일 재독만 하지 말 것).

## Current State

- **Reviewable Artifacts LANDED: declared→proven (deterministic live-regen).** apex 현재 **proven 6 / declared 0 / promised 1**, 7/7 consistent, honest=true. (상세 계약: `charness-artifacts/spec/2026-06-21-reviewable-artifacts-deterministic-live-regen.md`.)
- **A Testable Agent 스펙 설계 완료(미구현).** 계약 커밋 `65e7f3fe`, S2 스코프(readiness+agent-helps-build), proofClass=deterministic, fresh-eye critique 통과(ready-with-fixes·0 blocker, evidence-binding/apex-prose 정직성 fix 반영). **다음 세션 = impl만.**
- **이번 세션 커밋 미push(push는 user 몫):** `2dd0cd5b`·`86ecc52b`·`9f27986e`·`170fcb5e`(Reviewable Artifacts) + `65e7f3fe`(A Testable Agent 스펙). 작업트리 clean, `npm run verify` green, `hooks:check` ready.
- **핵심 발견(계약에 반영됨):** A Testable Agent 절반 ①(testability 체크)은 runner-readiness 기판이 이미 빌드·라이브(`internal/runtime/runner_readiness_test.go`, `fixtures/runner-readiness/*`). 절반 ②(agent가 runner 만드는 걸 도움)는 `skills/cautilus-agent/SKILL.md`에 runner 가이드가 전무 → 신규 작업.

## Next Session — A Testable Agent impl (계약대로)

1. **Slice 1(①):** `docs/specs/user/` 신규 leaf 스펙 — doctor runnerReadiness·runner_assessment.v1(예시+stale)·claims plan·fixture proofClass 라이브 단언. **주의(critique SF1/SF2):** 레지스트리 `evidence`에 넣은 fixture는 반드시 `check:cautilus-json-file` 행으로 substantive 단언해야 바인딩됨 — `cautilus-json-command`만으론 안 됨(`surface-audit-lib.mjs:186–199`). 레지스트리 `a-testable-agent` none→deterministic + proofSpec + evidence. 이 슬라이스만으로 배지 플립 가능.
2. **Slice 2(②):** `skills/cautilus-agent/` 편집 → **CLAUDE.md 스티어링-표면 규칙 발동**(freeze-intent + progressive-disclosure quality pass; Agent는 라우팅/시퀀싱, binary는 명령 디스커버리/scaffold). prepared dogfood fixture + audit test로 ② 바인딩. apex 배지 promised→proven + **프로즈 정직성**(proven=readiness 체크+스킬 *prepared*; live runner-building 에피소드는 Proof Debt deferred). live cautilus-eval 에피소드는 이번에 안 함(deferred).
3. audit/project/claim-state 재생성 + `npm run verify` + `npm run claims:refresh:all`. 성공 시 apex **7/7 proven**.

## Discuss

- **D1(이번에 결정됨):** 스코프 S2 확정(readiness+agent-helps-build). agent 반쪽은 prepared-skill(deterministic) 증명으로 닫고 live 에피소드는 deferred — user가 "에이전트 반쪽 증명이 더 무름" 수용함.
- 비차단: `a-testable-agent`는 `no-t1-claim`(gold-set T1 없음) 유지 — Readiness와 동형, 비차단. T1 억지 생성 금지.

## References

- **다음 세션 계약(구현 대상):** `charness-artifacts/spec/2026-06-21-a-testable-agent-promised-to-proven.md` · 배경 `docs/contracts/runner-readiness.md`(Implemented slices 422–428).
- **패턴 참고(직전 LANDED):** `…reviewable-artifacts-deterministic-live-regen.md` + leaf `docs/specs/user/reviewable-artifacts.spec.md` · prepared-skill 패턴 `docs/specs/user/claim-discovery.spec.md`("prepared skill evaluation").
- **proof 머신:** `scripts/agent-runtime/surface-audit-lib.mjs`(evidence-binding) · 레지스트리 `docs/specs/audit/surface-registry.json`(route `a-testable-agent`) · apex `docs/specs/index.spec.md`.

## 제약

- **claim-source = docs/specs/** + README/AGENTS/CLAUDE + surface-registry.json + 링크 문서.** 편집 시 push 전 `npm run claims:refresh:all`(evidence-state alone 불충분). handoff·charness-artifacts/는 claim-source 아님.
- critique/fresh-eye는 **포그라운드 Sonnet 서브에이전트**. bug/error/regression은 `charness:debug`. `lint:specs` ON 유지.
