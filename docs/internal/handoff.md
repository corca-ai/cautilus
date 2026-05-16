# Cautilus Handoff

## Workflow Trigger

다음 세션은 오래된 issue #33 HITL 또는 stale claim packet refresh를 이어가지 마세요.
현재 claim packet은 HEAD 기준 fresh이며, 이번 흐름의 active 품질 `AUTO_CANDIDATE`는 처리되었습니다.

## Current State

- Issue #40/#41 cache-token telemetry closeout은 반복 critique까지 끝났습니다.
  관련 최신 흐름은 `52b32ac Preserve cache token telemetry`, `cc5da46 Preserve Codex cache read telemetry`, `2e04d77 Align agent telemetry references`, `9d178e6 Refresh final telemetry critique state`, `d941e6c Record post-final telemetry critique`입니다.
- Setup/quality posture는 `af894d8 Normalize setup and quality posture`와 `b239dfe Record setup quality critique`에서 정규화했습니다.
  `.agents/setup-adapter.yaml`가 mature repo surface를 가리키고, setup inspection은 `missing_surfaces=[]`로 통과합니다.
- Current claim state는 stale이 아닙니다.
  `.cautilus/claims/status-summary.json`는 packet commit과 current commit이 `b239dfedc20ee77233f2729cf8440009db79ff8a`로 일치하고 `comparisonStatus=fresh`, `isStale=false`, `headDrift=false`를 보고합니다.
- 최신 Evidence State projection은 satisfied 43개, stale 27개, unknown 289개 claim을 보여줍니다.
  자율 처리 가능한 큰 queue는 `agent-add-deterministic-proof` 95개, `agent-plan-cautilus-eval` 115개, `agent-design-scenario` 8개입니다.
  `human-align-surfaces`, `human-confirm-or-decompose`, `split-or-defer` bucket은 사용자 또는 maintainer 판단 전에는 proof로 밀지 마세요.
- 최신 quality artifact에서 public spec 중복 command example 축소와 repo-local runtime signal capture는 처리되었습니다.
  `inventory_public_spec_quality.py`는 `duplicate_command_examples=[]`를 보고하고, `charness-artifacts/quality/runtime-latest.json`는 `cautilus.quality_runtime_signal.v1` verify timing packet입니다.
- README entrypoint 정리도 완료되었습니다.
  `inventory_entrypoint_docs_ergonomics.py`는 README 140 non-empty lines와 `heuristics=[]`를 보고합니다.
- 남은 후보는 passive입니다.
  Cautilus Agent core extraction은 더 많은 user-facing skill prose를 추가하기 전까지 대기하고, local pytest temp footprint는 실제 flaky cleanup이나 operator confusion이 생길 때만 재검토하세요.
- Runtime-signal 구현 중 `runPhases` complexity 회귀가 있었고, debug artifact로 [run-verify-runtime-signal-complexity](../../charness-artifacts/debug/debug-2026-05-16-run-verify-runtime-signal-complexity.md)를 남겼습니다.
- 직전 추가 critique packet은 deterministic finding이 없는 timestamp-only 중복이라 커밋하지 않았고 제거했습니다.
  Broad critique를 다시 돌리기 전에 새 변경이 실제로 있는지 먼저 확인하세요.

## Next Session

1. `git status --short --untracked-files=all`로 worktree 상태를 확인하세요.
2. 남은 passive 후보는 지금 바로 밀지 마세요.
   Cautilus Agent core extraction은 다음 skill prose 증가 전의 예방 작업이고, local pytest temp footprint는 현재 repo behavior가 아닌 local machine state입니다.
3. claim proof backlog를 건드릴 때는 agent bucket만 선택하고, human bucket은 claim을 쪼개거나 질문으로 남기세요.

## Discuss

- Evidence State와 claim-status-report renderer를 장기적으로 하나의 packet family로 합칠지.
- Human bucket claim을 proofable claim으로 쪼갤 때 product promise를 어디까지 유지할지.

## References

- [charness-artifacts/quality/latest.md](../../charness-artifacts/quality/latest.md)
- [charness-artifacts/quality/runtime-latest.json](../../charness-artifacts/quality/runtime-latest.json)
- [charness-artifacts/debug/debug-2026-05-16-run-verify-runtime-signal-complexity.md](../../charness-artifacts/debug/debug-2026-05-16-run-verify-runtime-signal-complexity.md)
- [charness-artifacts/setup/latest.md](../../charness-artifacts/setup/latest.md)
- [charness-artifacts/critique/2026-05-16-021730-packet.md](../../charness-artifacts/critique/2026-05-16-021730-packet.md)
- [charness-artifacts/critique/2026-05-16-setup-quality-posture-result.md](../../charness-artifacts/critique/2026-05-16-setup-quality-posture-result.md)
- [docs/specs/evidence/claim-evidence-state.md](../specs/evidence/claim-evidence-state.md)
- [.cautilus/claims/status-summary.json](../../.cautilus/claims/status-summary.json)
