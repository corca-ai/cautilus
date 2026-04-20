# Cautilus Handoff

## Workflow Trigger

다음 세션은 `#21 Add consumer workspace lifecycle support to workbench live-run`부터 시작한다.
먼저 [docs/contracts/live-run-invocation.md](../contracts/live-run-invocation.md), [docs/contracts/adapter-contract.md](../contracts/adapter-contract.md), [docs/master-plan.md](../master-plan.md), [AGENTS.md](../../AGENTS.md), 그리고 Ceal adopter proof 근거인 [../ceal/docs/implementation/24-simulation-stack-thinning.md](../../../ceal/docs/implementation/24-simulation-stack-thinning.md), [../ceal/scripts/agent-runtime/run-ceal-single-turn.ts](../../../ceal/scripts/agent-runtime/run-ceal-single-turn.ts) 를 읽는다.
핵심 질문은 workspace lifecycle을 어디까지 product-owned로 올릴지다.
최소 후보는 `{workspace_dir}` placeholder 하나고, 더 나가면 one-time `workspace_prepare_command_template` hook까지 포함한다.

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

1. `#21` 을 spec 수준으로 좁힌다.
   먼저 product-owned 최소안과 비목표를 명확히 적는다.
2. workspace lifecycle surface 후보를 비교한다.
   최소안: `{workspace_dir}` placeholder
   확장안: `{workspace_dir}` + `workspace_prepare_command_template`
3. Ceal proof를 기준으로 acceptance bar를 고정한다.
   turn 1 bootstrap detection을 consumer가 계속 들지 않아도 되는지,
   opaque `consumerMetadata.workingDir` 의존을 줄이는지가 핵심이다.
4. 방향이 정해지면 바로 smallest slice 구현으로 들어간다.
   adapter schema
   workbench command placeholder wiring
   docs/contracts
   smoke test 하나

## Discuss

- workspace lifecycle 에서 product가 소유해야 하는 최소 경계는 `{workspace_dir}` 만으로 충분한지
- one-time `workspace_prepare_command_template` 가 실제로 필요한지, 아니면 consumer single-turn command 안에서 preparation 을 계속 허용할지
- workspace root 를 `<output_file>.d/workspace/` 처럼 artifact-root 아래에 둘지, adapter-configurable root 를 열지
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
