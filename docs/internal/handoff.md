# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — judge tier를 실제-surface dogfood(AGENTS.md·cautilus-agent)에 수렴시킵시다.`

doc 멘션만으로 픽업하면 이 트리거의 workflow를 실행하세요(파일 재독만 하지 말 것).
**stage 1(회귀 breadth)·stage 2(a) judge tier CLI 배선 종결(2026-06-19).** 다음 본 게임 = **judge를 합성 섬에서 실제 dogfood 대상으로 수렴**.
먼저 `docs/contracts/eval-judge-collaboration.md`의 "Judge tier wired into `cautilus evaluate` (2026-06-19)" 섹션과 `charness-artifacts/eval-trust/2026-06-19-judge-tier-cli-wiring.md`를 읽고 아래 "Next Session" 1번에서 시작. `spec`으로 열린 결정부터 닫고 impl.

## Current State

- **stage 1 — 회귀 breadth 종결:** 회귀 탐지가 3개 pinned step에서 작동(routing 부트스트랩 / bug→`charness:debug` / 외부소스→`charness:gather`), 각각 code process facet + judge-load-bearing control. harness 21/21. 증거 `charness-artifacts/eval-trust/2026-06-19-regression-variant-breadth.md`.
- **stage 2(a) — judge tier가 `cautilus evaluate`에 generic 배선:** 엔진(`internal/runtime/instruction_surface.go`)이 observed 패킷의 `reasoningSoundness` composite verdict을 읽어 case status에 AND 합성(unsound→reject). adapter-owned 러너가 SOT `compareVerdicts`로 계산. dogfood `self-dogfood-routing-regression-eval`. 증거 `2026-06-19-judge-tier-cli-wiring.md`.
- **핵심 갭(2026-06-19 진단, 다음 액션의 이유): 두 세계가 끊겨 있다.**
  - **실제-surface dogfood는 있으나 결정론적뿐:** AGENTS.md → `self-dogfood-eval`(픽스처 `checked-in-agents-routing`); cautilus-agent 스킬 → `dev/skill` 가족(`self-dogfood-eval-skill` + `fixtures/eval/dev/skill/cautilus-*.fixture.json`). 둘 다 실제 러너(`run-self-dogfood-eval.mjs`→`run-local-eval-test.mjs`, `run-local-skill-test.mjs`)로 실제 surface를 읽지만 채점은 routing/trigger/command-fragment 매처뿐 — 계약이 비판한 thin proxy.
  - **judge tier는 합성 섬:** `self-dogfood-routing-regression-eval`은 패러프레이즈 surface + 서브에이전트 harvest 리플레이를 채점. **judge가 진짜 AGENTS.md / cautilus-agent 행동을 채점한 적 없음.**
  - **좋은 소식(수렴이 작은 이유):** `run-local-eval-test.mjs`가 **이미 `routingDecision.reasonSummary`를 캡처**(267·274줄 = 실제 러너 추론)하고, 엔진은 `reasoningSoundness`를 이미 generic하게 합성. 빠진 건 그 실제 reasonSummary로 judge verdict을 내 패킷에 붙이는 한 스텝뿐.
- **apex 배지:** Behavior Evaluation = **declared** 유지(유지보수자 결정 + 별도 슬라이스).

## Next Session: judge ↔ 실제-surface dogfood 수렴 (리드)

1. **(리드) 실제-surface dogfood에 judge-tier facet 얹기.** AGENTS.md(`self-dogfood-eval`)부터, 다음 cautilus-agent(`self-dogfood-eval-skill`). 러너가 이미 내는 `routingDecision.reasonSummary`(실제 AGENTS.md를 읽은 진짜 추론)를 governing rules 대비 채점해 `reasoningSoundness`로 패킷에 붙이면, 엔진이 기존 결정론적 체크와 AND 합성. 이게 "풀 러너 provenance"와 "judge가 진짜 dogfood 대상 채점"을 한 번에 닫음. `spec`으로 아래 열린 결정 먼저 → impl → dogfood + executable test.
2. **(선택) 잔여:** per-facet routing 잔여; ③ epic-structure 비준; consumer-shaped corpus 복제(external-validity).
3. **④ specdown 재설계 (맨 마지막):** 재작성 후 `lint:specs` 주석 복원(`run-verify.mjs`+`run-verify.test.mjs` 두 줄). eval-trust와 직교.

## Discuss (열린 결정 — spec에서 닫을 것)

- **실제 run에서 judge verdict 출처(THE 결정):** (a) 러너가 매 run마다 라이브 judge LLM 호출(진짜 live, run당 비용·비결정론) vs (b) prove-then-project를 **실제 surface 기준으로** — 실제-러너 reasoning을 1회 harvest→blind 채점→리플레이(지금과 같은 규율, 단 provenance가 진짜). (b) 우선 권장.
- 어느 어댑터부터 — AGENTS.md(단순) 먼저.
- 기존 routing calibration이 그대로 transfer되나, 아니면 실제-러너 reasoning 기준으로 governing rules/calibration 재정초가 필요한가.
- **배지 기준(이월):** 이 수렴이 닫히면 풀 러너 provenance도 사실상 닫힘 → `declared` 탈출 결정 가능.

## 제약

push는 사용자 몫(보류). claim-source 편집 후 `npm run claims:refresh:all`(소스 커밋 → refresh → 패킷 커밋; 이번 세션 calibration fixture 편집이 트리거함). 제네릭 엔진은 repo-specific judge 로직/facet import·재구현 금지(adapter-owned 러너 소유). ground truth 전 큐레이션 금지. bug/error/regression은 `charness:debug`. 새 런타임 표면엔 executable test. critique/fresh-eye는 서브에이전트 위임.

## References

- **계약/증거**: `docs/contracts/eval-judge-collaboration.md`(2026-06-19 wiring 섹션)·`facet-decomposition.md`; `charness-artifacts/eval-trust/2026-06-19-judge-tier-cli-wiring.md`·`2026-06-19-regression-variant-breadth.md`.
- **실제-surface dogfood(수렴 대상)**: 어댑터 `.agents/cautilus-adapters/self-dogfood-eval.yaml`·`self-dogfood-eval-skill.yaml`; 러너 `scripts/run-self-dogfood-eval.mjs`→`scripts/agent-runtime/run-local-eval-test.mjs`·`run-local-skill-test.mjs`; 픽스처 `fixtures/eval/dev/repo/checked-in-agents-routing.fixture.json`·`fixtures/eval/dev/skill/cautilus-*.fixture.json`.
- **judge 엔진/러너/harness**: `internal/runtime/instruction_surface.go`(+test); `scripts/agent-runtime/run-reasoning-judge-eval.mjs`(+test, +`scripts/on-demand/judge-tier-eval-dogfood.test.mjs`), 어댑터 `self-dogfood-routing-regression-eval.yaml`; `scripts/agent-runtime/reasoning-soundness-judge.mjs`(+ calibration/verdicts `reasoning-soundness-{calibration,judge-verdicts}.dev-repo-{routing,bug-debug,gather}-routing-regression.json`).
- 로드맵 `docs/master-plan.md`; 답안지 `charness-artifacts/eval-trust/goldset-v2-reextract-head/`.
