# Cautilus Handoff

## Workflow Trigger

다음 세션은 Go CLI 로 승격된 workbench surface 위에 첫 real-consumer proof 를 얹는 쪽으로 시작한다.
먼저 GitHub issue `#17`, `#18`, [docs/contracts/workbench-instance-discovery.md](../contracts/workbench-instance-discovery.md), [docs/contracts/live-run-invocation.md](../contracts/live-run-invocation.md), [docs/contracts/adapter-contract.md](../contracts/adapter-contract.md), [examples/adapter.example.yaml](../../examples/adapter.example.yaml), [AGENTS.md](../../AGENTS.md) 를 읽는다.
핵심 질문은 discovery/live invocation seam 자체를 어디에 둘지가 아니라, 이미 Go CLI 로 승격된 surface 를 어떤 consumer proof 로 먼저 고정할지다.
릴리즈 후속을 더 넓히고 싶다면 `v0.6.2` install evidence 중 Homebrew 또는 multi-machine smoke 기록이 남았는지만 확인하면 된다.

## Current State

- public release 는 `v0.6.2` 이고 tag 는 `d7d080a` 에 있다.
- `release-artifacts` workflow run `24641998570` 는 성공했다.
- `npm run release:verify-public -- --version v0.6.2` 는 통과했다.
- `npm run release:smoke-install -- --channel install_sh --version v0.6.2` 는 통과했다.
- `#16` 은 2026-04-19 이전에 이미 `v0.6.0` 기준으로 닫혀 있었다.
- `#17` workbench instance discovery/data roots seam 은 2026-04-19 에 commit `f02a8ee` 로 닫혔다.
- `#18` generic live-run invocation seam 은 2026-04-19 에 commit `586ae67` 로 닫혔다.
- adapter schema 는 이제 optional `instance_discovery` 와 `live_run_invocation` stanza 를 검증한다.
- canonical discovery packet 은 `cautilus.workbench_instance_catalog.v1` 이고 fixture proof 는 [fixtures/workbench-instance-discovery/](../../fixtures/workbench-instance-discovery) 아래에 있다.
- canonical live invocation packets 은 `cautilus.live_run_invocation_request.v1` / `cautilus.live_run_invocation_result.v1` 이고 fixture proof 는 [fixtures/live-run-invocation/](../../fixtures/live-run-invocation) 아래에 있다.
- contract docs 는 [docs/contracts/workbench-instance-discovery.md](../contracts/workbench-instance-discovery.md) 와 [docs/contracts/live-run-invocation.md](../contracts/live-run-invocation.md) 로 고정됐다.
- [scripts/agent-runtime/discover-workbench-instances.mjs](../../scripts/agent-runtime/discover-workbench-instances.mjs) 는 이제 `kind: explicit` adapter stanza 를 `cautilus.workbench_instance_catalog.v1` packet 으로 정규화한다.
- JS-side adapter resolution 도 이제 optional `instance_discovery` 와 `live_run_invocation` stanza 를 보존한다.
- [examples/adapter.example.yaml](../../examples/adapter.example.yaml) 과 [docs/contracts/adapter-contract.md](../contracts/adapter-contract.md) 는 이제 `cautilus workbench run-live` command example 을 사용한다.
- [scripts/agent-runtime/run-live-instance-scenario.mjs](../../scripts/agent-runtime/run-live-instance-scenario.mjs) 는 이제 request/result packet 검증과 consumer command dispatch 를 담당하는 thin helper 로 존재한다.
- live invocation helper 는 `consumer_command_template` 를 통해 consumer-owned runtime command 를 호출한다.
- 지금까지의 executable proof 는 explicit discovery normalization 과 live invocation completed/blocked synthetic proof 까지다.
- `cautilus workbench discover` 와 `cautilus workbench run-live` 는 이제 Go CLI entrypoint 로 연결됐다.
- CLI smoke test 는 explicit discovery, command-backed discovery, live invocation completed/blocked dispatch 를 synthetic repo 에서 증명한다.
- Ceal consumer-owned wiring follow-up 은 외부 issue [corca-ai/ceal#1](https://github.com/corca-ai/ceal/issues/1) 로 분리됐다.

## Next Session

1. Cautilus 쪽 남은 local follow-up 을 product-only 기준으로 좁힌다.
   우선순위는 operator acceptance 에 workbench discover/run-live 를 언제 올릴지와, human-facing acceptance command 를 fixture-backed 로 만들지 여부다.
2. Ceal 쪽 real-consumer proof 는 [corca-ai/ceal#1](https://github.com/corca-ai/ceal/issues/1) 진행을 기다리며 추적한다.
   이 repo 에서는 consumer-specific launch/auth/path 결정을 다시 끌어오지 않는다.
3. 어떤 runtime surface 를 더 열더라도 local-first / one-instance-per-invocation / bounded packet 원칙을 유지한다.
   remote auth, watch mode, multi-run session, full UI 흡수는 이번 턴에 넣지 않는다.
4. 릴리즈 후속을 계속 추적해야 한다면 install.sh 외 smoke evidence 가 실제로 더 필요한지부터 판단한다.
   Homebrew smoke 는 on-demand helper 로 남아 있으니, 필요할 때만 `npm run release:smoke-install:brew -- --version v0.6.2` 를 기록한다.
5. 의미 있는 단위가 끝나면 커밋부터 만든다.

## Discuss

- live invocation 의 `consumer_command_template` indirection 을 장기 contract 로 고정할지
- operator acceptance 에 workbench discover/run-live 를 언제 올릴지
- workbench acceptance 를 위해 temp consumer fixture 를 checked-in artifact 로 둘지, 현재처럼 smoke-test-owned synthetic repo 로 유지할지

## References

- [README.md](../../README.md)
- [AGENTS.md](../../AGENTS.md)
- [docs/master-plan.md](../master-plan.md)
- [docs/contracts/adapter-contract.md](../contracts/adapter-contract.md)
- [docs/contracts/workbench-instance-discovery.md](../contracts/workbench-instance-discovery.md)
- [docs/contracts/live-run-invocation.md](../contracts/live-run-invocation.md)
- [docs/contracts/scenario-conversation-review.md](../contracts/scenario-conversation-review.md)
- [examples/adapter.example.yaml](../../examples/adapter.example.yaml)
