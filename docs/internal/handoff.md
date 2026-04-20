# Cautilus Handoff

## Workflow Trigger

다음 세션은 workbench runtime proof 의 첫 executable slice 를 시작한다.
먼저 GitHub issue `#17`, `#18`, [docs/contracts/workbench-instance-discovery.md](../contracts/workbench-instance-discovery.md), [docs/contracts/live-run-invocation.md](../contracts/live-run-invocation.md), [docs/contracts/adapter-contract.md](../contracts/adapter-contract.md), [examples/adapter.example.yaml](../../examples/adapter.example.yaml), [AGENTS.md](../../AGENTS.md) 를 읽는다.
핵심 질문은 contract-only follow-up 을 어디에 둘지 자체가 아니라, 예시 adapter 가 이미 가리키는 discovery/live invocation seam 중 무엇을 먼저 executable proof 로 고정할지다.
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
- [examples/adapter.example.yaml](../../examples/adapter.example.yaml) 과 [docs/contracts/adapter-contract.md](../contracts/adapter-contract.md) 는 이미 `scripts/agent-runtime/discover-workbench-instances.mjs` 와 `scripts/agent-runtime/run-live-instance-scenario.mjs` 를 예시 command seam 으로 가리킨다.
- 실제 [scripts/agent-runtime/](../../scripts/agent-runtime) 아래에는 위 두 runner 가 아직 없다.
- 지금까지의 proof 는 schema/fixture validation 이고, product-owned discovery runner 나 live invocation wrapper surface 는 아직 없다.
- 다음 slice 는 contract 를 더 늘리는 것보다 example adapter, adapter schema, fixture packet 을 한 번 실제 실행 경로로 잇는 데 의미가 있다.

## Next Session

1. 첫 executable slice 를 discovery 쪽으로 시작할지, live invocation 쪽으로 시작할지 결정한다.
   현재 문서와 예시 adapter 가 둘 다 runner 파일명을 이미 공개하고 있으므로, 첫 구현은 그 seam 을 실재화하는 쪽이 가장 자연스럽다.
2. 우선순위는 `scripts/agent-runtime/discover-workbench-instances.mjs` 와 `scripts/agent-runtime/run-live-instance-scenario.mjs` 중 하나 이상을 synthetic fixture proof 와 함께 추가하는 쪽으로 둔다.
   새 runtime surface 를 열면 AGENTS 규칙대로 같은 slice 에 executable test 를 같이 둔다.
3. 첫 proof 는 local-first / one-instance-per-invocation / bounded packet 원칙을 유지한다.
   remote auth, watch mode, multi-run session, full UI 흡수는 이번 턴에 넣지 않는다.
4. 릴리즈 후속을 계속 추적해야 한다면 install.sh 외 smoke evidence 가 실제로 더 필요한지부터 판단한다.
   Homebrew smoke 는 on-demand helper 로 남아 있으니, 필요할 때만 `npm run release:smoke-install:brew -- --version v0.6.2` 를 기록한다.
5. 의미 있는 단위가 끝나면 커밋부터 만든다.

## Discuss

- discovery 를 먼저 product-owned helper script 로 고정할지, thin Go CLI wrapper 로 바로 끌어올릴지
- live invocation 의 첫 proof 에서 `completed` 경로만 먼저 고정할지, `blocked` diagnostics 까지 한 번에 넣을지
- 첫 runnable proof 를 Ceal consumer experiment 로 바로 연결할지, repo-local synthetic fixture runner 로 먼저 고정할지

## References

- [README.md](../../README.md)
- [AGENTS.md](../../AGENTS.md)
- [docs/master-plan.md](../master-plan.md)
- [docs/contracts/adapter-contract.md](../contracts/adapter-contract.md)
- [docs/contracts/workbench-instance-discovery.md](../contracts/workbench-instance-discovery.md)
- [docs/contracts/live-run-invocation.md](../contracts/live-run-invocation.md)
- [docs/contracts/scenario-conversation-review.md](../contracts/scenario-conversation-review.md)
- [examples/adapter.example.yaml](../../examples/adapter.example.yaml)
