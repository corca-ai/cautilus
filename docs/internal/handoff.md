# Cautilus Handoff

## Workflow Trigger

다음 세션은 workbench runtime proof 의 첫 executable slice 를 시작한다.
먼저 GitHub issue `#17`, `#18`, [docs/contracts/workbench-instance-discovery.md](../contracts/workbench-instance-discovery.md), [docs/contracts/live-run-invocation.md](../contracts/live-run-invocation.md), [docs/contracts/adapter-contract.md](../contracts/adapter-contract.md), [examples/adapter.example.yaml](../../examples/adapter.example.yaml), [AGENTS.md](../../AGENTS.md) 를 읽는다.
핵심 질문은 contract-only follow-up 을 어디에 둘지 자체가 아니라, example adapter 와 contract docs 가 이미 선언한 discovery/live invocation seam 중 무엇을 먼저 executable proof 로 고정할지다.
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
- [examples/adapter.example.yaml](../../examples/adapter.example.yaml) 과 [docs/contracts/adapter-contract.md](../contracts/adapter-contract.md) 는 self-recursive wrapper 예시를 제거했다.
- live invocation 은 아직 product-owned helper 가 아니라 consumer-owned command seam 으로 남아 있다.
- 지금까지의 executable proof 는 explicit discovery normalization 까지다.
- 다음 slice 는 live invocation 을 product-owned helper 로 올릴지, 계속 consumer-owned command seam 으로 둘지 결정하는 쪽으로 좁혀졌다.

## Next Session

1. live invocation seam 을 product-owned helper 로 실제로 만들지, consumer-owned command example 로 유지할지 결정한다.
   현재 contract shape 에서는 generic wrapper 가 자기 자신을 재귀 호출하기 쉬우므로, helper 를 추가하려면 adapter indirection 또는 다른 invocation surface 가 더 필요하다.
2. workbench 후속이 discovery 쪽이라면 explicit 외에 `kind: command` consumer probe 를 product proof 에 어떻게 엮을지 정한다.
   지금 helper 는 explicit normalization only 이다.
3. 어떤 runtime surface 를 더 열더라도 local-first / one-instance-per-invocation / bounded packet 원칙을 유지한다.
   remote auth, watch mode, multi-run session, full UI 흡수는 이번 턴에 넣지 않는다.
4. 릴리즈 후속을 계속 추적해야 한다면 install.sh 외 smoke evidence 가 실제로 더 필요한지부터 판단한다.
   Homebrew smoke 는 on-demand helper 로 남아 있으니, 필요할 때만 `npm run release:smoke-install:brew -- --version v0.6.2` 를 기록한다.
5. 의미 있는 단위가 끝나면 커밋부터 만든다.

## Discuss

- discovery helper 를 thin Go CLI wrapper 로 끌어올릴지, 지금처럼 agent-runtime helper 로 유지할지
- live invocation 을 generic wrapper 로 만들려면 adapter contract 에 어떤 non-recursive indirection 이 필요한지
- 다음 runnable proof 를 Ceal consumer experiment 로 바로 연결할지, repo-local synthetic invocation runner 로 먼저 고정할지

## References

- [README.md](../../README.md)
- [AGENTS.md](../../AGENTS.md)
- [docs/master-plan.md](../master-plan.md)
- [docs/contracts/adapter-contract.md](../contracts/adapter-contract.md)
- [docs/contracts/workbench-instance-discovery.md](../contracts/workbench-instance-discovery.md)
- [docs/contracts/live-run-invocation.md](../contracts/live-run-invocation.md)
- [docs/contracts/scenario-conversation-review.md](../contracts/scenario-conversation-review.md)
- [examples/adapter.example.yaml](../../examples/adapter.example.yaml)
