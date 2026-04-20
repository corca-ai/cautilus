# Cautilus Handoff

## Workflow Trigger

다음 세션은 Go runtime consolidation 구현부터 시작한다.
먼저 [docs/contracts/go-runtime-consolidation.md](../contracts/go-runtime-consolidation.md), [docs/maintainers/go-runtime-consolidation-premortem.md](../maintainers/go-runtime-consolidation-premortem.md), [docs/contracts/active-run.md](../contracts/active-run.md), [docs/contracts/live-run-invocation.md](../contracts/live-run-invocation.md), [docs/contracts/workbench-instance-discovery.md](../contracts/workbench-instance-discovery.md), 그리고 [AGENTS.md](../../AGENTS.md) 를 읽는다.
이번 결정의 핵심은 shipped runtime seam 은 Go-owned 로 수렴하고, tests 와 maintainer tooling 은 당장 JS 에 남아도 된다는 것이다.

## Current State

- public runtime timeout gap 대응은 완료됐다.
  Go shared shell runner 와 JS shared shell runner 둘 다 bounded timeout 을 강제한다.
- timeout 대응 커밋:
  `44c96de` `Bound shared evaluation command runners`
- Go consolidation 설계 문서와 premortem review 를 추가했다.
  설계 문서: [docs/contracts/go-runtime-consolidation.md](../contracts/go-runtime-consolidation.md)
  premortem: [docs/maintainers/go-runtime-consolidation-premortem.md](../maintainers/go-runtime-consolidation-premortem.md)
- 설계/문서 커밋:
  `a2fdc90` `Specify Go runtime consolidation plan`
- 현재 분류는 이렇게 고정한다.
  immediate Go migration: `run-executor-variants`, `evaluate-adapter-mode`, `discover-workbench-instances`, `run-live-instance-scenario`, `run-live-simulator-persona`, 그리고 이들이 의존하는 shared runtime helpers
  second-wave migration: local instruction-surface / skill-test runners 와 direct Node packet-builder duplicates
  JS may remain: `*.test.mjs`, release tooling, docs preview/lint tooling, explicit experiments
- next-session implementation slice 는 설계 문서의 `First Implementation Slice` 를 따른다.
  첫 대상은 `run-executor-variants` 와 `evaluate-adapter-mode` 이다.
- handoff mention-only pickup 을 위해 이 문서가 최신 상태로 갱신됐다.

## Next Session

1. `run-executor-variants` 와 `evaluate-adapter-mode` 의 authoritative runtime ownership 을 Go 쪽으로 옮기는 구현 plan 을 짧게 재확인한다.
2. 각 seam 에 대해 현재 JS entrypoint 가 하는 일과 이미 있는 Go command path 가 하는 일을 1:1 로 대조한다.
3. Go-owned helpers 로 끌어올릴 공통 invariant 를 먼저 정한다.
   timeout, process cleanup, active-run resolution, artifact naming, prompt/schema/report path resolution
4. 구현은 `run-executor-variants` 와 `evaluate-adapter-mode` 부터 한다.
   필요하면 direct Node entrypoint 는 transition shim 으로 남기되 semantics 는 Go 를 호출하게 한다.
5. 구현 slice 가 끝나면 docs 와 adapter guidance 에서 preferred shipped path 가 `cautilus ...` 인지 다시 맞춘다.

## Discuss

- direct `node scripts/agent-runtime/...` entrypoint 를 한 release 동안 compatibility shim 으로 남길지
- shared schema/version truth 를 장기적으로 Go source-of-truth 에서 생성할지, dual maintenance 를 유지할지
- second-wave migration 에서 packet-builder surfaces 를 어디까지 Go 로 끌어올릴지

## References

- [AGENTS.md](../../AGENTS.md)
- [docs/contracts/go-runtime-consolidation.md](../contracts/go-runtime-consolidation.md)
- [docs/maintainers/go-runtime-consolidation-premortem.md](../maintainers/go-runtime-consolidation-premortem.md)
- [docs/contracts/active-run.md](../contracts/active-run.md)
- [docs/contracts/live-run-invocation.md](../contracts/live-run-invocation.md)
- [docs/contracts/workbench-instance-discovery.md](../contracts/workbench-instance-discovery.md)
- [docs/cli-reference.md](../cli-reference.md)
- [docs/contracts/adapter-contract.md](../contracts/adapter-contract.md)
