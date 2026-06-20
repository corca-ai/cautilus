# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — Bounded Improvement 배지가 proven으로 착지(로컬 커밋, 미push)됐으니, 이제 (a) 릴리즈 컷 여부를 먼저 결정하고(이번에 internal/ 출시 표면이 바뀜) (b) 그다음 specdown 재설계로 갑시다.`

doc 멘션만으로 픽업하면 이 트리거의 workflow를 실행하세요(파일 재독만 하지 말 것).
합의된 남은 시퀀스: **릴리즈 컷 결정(이번 세션이 internal/ 출시 표면을 변경함) → specdown 재설계(맨 마지막).**

## Current State

- **apex `Bounded Improvement` = proven (dev/skill surface).** 라이브 `cautilus improve` 루프가 held-out 시나리오를 복구함을 실증: degraded seed control(현 SKILL.md − No-Input Orientation 규율)이 라이브로 FAIL(score 0), codex mutation이 재작성한 후보가 held-out PASS(score 100), search `status: completed`. 워킹트리 SKILL.md는 try/finally로 원복, degraded/mutated 둘 다 ship 안 함(control-only, 제조 아님). wiring: `docs/specs/index.spec.md`(배지), `docs/specs/user/improvement.spec.md`(라이브 섹션+check), `docs/specs/{contracts/improvement-loop,ledger/improvement,evidence/gaps,rules/cost-and-proof-freshness}.spec.md`. fresh-eye critique(Sonnet 서브에이전트) READY-WITH-EDITS(stale gap 참조 1건 fold). **로컬 커밋 완료, 미push**(push는 사용자 몫). 증거: `charness-artifacts/eval-trust/2026-06-20-bounded-improvement-badge-proven.md`.
- **proof/test:** `npm run proof:improve:live`(라이브, on-demand) · 결정적 replay `scripts/on-demand/improve-live-proof.test.mjs`(7/7) · 캡처 `fixtures/eval/dev/skill/improve/live/`. `npm run verify` 전 phase 통과, `lint:specs` 42 ok, `claims:refresh:all`+`evidence-state:check` ok, `hooks:check` ready, git clean.
- **이번 세션이 고친 load-bearing 제품 버그 3종(improve가 사실상 작동 안 하던 원인):** (1) claude eval 백엔드가 deterministic matcher 미적용(self-grade) → stream-json으로 command log 캡처 + matcher 적용; (2) `improveSearchScenarioSignalMap`이 in-memory []string를 되읽지 못해 reflection-batch feedback 전부 드롭(mutation blind) → `stringSliceOrEmptyRuntime` []string 처리; (3) `improveSearchHeldOutEntriesFromEvalSummary`가 `caseId` 폴백→`displayName`이라 후보 scenarioId 불일치로 frontier가 항상 seed → `evaluationId` 우선. 회귀 테스트 핀 + `charness-artifacts/debug/2026-06-20-improve-live-case-prompt-spoonfeeds-orientation.md`.
- **릴리즈 상태(결정 필요):** 이번 세션이 `internal/runtime/improve_search.go`(출시 표면) + eval 런너(`scripts/agent-runtime/`)를 바꿈 — improve 루프 동작이 실제로 바뀜(이전엔 mutation blind+항상 blocked). 핸드오프 규칙상 "출시 표면 변경 착지 시 릴리즈 컷" 조건 충족. 단 release는 deliberate 결정 + CLI+Cautilus Agent progressive-disclosure quality 패스 필요 → 다음 세션에서 컷 여부 결정.

## Next Session: 순서

1. **릴리즈 컷 여부 결정.** internal/improve-search 버그 수정이 shipped 바이너리 improve 동작을 바꿈. 컷하면 `charness:release` + CLI/Agent progressive-disclosure quality 패스. 안 컷하면 명시적으로 defer 사유 기록.
2. **specdown 재설계(맨 마지막).** proof 표면 안정 후 apex specdown entry 재작성.

## Discuss (열린 결정)

- 라이브 improve proof는 dev/skill 오리엔테이션 프롬프트 1개 타깃에만 proven. 추가 improvement 타깃으로 확장은 open(improvement-loop 계약 Evidence Gaps에 기록) — maintainer 투자 결정.
- 남은 app-surface Proof Debt: app/chat liveness(라이브 외부 제품+비용), app/prompt product-runner proof(진짜 prompt product). 둘 다 real-product 의존.

## 제약

push는 사용자 몫(보류). claim-source(spec/AGENTS 등) 편집 후 `npm run claims:refresh:all`(소스 커밋→refresh→패킷 커밋); `status-summary.json is stale` push 실패 시 필요. 제네릭 엔진·런타임에 repo-specific judge 로직 금지. ground truth 제조 금지(seed=구성된 control만, 점수는 진짜 라이브 캡처). 새 런타임 표면엔 executable test. bug/error/regression은 `charness:debug`. critique/fresh-eye·라이브 runtime은 서브에이전트(Sonnet) 위임.

## References

- **배지 결정/증거**: `charness-artifacts/eval-trust/2026-06-20-bounded-improvement-badge-proven.md`; 디버그 `charness-artifacts/debug/2026-06-20-improve-live-case-prompt-spoonfeeds-orientation.md`.
- **배지 SOT**: `docs/specs/index.spec.md` · `docs/specs/user/improvement.spec.md`. 로드맵 `docs/master-plan.md`(Phase 5 improve: 라이브 held-out 루프 proven).
- **라이브 proof**: `npm run proof:improve:live` · `proof:behavior-eval:live` · `proof:skill-orientation:live`. 하니스 `scripts/on-demand/improve-live-proof.mjs`(어댑터 `self-dogfood-improve-skill`, degraded control `fixtures/eval/dev/skill/improve/degraded-orientation-skill.md`).
- **선행 배지**: Behavior Evaluation proven(`charness-artifacts/eval-trust/2026-06-19-behavior-eval-badge-proven.md`).
