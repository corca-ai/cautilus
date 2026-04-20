# Cautilus Handoff

## Workflow Trigger

다음 세션은 `charness:impl`로 Go runtime consolidation의 첫 구현 슬라이스를 진행한다.
먼저 [docs/contracts/go-runtime-consolidation.md](../contracts/go-runtime-consolidation.md), [docs/maintainers/go-runtime-consolidation-premortem.md](../maintainers/go-runtime-consolidation-premortem.md), [docs/contracts/active-run.md](../contracts/active-run.md), [docs/contracts/live-run-invocation.md](../contracts/live-run-invocation.md), [docs/contracts/workbench-instance-discovery.md](../contracts/workbench-instance-discovery.md), 그리고 [AGENTS.md](../../AGENTS.md)를 다시 읽는다.
이번 pickup의 기준은 shipped runtime semantics를 Go가 소유하고, JS는 tests, maintainer tooling, 또는 명시적 transition shim으로만 남길 수 있다는 점이다.
이 handoff는 mention-only pickup 기준 문서이며, handoff adapter도 이제 `docs/internal/handoff.md`를 canonical artifact로 해석한다.

## Current State

- first implementation slice의 실제 runtime migration 구현은 아직 시작하지 않았다.
- 이번 슬라이스에서 landed한 변경은 handoff adapter를 `docs/internal/handoff.md`와 맞춰 pickup 경로를 고정한 것이다.
- handoff adapter 경로를 `docs/internal`로 맞춰 shared skill이 이 파일을 직접 갱신하게 했다.
- public runtime timeout gap 대응은 완료됐다.
  Go shared shell runner와 JS shared shell runner 둘 다 bounded timeout을 강제한다.
  관련 커밋은 `44c96de` (`Bound shared evaluation command runners`)이다.
- Go consolidation 설계 문서와 premortem review는 이미 landed 상태다.
  설계 문서: [docs/contracts/go-runtime-consolidation.md](../contracts/go-runtime-consolidation.md)
  premortem: [docs/maintainers/go-runtime-consolidation-premortem.md](../maintainers/go-runtime-consolidation-premortem.md)
  관련 커밋은 `a2fdc90` (`Specify Go runtime consolidation plan`)이다.
- immediate Go migration 분류는 그대로 유지한다.
  `run-executor-variants`, `evaluate-adapter-mode`, `discover-workbench-instances`, `run-live-instance-scenario`, `run-live-simulator-persona`, 그리고 이들이 의존하는 shared runtime helpers가 대상이다.
- first implementation slice의 실제 착수 대상은 아직 바뀌지 않았다.
  `run-executor-variants`와 `evaluate-adapter-mode` semantics를 Go-owned command path로 옮기고, shared active-run / process-execution invariant를 Go helper 쪽으로 끌어올리는 것이 첫 구현 범위다.
- 현재 codebase에는 이미 Go command surface가 있다.
  구현 시작점은 [internal/app/remaining_commands.go](../../internal/app/remaining_commands.go), [internal/runtime/active_run.go](../../internal/runtime/active_run.go), [scripts/agent-runtime/run-executor-variants.mjs](../../scripts/agent-runtime/run-executor-variants.mjs), [scripts/agent-runtime/evaluate-adapter-mode.mjs](../../scripts/agent-runtime/evaluate-adapter-mode.mjs), 그리고 shipped usage copy가 남아 있는 [docs/cli-reference.md](../cli-reference.md)다.

## Next Session

1. `charness:impl`로 첫 슬라이스를 시작하고, [docs/contracts/go-runtime-consolidation.md](../contracts/go-runtime-consolidation.md)의 `First Implementation Slice`를 다시 확인한다.
2. [scripts/agent-runtime/run-executor-variants.mjs](../../scripts/agent-runtime/run-executor-variants.mjs)와 [scripts/agent-runtime/evaluate-adapter-mode.mjs](../../scripts/agent-runtime/evaluate-adapter-mode.mjs)가 현재 책임지는 semantics를 [internal/app/remaining_commands.go](../../internal/app/remaining_commands.go)의 `review variants` / `mode evaluate` handler와 1:1로 대조한다.
3. Go helper로 먼저 고정할 invariant를 정리한다.
   timeout, process cleanup, active-run resolution, artifact naming, prompt/schema/report path resolution이 우선 대상이다.
4. 구현은 `run-executor-variants`와 `evaluate-adapter-mode`부터 한다.
   direct Node entrypoint를 남겨야 하면 transition shim으로만 남기고, semantics는 Go path를 호출하게 만든다.
5. 구현과 같은 슬라이스에서 [docs/cli-reference.md](../cli-reference.md), [docs/guides/evaluation-process.md](../guides/evaluation-process.md), [docs/contracts/adapter-contract.md](../contracts/adapter-contract.md)에서 preferred shipped path가 `cautilus ...`로 보이도록 같이 정리한다.
6. 슬라이스가 끝나면 `npm run verify`와 `npm run hooks:check`를 돌리고 handoff를 다시 갱신한다.

## Discuss

- direct `node scripts/agent-runtime/...` entrypoint를 한 release 동안 compatibility shim으로 남길지
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
