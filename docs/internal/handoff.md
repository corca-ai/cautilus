# Cautilus Handoff

## Workflow Trigger

다음 세션은 `charness:impl`로 Go runtime consolidation의 다음 슬라이스를 진행한다.
먼저 [docs/contracts/go-runtime-consolidation.md](../contracts/go-runtime-consolidation.md), [docs/maintainers/go-runtime-consolidation-premortem.md](../maintainers/go-runtime-consolidation-premortem.md), [docs/contracts/active-run.md](../contracts/active-run.md), [docs/contracts/live-run-invocation.md](../contracts/live-run-invocation.md), [docs/contracts/workbench-instance-discovery.md](../contracts/workbench-instance-discovery.md), 그리고 [AGENTS.md](../../AGENTS.md)를 다시 읽는다.
이번 pickup의 기준은 shipped runtime semantics를 Go가 소유하고, JS는 tests, maintainer tooling, 또는 명시적 transition shim으로만 남길 수 있다는 점이다.
이 handoff는 mention-only pickup 기준 문서이며, handoff adapter는 `docs/internal/handoff.md`를 canonical artifact로 해석한다.

## Current State

- Go runtime consolidation의 first implementation slice가 landed 상태다.
- `mode evaluate`의 profile-backed scenario selection, history persistence, baseline-cache seed semantics가 이제 Go path에 있다.
  구현 시작점은 [internal/app/remaining_commands.go](../../internal/app/remaining_commands.go)와 [internal/runtime/scenario_history.go](../../internal/runtime/scenario_history.go)다.
- `run-executor-variants`와 `evaluate-adapter-mode` direct Node entrypoint는 이제 Go CLI transition shim이다.
  shim helper는 [scripts/agent-runtime/cautilus-cli-shim.mjs](../../scripts/agent-runtime/cautilus-cli-shim.mjs)다.
- `review variants` / `mode evaluate`의 direct script compatibility proof는 slim Node shim tests로 남겼고, shipped semantics proof는 Go tests로 옮겼다.
  관련 테스트는 [scripts/agent-runtime/run-executor-variants.test.mjs](../../scripts/agent-runtime/run-executor-variants.test.mjs), [scripts/agent-runtime/evaluate-adapter-mode.test.mjs](../../scripts/agent-runtime/evaluate-adapter-mode.test.mjs), [internal/runtime/scenario_history_test.go](../../internal/runtime/scenario_history_test.go), [internal/app/cli_smoke_test.go](../../internal/app/cli_smoke_test.go)다.
- shipped docs와 bundled skill references는 이제 preferred path를 `cautilus mode evaluate` / `cautilus review variants`로 설명하고, checked-in wrapper는 thin shim이어야 한다고 명시한다.
  업데이트된 truth surfaces는 [docs/cli-reference.md](../cli-reference.md), [docs/guides/evaluation-process.md](../guides/evaluation-process.md), [docs/contracts/adapter-contract.md](../contracts/adapter-contract.md), [docs/contracts/scenario-history.md](../contracts/scenario-history.md), [skills/cautilus/references/evaluation-process.md](../../skills/cautilus/references/evaluation-process.md), [plugins/cautilus/skills/cautilus/references/evaluation-process.md](../../plugins/cautilus/skills/cautilus/references/evaluation-process.md)다.
- verification은 모두 통과했다.
  targeted Go tests, shim Node tests, `npm run verify`, `npm run hooks:check` 모두 green이다.

## Next Session

1. `charness:impl`로 next runtime slice를 시작하고, [docs/contracts/go-runtime-consolidation.md](../contracts/go-runtime-consolidation.md)의 `First Implementation Slice` 완료 상태와 이어지는 workbench/live-run migration 우선순위를 다시 확인한다.
2. [scripts/agent-runtime/discover-workbench-instances.mjs](../../scripts/agent-runtime/discover-workbench-instances.mjs), [scripts/agent-runtime/run-live-instance-scenario.mjs](../../scripts/agent-runtime/run-live-instance-scenario.mjs), [scripts/agent-runtime/run-live-simulator-persona.mjs](../../scripts/agent-runtime/run-live-simulator-persona.mjs)와 현재 Go command registry를 1:1로 대조한다.
3. workbench/live-run seams에서 아직 JS authoritative behavior로 남아 있는 부분을 식별한다.
   instance discovery, request/result packet handling, timeout/process cleanup, active-run/artifact path policy가 우선 확인 대상이다.
4. 다음 구현은 workbench discovery나 live-run execution 중 더 좁고 위험도가 높은 한 seam부터 자른다.
   direct Node entrypoint를 유지해야 하면 이번 슬라이스와 같은 방식으로 Go-owned semantics 위의 transition shim으로만 남긴다.
5. 해당 seam을 옮기면 docs와 skill references도 같은 슬라이스에서 같이 정리한다.

## Discuss

- direct `node scripts/agent-runtime/...` compatibility shim을 한 release 동안 남길지, 다음 runtime slice가 끝나면 바로 제거할지
- shared schema/version truth를 장기적으로 Go source-of-truth에서 생성할지, dual maintenance를 유지할지
- second-wave migration에서 packet-builder surfaces를 어디까지 Go로 끌어올릴지

## References

- [AGENTS.md](../../AGENTS.md)
- [docs/contracts/go-runtime-consolidation.md](../contracts/go-runtime-consolidation.md)
- [docs/maintainers/go-runtime-consolidation-premortem.md](../maintainers/go-runtime-consolidation-premortem.md)
- [docs/contracts/active-run.md](../contracts/active-run.md)
- [docs/contracts/live-run-invocation.md](../contracts/live-run-invocation.md)
- [docs/contracts/workbench-instance-discovery.md](../contracts/workbench-instance-discovery.md)
- [docs/cli-reference.md](../cli-reference.md)
- [docs/contracts/adapter-contract.md](../contracts/adapter-contract.md)
