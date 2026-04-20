# Cautilus Handoff

## Workflow Trigger

다음 세션은 `charness:impl`로 Go runtime consolidation의 다음 슬라이스를 진행한다.
먼저 [docs/contracts/go-runtime-consolidation.md](../contracts/go-runtime-consolidation.md), [docs/maintainers/go-runtime-consolidation-premortem.md](../maintainers/go-runtime-consolidation-premortem.md), [docs/contracts/active-run.md](../contracts/active-run.md), [docs/contracts/live-run-invocation.md](../contracts/live-run-invocation.md), [docs/contracts/workbench-instance-discovery.md](../contracts/workbench-instance-discovery.md)를 다시 읽는다.
이번 pickup의 기준은 shipped runtime semantics를 Go가 소유하고, runtime duplicate는 하위호환성 고려 없이 제거할 수 있다는 점이다.
이 handoff는 mention-only pickup 기준 문서이며, handoff adapter는 `docs/internal/handoff.md`를 canonical artifact로 해석한다.

## Current State

- Go runtime consolidation의 first implementation slice가 landed 상태다.
- `mode evaluate`의 profile-backed scenario selection, history persistence, baseline-cache seed semantics가 이제 Go path에 있다.
  구현 시작점은 [internal/app/remaining_commands.go](../../internal/app/remaining_commands.go)와 [internal/runtime/scenario_history.go](../../internal/runtime/scenario_history.go)다.
- `workbench discover`와 `workbench run-live`의 shipped semantics는 이제 Go command registry와 [internal/app/workbench_commands.go](../../internal/app/workbench_commands.go)가 authoritative다.
  direct Node entrypoint였던 `scripts/agent-runtime/discover-workbench-instances.mjs`, `scripts/agent-runtime/run-live-instance-scenario.mjs`는 제거했다.
- `run-executor-variants`와 `evaluate-adapter-mode` direct Node entrypoint는 아직 thin Go CLI shim으로 남아 있다.
  이건 transitional 상태이며 유지 정책은 없다.
- `review variants` / `mode evaluate`의 direct script proof는 slim Node shim tests로 남겼고, workbench/live-run shipped semantics proof도 Go smoke tests로 정리되어 있다.
  Node side proof는 이제 [scripts/agent-runtime/run-executor-variants.test.mjs](../../scripts/agent-runtime/run-executor-variants.test.mjs), [scripts/agent-runtime/evaluate-adapter-mode.test.mjs](../../scripts/agent-runtime/evaluate-adapter-mode.test.mjs), [scripts/agent-runtime/run-live-simulator-persona.test.mjs](../../scripts/agent-runtime/run-live-simulator-persona.test.mjs)처럼 helper-scope로만 남는다.
  shipped semantics proof의 중심은 [internal/runtime/scenario_history_test.go](../../internal/runtime/scenario_history_test.go)와 [internal/app/cli_smoke_test.go](../../internal/app/cli_smoke_test.go)다.
- shipped docs와 bundled skill references는 이제 preferred path를 `cautilus mode evaluate` / `cautilus review variants`로 설명한다.
  업데이트된 truth surfaces는 [docs/cli-reference.md](../cli-reference.md), [docs/guides/evaluation-process.md](../guides/evaluation-process.md), [docs/contracts/adapter-contract.md](../contracts/adapter-contract.md), [docs/contracts/scenario-history.md](../contracts/scenario-history.md), [skills/cautilus/references/evaluation-process.md](../../skills/cautilus/references/evaluation-process.md), [plugins/cautilus/skills/cautilus/references/evaluation-process.md](../../plugins/cautilus/skills/cautilus/references/evaluation-process.md)다.
- remaining runtime question은 `run-live-simulator-persona.mjs`를 계속 adapter-owned helper로 둘지, Go command surface로 끌어올릴지다.

## Next Session

1. `charness:impl`로 next runtime slice를 시작하고, [docs/contracts/go-runtime-consolidation.md](../contracts/go-runtime-consolidation.md)의 `First Implementation Slice` 완료 상태와 이어지는 workbench/live-run migration 우선순위를 다시 확인한다.
2. [scripts/agent-runtime/run-live-simulator-persona.mjs](../../scripts/agent-runtime/run-live-simulator-persona.mjs)와 live-run contract를 다시 읽고, 이 helper가 truly adapter-owned backend seam인지 아니면 아직 product runtime authority를 들고 있는지 재분류한다.
3. `run-executor-variants`와 `evaluate-adapter-mode` shim removal을 early cleanup 후보로 다시 확인한다.
   하위호환성은 고려하지 않으므로 equivalent Go path가 landed한 seam은 direct Node runtime entrypoint를 제거할 수 있다.
4. packet-builder surfaces는 이번 pickup의 첫 대상이 아니다.
   workbench/live-run runtime seam을 먼저 정리한 뒤, builder 계층이 실제 shipped semantics를 소유하는지 다시 분류한다.
5. 해당 seam을 옮기면 docs와 skill references도 같은 슬라이스에서 같이 정리한다.

## Discuss

- second-wave migration에서 packet-builder surfaces를 어디까지 Go로 끌어올릴지

## References

- [docs/contracts/go-runtime-consolidation.md](../contracts/go-runtime-consolidation.md)
- [docs/maintainers/go-runtime-consolidation-premortem.md](../maintainers/go-runtime-consolidation-premortem.md)
- [docs/contracts/active-run.md](../contracts/active-run.md)
- [docs/contracts/live-run-invocation.md](../contracts/live-run-invocation.md)
- [docs/contracts/workbench-instance-discovery.md](../contracts/workbench-instance-discovery.md)
- [docs/cli-reference.md](../cli-reference.md)
- [docs/contracts/adapter-contract.md](../contracts/adapter-contract.md)
