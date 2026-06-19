# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — 양 표면이 닫혔으니 apex Behavior Evaluation 배지 flip 제안을 유지보수자와 함께 결정합시다.`

doc 멘션만으로 픽업하면 이 트리거의 workflow를 실행하세요(파일 재독만 하지 말 것).
**스킬-표면 judge 수렴 종결(2026-06-19): judge가 cautilus-agent의 진짜 no-input orientation 추론을 채점하고 full-runner provenance가 닫혔다. 이제 AGENTS.md + 스킬 양 표면이 모두 닫혔다.** 다음 본 게임 = **apex 배지 flip 결정**(이제 양 표면에서 가능). 배지는 결정 쟁점이 있으니 유지보수자와 같이 결정.
먼저 `charness-artifacts/eval-trust/2026-06-19-skill-surface-judge-convergence.md`(증거)와 `docs/specs/index.spec.md`(apex 배지 SOT)를 읽고 아래 "Next Session" 1번에서 시작.

## Current State

- **스킬-표면 judge 수렴 종결:** reasoning-soundness judge가 이제 스킬 러너의 **진짜 캡처된 no-input orientation 추론**(`internal-runner-fixture-results.json`의 no-input 케이스, full-runner provenance, fresh codex 캡처)을 채점한다. 합성 stand-in이 아님. 같은 스킬 패킷이 결정론적 매처 + judge verdict을 AND. 증거 `charness-artifacts/eval-trust/2026-06-19-skill-surface-judge-convergence.md`. 게이트: `cautilus evaluate fixture --adapter-name self-dogfood-skill-judge-eval` → baseline(진짜 캡처)는 매처+judge sound로 pass, 구성된 surface-clean-wrong-reason control은 **judge 단독**으로 fail. `npm run verify` green.
- **제네릭 엔진 확장(대칭, 경계 보존):** `skill_evaluation.go`가 instruction surface와 동일하게 옵션 `reasoningSoundness` verdict을 읽어 status에 AND + judgeSummary 누적(제네릭 verdict-compositing, repo-specific judge 로직 아님; 동일 패키지 헬퍼 재사용). 제네릭 런타임 러너(`run-local-skill-test.mjs`)는 무변경. 새 process facet `held_no_input_orientation`, governing rules는 스킬 SKILL.md에서 재작성.
- **PROVE:** 블라인드 sonnet 서브에이전트 2회(baseline→sound, control→unsound, tool_uses 0). PQ1 해소: 진짜 orientation은 제조 pass 아니라 sound.
- **mid-slice debug:** no-input fixture가 존재하지 않는 `agent status` 명령 fragment를 요구하던 버그를 fresh 캡처가 노출 → `charness:debug`로 RCA(`charness-artifacts/debug/2026-06-19-skill-no-input-command-fragment.md`) → 두 fixture 모두 실제 명령 `doctor status`로 수정. follow-up: skill-fixture-command-fragment-lint(매처 fragment가 실제 명령인지 결정론적 검사).
- **apex 배지:** Behavior Evaluation = **declared** 유지. 단, 이제 **AGENTS.md + 스킬 양 표면**이 full-runner provenance + 구성된-control reject-capability로 닫혀 `declared` 탈출이 양 표면에서 가능. 플립은 유지보수자 결정 + 별도 슬라이스.

## Next Session: 배지 flip 결정 (리드)

1. **(리드) apex Behavior Evaluation 배지 flip 결정.** 양 표면(AGENTS.md `self-dogfood-realsurface-judge-eval` + 스킬 `self-dogfood-skill-judge-eval`)이 닫혔으니 유지보수자에게 `declared` 탈출 여부를 제시. 기준: full-runner provenance(양 표면 충족) + 구성된-control reject-capability + 자연-sound harvest. **결정 쟁점**(같이 결정할 것): 자연-unsound 모집단 바(현재는 양 표면 모두 구성된 control만, 자연 발생 unsound 캡처 없음)를 영구 한계로 문서화하고 flip할지 vs 현재 증거로 충분으로 볼지. flip 시 `docs/specs/index.spec.md`의 배지를 proven으로 올리고 양 증거 아티팩트를 proof-link, 자연-unsound 갭을 한계로 명시.
2. **(선택) 잔여:** follow-up skill-fixture-command-fragment-lint; per-facet routing 잔여; epic-structure 비준; consumer-shaped corpus 복제(external-validity); specdown 재설계(맨 마지막, eval-trust와 직교).

## Discuss (열린 결정 — 배지 슬라이스에서 닫을 것)

- **배지 기준:** 위 1번. 자연-unsound 모집단 바를 영구 한계로 기록 vs 현재 증거 충분. flip은 공개 honesty 주장이라 유지보수자 결정.

## 제약

push는 사용자 몫(보류). claim-source 편집 후 `npm run claims:refresh:all`(소스 커밋 → refresh → 패킷 커밋); push가 `status-summary.json is stale`로 실패할 때만 필요. 제네릭 엔진·제네릭 런타임 러너에 repo-specific judge 로직 금지(adapter-owned·SOT 헬퍼 소유; 엔진은 verdict 읽기/compositing만). ground truth 제조 금지(sound 케이스는 진짜 캡처, control만 구성·objective fabrication). 새 런타임 표면엔 executable test. bug/error/regression은 `charness:debug`. critique/fresh-eye는 서브에이전트 위임.

## References

- **계약/spec/증거**: `docs/contracts/skill-surface-judge-convergence.md`(닫힌 결정)·`realsurface-judge-convergence.md`·`eval-judge-collaboration.md`(forward pointer)·`facet-decomposition.md`; `charness-artifacts/eval-trust/2026-06-19-skill-surface-judge-convergence.md`·`2026-06-19-realsurface-judge-convergence.md`.
- **스킬 수렴 코드(이번 슬라이스)**: 엔진 `internal/runtime/skill_evaluation.go`(+`skill_evaluation_reasoning_test.go`); facet+레지스트리 `scripts/agent-runtime/reasoning-soundness-judge.mjs`(+test, allCalibrationFixtures가 dev/skill도 스캔); enricher(재사용) `scripts/agent-runtime/enrich-eval-with-reasoning-judge.mjs`; 어댑터 `.agents/cautilus-adapters/self-dogfood-skill-judge-eval.yaml`(shell && 체이닝); on-demand `scripts/on-demand/skill-judge-eval-dogfood.test.mjs`.
- **픽스처**: `fixtures/eval/dev/skill/skill-judge-eval-cases.json`·`skill-judge-eval-fixture-results.json`·`reasoning-soundness-calibration.dev-skill-no-input-orientation.json`·`reasoning-soundness-judge-verdicts.dev-skill-no-input-orientation.json`·`internal-runner-fixture-results.json`(진짜 캡처).
- **배지 SOT**: `docs/specs/index.spec.md`(apex, proven/declared/promised 배지). 로드맵 `docs/master-plan.md`.
