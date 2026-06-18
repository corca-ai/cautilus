# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — 풀 러너 provenance로 회귀 페어 재현해서 배지 결정 입력을 완성합시다.`

doc 멘션만으로 픽업하면 이 트리거의 workflow를 실행하세요(파일 재독만 하지 말 것).
**stage 1(회귀 claim 폭 확대)·stage 2(a) CLI 배선 종결(2026-06-19).** judge tier가 이제 `cautilus evaluate` 안에서 회귀를 잡는다(리플레이 기반).
남은 본 게임 = **풀 codex/claude 러너 provenance**(서브에이전트 harvest가 유일한 갭) → 배지 `declared` 탈출 결정.
먼저 `docs/contracts/eval-judge-collaboration.md`의 "Judge tier wired into `cautilus evaluate` (2026-06-19)" 섹션과 `charness-artifacts/eval-trust/2026-06-19-judge-tier-cli-wiring.md`를 읽고 아래 "Next Session" 1번에서 시작.

## Current State

- **stage 1 — 회귀 탐지 폭 확대 종결:** 회귀 탐지가 **3개의 서로 다른 pinned step**에서 작동(각각 고유 code process facet + judge-load-bearing right-route-wrong-reason control, 양 tier 실 harvest):
  - `dev-repo-routing-regression`(startup 부트스트랩, `emitted_find_skills_bootstrap`) — 기존 템플릿
  - `dev-repo-bug-debug-routing-regression`(bug→`charness:debug`, `routed_to_debug_before_fix`) — 신규
  - `dev-repo-gather-routing-regression`(외부소스→`charness:gather`, `routed_through_gather_before_use`) — 신규
  - breadth-invariant 테스트가 3 distinct facet을 고정. harness 21/21 green. 증거 `charness-artifacts/eval-trust/2026-06-19-regression-variant-breadth.md`.
- **stage 2(a) — judge tier가 `cautilus evaluate`에 배선(리플레이 기반):** 제네릭 Go 엔진(`internal/runtime/instruction_surface.go`)이 observed 패킷의 `reasoningSoundness` composite verdict을 읽어 케이스 status에 AND 합성(unsound→fail→recommendation reject). repo-specific judge 로직은 adapter-owned 러너(`scripts/agent-runtime/run-reasoning-judge-eval.mjs`)가 SOT harness `compareVerdicts`로 계산해 패킷에 emit(엔진은 harness 미import). dogfood: `cautilus evaluate fixture --adapter-name self-dogfood-routing-regression-eval` → reject, baseline pass, regressed-skip fail, **control은 라우팅 매처 pass인데 judge로만 fail**(토큰체크가 놓치는 회귀를 CLI 안에서 잡음). e2e 테스트 `scripts/on-demand/judge-tier-eval-dogfood.test.mjs`. bounded fresh-eye READY(블로커 없음). 증거 `charness-artifacts/eval-trust/2026-06-19-judge-tier-cli-wiring.md`.
- **남은 2개의 정직한 갭(배지 미플립):** (1) judge LLM 추론은 prove-then-project(blind verdict 1회 캡처→결정론 리플레이; CLI는 합성·오케스트레이션만, 라이브 호출 아님). (2) provenance가 여전히 blind-subagent-harvest — 풀 codex/claude 러너 캡처가 아님.
- **apex 배지:** Behavior Evaluation = **declared** 유지. 올리는 건 유지보수자 결정 + 별도 슬라이스.

## Next Session: 풀 러너 provenance → 배지 결정 (리드)

1. **(리드) 풀 codex/claude 러너 provenance**: 서브에이전트 harvest 대신 실제 제품 러너로 baseline vs regressed instruction surface를 돌려 진짜 observed 라우팅 로그를 만들고(기존 `scripts/run-self-dogfood-eval.mjs` → `scripts/agent-runtime/run-local-eval-test.mjs` 경로 활용), 그 로그를 `cautilus evaluate`의 judge tier로 채점 → 회귀 페어를 풀 러너 fidelity로 재현. 이게 마지막 fidelity 갭. **대안/병행**: 유지보수자가 현 증거(breadth + CLI-wired replay)를 충분조건으로 받아 배지를 `declared` 위로 올리고 spec projection만 배선(`docs/specs/index.spec.md`).
2. **(선택) 잔여 + 큰 후속**: per-facet routing 잔여(Deprecated/Probe/Not-Doing 섹션 혼재 claim, per-claim source 정리로만); ③ epic-structure 비준; consumer-shaped corpus로 facet 측정 복제(external-validity 백로그).
3. **④ specdown 재설계 (맨 마지막)**: 재작성 후 `lint:specs` 주석 복원(`run-verify.mjs`+`run-verify.test.mjs` 두 줄). eval-trust와 직교 — 언제든 단독 세션.

## Discuss (열린 결정)

- **배지 기준(가장 큰 결정)**: 현 증거(3 pinned behavior breadth + judge tier가 CLI 안에서 control을 잡음, 리플레이 fidelity)가 `declared` 탈출에 충분한가, 아니면 풀 러너 provenance까지 요구하나?
- CLI 안 라이브 judge vs prove-then-project 리플레이 — 배지가 라이브 호출을 요구하나, 리플레이 fidelity로 충분한가?
- judge 모델 고정값(sonnet) vs 제품 러너 정합/비용 (이월).
- ③ epic 구조 비준 시점 — judge가 epic을 신뢰하려면 필요, 급하지 않음.

## 제약

push는 사용자 몫(의도적 보류). claim-source 편집 후 `npm run claims:refresh:all`(소스 커밋 → refresh → 패킷 커밋 순서; gitState.isStale은 소스 드리프트 기준 — 이번 세션에서 calibration fixture 편집이 트리거함). 운영 추출 템플릿은 `internal/runtime/claim_extraction.go`. ground truth 전 큐레이션 빌드 금지. raw를 큐레이션 후 채점 금지. 제네릭 엔진은 repo-specific judge 로직/facet을 import·재구현 금지(adapter-owned 러너가 소유). critique/fresh-eye 리뷰는 서브에이전트 위임. bug/error/regression은 `charness:debug` 라우팅. 새 런타임 표면엔 executable test.

## References

- **계약**: `docs/contracts/eval-judge-collaboration.md`(특히 "Judge tier wired into `cautilus evaluate` (2026-06-19)") + `facet-decomposition.md`.
- **증거**: `charness-artifacts/eval-trust/2026-06-19-judge-tier-cli-wiring.md`(CLI 배선) · `2026-06-19-regression-variant-breadth.md`(3 pinned behavior) · `2026-06-19-regression-variant-eval-routing.md`(템플릿).
- **엔진/러너**: `internal/runtime/instruction_surface.go`(+`instruction_surface_test.go`) · `scripts/agent-runtime/run-reasoning-judge-eval.mjs`(+test, +`scripts/on-demand/judge-tier-eval-dogfood.test.mjs`) · 어댑터 `.agents/cautilus-adapters/self-dogfood-routing-regression-eval.yaml` · cases `fixtures/eval/dev/repo/routing-regression-eval-cases.json`.
- **harness**: `scripts/agent-runtime/reasoning-soundness-judge.mjs`(+test); calibration/verdicts `fixtures/eval/dev/repo/reasoning-soundness-{calibration,judge-verdicts}.dev-repo-{routing,bug-debug,gather}-routing-regression.json`.
- **eval-trust 답안지**: `charness-artifacts/eval-trust/goldset-v2-reextract-head/`(HEAD 비준 365). 로드맵 `docs/master-plan.md`.
