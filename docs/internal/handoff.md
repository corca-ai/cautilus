# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — 실제-surface judge 수렴을 cautilus-agent 스킬 표면으로 확장합시다.`

doc 멘션만으로 픽업하면 이 트리거의 workflow를 실행하세요(파일 재독만 하지 말 것).
**AGENTS.md 실제-surface judge 수렴 종결(2026-06-19): judge가 진짜 dogfood 추론을 채점하고 full-runner provenance가 닫혔다.** 다음 본 게임 = **같은 수렴을 cautilus-agent 스킬 표면(`self-dogfood-eval-skill`)으로 확장**, 그리고 **배지 결정이 이제 가능**.
먼저 `docs/contracts/realsurface-judge-convergence.md`(닫힌 결정·acceptance)와 `charness-artifacts/eval-trust/2026-06-19-realsurface-judge-convergence.md`(증거)를 읽고 아래 "Next Session" 1번에서 시작. `spec`으로 열린 결정부터 닫고 impl.

## Current State

- **AGENTS.md 실제-surface judge 수렴 종결:** reasoning-soundness judge가 이제 dogfood 러너의 **진짜 캡처된 AGENTS.md 라우팅 추론**(`internal-runner-fixture-results.json`, full-runner provenance, `dd3f5e6`)을 채점한다. 합성 섬이 아님. 같은 실제-surface 패킷이 결정론적 매처 + judge verdict을 AND. 증거 `charness-artifacts/eval-trust/2026-06-19-realsurface-judge-convergence.md`. 게이트: `cautilus evaluate fixture --adapter-name self-dogfood-realsurface-judge-eval` → baseline(진짜 캡처)는 매처+judge sound로 pass, 구성된 right-route-wrong-reason control은 **judge 단독**으로 fail. `npm run verify` green.
- **경계 보존:** 제네릭 Go 엔진·제네릭 런타임 러너(`run-local-eval-test.mjs`)는 judge 로직 무첨가. SOT 헬퍼(`reasoning-soundness-attach.mjs`, provenance가 파라미터)와 adapter-owned enricher(`enrich-eval-with-reasoning-judge.mjs`)가 소유. PROVE = 블라인드 sonnet 서브에이전트 1회 채점(baseline sound, control unsound, tool_uses 0), 이후 결정론적 리플레이.
- **PQ1 해소:** 진짜 dogfood 추론은 블라인드 채점에서 **sound**로 나옴(제조 pass 아님). load-bearing 불변식 유지: always-sound judge는 새 claim에서 fail.
- **이전 단계(이월):** stage 1 회귀 breadth, stage 2(a) judge-tier CLI 배선은 이미 종결(`2026-06-19-judge-tier-cli-wiring.md`).
- **apex 배지:** Behavior Evaluation = **declared** 유지. 단, 이 수렴으로 `declared` 탈출이 **이제 가능**(judge가 실제 surface를 full-runner provenance로 채점 + 구성된-control reject-capability). 플립은 유지보수자 결정 + 별도 슬라이스.

## Next Session: 스킬-표면 수렴 + 배지 결정 (리드)

1. **(리드) cautilus-agent 스킬 표면(`self-dogfood-eval-skill`)에 같은 judge-tier 수렴 적용.** AGENTS.md와 동일 패턴: 스킬 러너(`run-local-skill-test.mjs`)가 캡처하는 진짜 추론을 governing rules 대비 블라인드 1회 채점 → `reasoning-soundness-calibration.dev-skill-*` + verdicts(real provenance) → enricher로 패킷에 `reasoningSoundness` 첨부 → 엔진 AND. 구성된 control 1개로 load-bearing 유지. `spec`으로 스킬-표면 governing rules/control을 닫고 impl + executable test. 참고: 스킬 표면은 다중 케이스(`cautilus-*` 픽스처)라 calibration 케이스를 어디까지 채점할지 결정 필요.
2. **(이제 가능) 배지 결정:** AGENTS.md+스킬 양 표면이 닫히면 유지보수자에게 `declared` 탈출 여부를 제시. 기준: full-runner provenance(이제 충족) + 구성된-control reject-capability + 자연-sound harvest. 자연-unsound 모집단 바를 영구 한계로 기록할지 vs 현재 증거로 충분으로 볼지가 결정 쟁점.
3. **(선택) 잔여:** per-facet routing 잔여; epic-structure 비준; consumer-shaped corpus 복제(external-validity); ④ specdown 재설계(맨 마지막, eval-trust와 직교 — 재작성 후 `lint:specs` 주석 복원).

## Discuss (열린 결정 — 스킬-표면 spec에서 닫을 것)

- **스킬-표면 채점 범위:** `self-dogfood-eval-skill`은 `cautilus-*.fixture.json` 다중 케이스. judge facet을 어느 케이스에 얹을지(전부 vs 대표 1 + 구성 control)와 governing rules의 출처(스킬 SKILL.md의 라우팅/시퀀싱 규칙).
- **calibration 재정초 vs transfer:** AGENTS.md governing rules는 startup_bootstrap/work_skill. 스킬 표면은 다른 규칙(스킬 소유의 routing/sequencing/guardrails)이라 governing rules 재작성 필요할 가능성 높음.
- **배지 기준(이월, 이제 결정 가능):** 위 2번.

## 제약

push는 사용자 몫(보류). claim-source 편집 후 `npm run claims:refresh:all`(소스 커밋 → refresh → 패킷 커밋). 제네릭 엔진·제네릭 런타임 러너에 repo-specific judge 로직 금지(adapter-owned 소유). ground truth 제조 금지(sound 케이스는 진짜 캡처, control만 구성·objective fabrication). 새 런타임 표면엔 executable test. bug/error/regression은 `charness:debug`. critique/fresh-eye는 서브에이전트 위임.

## References

- **계약/spec/증거**: `docs/contracts/realsurface-judge-convergence.md`(닫힌 결정)·`eval-judge-collaboration.md`(forward pointer + 이전 배선 섹션)·`facet-decomposition.md`; `charness-artifacts/eval-trust/2026-06-19-realsurface-judge-convergence.md`·`2026-06-19-judge-tier-cli-wiring.md`.
- **수렴 코드(이번 슬라이스)**: SOT 헬퍼 `scripts/agent-runtime/reasoning-soundness-attach.mjs`(+test); enricher `scripts/agent-runtime/enrich-eval-with-reasoning-judge.mjs`; 래퍼 `scripts/run-self-dogfood-eval.mjs`(`--reasoning-*` 플래그, +test); 어댑터 `.agents/cautilus-adapters/self-dogfood-realsurface-judge-eval.yaml`; on-demand `scripts/on-demand/realsurface-judge-eval-dogfood.test.mjs`.
- **픽스처**: `fixtures/eval/dev/repo/realsurface-judge-eval-cases.json`·`realsurface-judge-eval-fixture-results.json`·`reasoning-soundness-calibration.dev-repo-realsurface-routing.json`·`reasoning-soundness-judge-verdicts.dev-repo-realsurface-routing.json`·`internal-runner-fixture-results.json`(진짜 캡처).
- **스킬-표면 수렴 대상(다음)**: 어댑터 `.agents/cautilus-adapters/self-dogfood-eval-skill.yaml`; 러너 `scripts/agent-runtime/run-local-skill-test.mjs`; 픽스처 `fixtures/eval/dev/skill/cautilus-*.fixture.json`.
- **judge SOT/harness**: `scripts/agent-runtime/reasoning-soundness-judge.mjs`(+test, 레지스트리 불변식); `internal/runtime/instruction_surface.go`(엔진, 무변경). 로드맵 `docs/master-plan.md`.
