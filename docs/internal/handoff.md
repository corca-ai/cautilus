# Cautilus Handoff

## Workflow Trigger

다음 세션은 Ceal adopter 쪽에서 새 `#21` surface 를 실제로 채택하고 close-out evidence 를 남기는 것부터 시작한다.
먼저 [docs/contracts/live-run-invocation.md](../contracts/live-run-invocation.md), [docs/contracts/adapter-contract.md](../contracts/adapter-contract.md), [docs/master-plan.md](../master-plan.md), [AGENTS.md](../../AGENTS.md), 그리고 Ceal adopter proof 근거인 [../ceal/docs/implementation/24-simulation-stack-thinning.md](../../../ceal/docs/implementation/24-simulation-stack-thinning.md), [../ceal/scripts/agent-runtime/run-ceal-single-turn.ts](../../../ceal/scripts/agent-runtime/run-ceal-single-turn.ts) 를 읽는다.
이미 product boundary 결정은 끝났다.
`Cautilus` 는 stable `{workspace_dir}` 와 optional one-time `workspace_prepare_command_template` 를 product-owned loop 경계로 채택했다.

## Current State

- public release 는 `v0.8.0` 이고 tag/head 는 commit `182313c` 에 있다.
- local release gates 는 모두 통과했다.
  `npm run hooks:check`, `npm run verify`, `npm run test:on-demand`, `./bin/cautilus --version`
- `#20` 는 Ceal adopter proof를 근거로 닫혔다.
  본문은 close-ready 상태로 갱신됐고, close-out comment 는 adopter proof comment `4280743107` 와 workspace follow-up `#21` 을 가리킨다.
- 새 follow-up issue 는 [#21](https://github.com/corca-ai/cautilus/issues/21) 이다.
  주제는 consumer-owned workspace lifecycle support 이다.
- `workbench run-live` 는 이제 product-owned multi-turn loop 를 제공한다.
  public simulator kinds 는 `scripted` 와 `persona_prompt` 두 개다.
  concrete backend choice 는 `simulator_persona_command_template` + opaque `consumerMetadata` 로 adapter-owned 상태를 유지한다.
- `#21` 의 product-side slice 는 구현됐다.
  `workbench run-live` 는 `<output_file>.d/workspace/` 에 stable per-request workspace dir 를 만들고,
  모든 live-run command template 에 `{workspace_dir}` placeholder 를 제공한다.
  product-owned multi-turn loop path 에서는 optional `workspace_prepare_command_template` 를 첫 turn 전에 정확히 한 번 실행한다.
- adapter validation, Node helper, Go CLI smoke, docs/contracts, CLI reference, standalone surface spec 가 모두 새 surface 에 맞게 갱신됐다.
- local gates 는 현재 slice 기준으로 통과했다.
  `go test ./internal/runtime ./internal/app`
  `node --test scripts/agent-runtime/run-live-instance-scenario.test.mjs scripts/agent-runtime/adapter-resolution.test.mjs`
  `npm run verify`
  `npm run hooks:check`
- supporting artifacts 는 `cautilus.live_run_simulator_request/result.v1`, `cautilus.live_run_turn_request/result.v1`, `cautilus.live_run_transcript.v1` 까지 shipped 상태다.
- Ceal 은 실제 adopter proof 를 완료했다.
  relevant Ceal commits:
  `224daf5` Phase A, `cba3b45` Phase B.1, current head `b22c261`
- Ceal proof의 결론은 `#20` closure blocker 없음이다.
  다만 consumer-local workspace bootstrap/reuse logic 가 반복 비용으로 남았고, 그 follow-up 이 `#21` 이다.
- 아직 안 한 것:
  `npm run release:verify-public -- --version v0.8.0`
  public install smoke
  GitHub release artifact / tap 검증

## Next Session

1. Ceal adapter 와 `run-ceal-single-turn.ts` 계열 shim 을 새 surface 로 바꾼다.
   `consumerMetadata.workingDir` 재-plumb 없이 `{workspace_dir}` 를 직접 쓰는지 확인한다.
2. Ceal proof 를 다시 캡처한다.
   scripted / persona path 둘 다에서 workspace bootstrap 이 product-owned prepare hook 으로 흡수됐는지 본다.
3. evidence 가 충분하면 [#21](https://github.com/corca-ai/cautilus/issues/21) close-out comment 와 state transition 을 준비한다.

## Discuss

- one-shot `consumer_command_template` path 에도 one-time prepare hook 을 열지, 아니면 지금처럼 product-owned multi-turn path 전용으로 유지할지
- workspace root 를 계속 `<output_file>.d/workspace/` 로 고정할지, adopter evidence 가 더 쌓이면 adapter-configurable root 를 열지
- evaluator 쪽 richer per-turn artifact handoff 는 `#21` 범위 밖으로 유지할지

## References

- [AGENTS.md](../../AGENTS.md)
- [docs/master-plan.md](../master-plan.md)
- [docs/contracts/live-run-invocation.md](../contracts/live-run-invocation.md)
- [docs/contracts/adapter-contract.md](../contracts/adapter-contract.md)
- [docs/specs/standalone-surface.spec.md](../specs/standalone-surface.spec.md)
- [#20](https://github.com/corca-ai/cautilus/issues/20)
- [#21](https://github.com/corca-ai/cautilus/issues/21)
- [../ceal/docs/implementation/24-simulation-stack-thinning.md](../../../ceal/docs/implementation/24-simulation-stack-thinning.md)
- [../ceal/scripts/agent-runtime/run-ceal-single-turn.ts](../../../ceal/scripts/agent-runtime/run-ceal-single-turn.ts)
- [../ceal/scripts/agent-runtime/run-ceal-persona-simulator.ts](../../../ceal/scripts/agent-runtime/run-ceal-persona-simulator.ts)
