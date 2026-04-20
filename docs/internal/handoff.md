# Cautilus Handoff

## Workflow Trigger

다음 세션은 방금 닫은 `#19` 회귀와 `v0.7.1` 공개 릴리즈를 전제로, workbench surface 의 다음 product-only follow-up 을 좁히는 쪽으로 시작한다.
먼저 GitHub issue `#19`, [docs/contracts/workbench-instance-discovery.md](../contracts/workbench-instance-discovery.md), [docs/contracts/live-run-invocation.md](../contracts/live-run-invocation.md), [docs/maintainers/operator-acceptance.md](../maintainers/operator-acceptance.md), [AGENTS.md](../../AGENTS.md) 를 읽는다.
핵심 질문은 이제 discovery/live invocation seam 자체를 설계할지 여부가 아니라, 이미 공개된 CLI surface 를 operator acceptance 와 real-consumer proof 에 어떻게 고정할지다.
release workflow 쪽을 더 다듬고 싶다면 `.agents/surfaces.json` 부재 때문에 `charness:release` 의 real-host proof 체크가 깨진다는 점부터 본다.

## Current State

- public release 는 `v0.7.1` 이고 tag/head 는 commit `1061223` 에 있다.
- `release-artifacts` workflow run `24652980502` 는 성공했다.
- `npm run release:verify-public -- --version v0.7.1` 는 통과했다.
- `npm run release:smoke-install -- --channel install_sh --version v0.7.1` 는 통과했다.
- `#19` workbench discover stderr/JSON corruption 은 commit `fd6175f` 로 수정됐다.
- 이 수정은 `executeWorkbenchCommand` 가 stdout/stderr 를 분리 캡처하도록 바꾸고, stderr warning 이후 stdout JSON 을 쓰는 discovery probe 회귀 테스트를 추가한다.
- adapter schema 는 이제 optional `instance_discovery` 와 `live_run_invocation` stanza 를 검증한다.
- canonical discovery packet 은 `cautilus.workbench_instance_catalog.v1` 이고 fixture proof 는 [fixtures/workbench-instance-discovery/](../../fixtures/workbench-instance-discovery) 아래에 있다.
- canonical live invocation packets 은 `cautilus.live_run_invocation_request.v1` / `cautilus.live_run_invocation_result.v1` 이고 fixture proof 는 [fixtures/live-run-invocation/](../../fixtures/live-run-invocation) 아래에 있다.
- contract docs 는 [docs/contracts/workbench-instance-discovery.md](../contracts/workbench-instance-discovery.md) 와 [docs/contracts/live-run-invocation.md](../contracts/live-run-invocation.md) 로 고정됐다.
- [scripts/agent-runtime/discover-workbench-instances.mjs](../../scripts/agent-runtime/discover-workbench-instances.mjs) 는 이제 `kind: explicit` adapter stanza 를 `cautilus.workbench_instance_catalog.v1` packet 으로 정규화한다.
- JS-side adapter resolution 도 이제 optional `instance_discovery` 와 `live_run_invocation` stanza 를 보존한다.
- [examples/adapter.example.yaml](../../examples/adapter.example.yaml) 과 [docs/contracts/adapter-contract.md](../contracts/adapter-contract.md) 는 이제 `cautilus workbench run-live` command example 을 사용한다.
- [scripts/agent-runtime/run-live-instance-scenario.mjs](../../scripts/agent-runtime/run-live-instance-scenario.mjs) 는 이제 request/result packet 검증과 consumer command dispatch 를 담당하는 thin helper 로 존재한다.
- live invocation helper 는 `consumer_command_template` 를 통해 consumer-owned runtime command 를 호출한다.
- 지금까지의 executable proof 는 explicit discovery normalization, command-backed discovery, stderr warning regression, live invocation completed/blocked synthetic proof 까지다.
- `cautilus workbench discover` 와 `cautilus workbench run-live` 는 이제 Go CLI entrypoint 로 연결됐다.
- CLI smoke test 는 explicit discovery, command-backed discovery, live invocation completed/blocked dispatch 를 synthetic repo 에서 증명한다.
- Ceal consumer-owned wiring follow-up 은 외부 issue [corca-ai/ceal#1](https://github.com/corca-ai/ceal/issues/1) 로 분리됐다.

## Next Session

1. operator acceptance 에 workbench discover/run-live 를 언제 올릴지 결정한다.
   필요하면 [docs/maintainers/operator-acceptance.md](../maintainers/operator-acceptance.md) 에 public acceptance command 를 추가한다.
2. workbench acceptance proof 를 지금처럼 smoke-test-owned synthetic repo 로 유지할지, 아니면 checked-in temp consumer fixture 로 승격할지 결정한다.
3. Ceal 쪽 real-consumer proof 는 [corca-ai/ceal#1](https://github.com/corca-ai/ceal/issues/1) 진행을 기다리며 추적한다.
   이 repo 에서는 consumer-specific launch/auth/path 결정을 다시 가져오지 않는다.
4. release tooling 을 계속 다듬을 거면 `.agents/surfaces.json` 또는 release adapter seam 을 정리해서 `charness:release` 의 real-host proof 체크가 깨지지 않게 한다.
5. 어떤 runtime surface 를 더 열더라도 local-first / one-instance-per-invocation / bounded packet 원칙을 유지한다.
   remote auth, watch mode, multi-run session, full UI 흡수는 다음 세션 기본 범위가 아니다.

## Discuss

- live invocation 의 `consumer_command_template` indirection 을 장기 contract 로 고정할지
- operator acceptance 에 workbench discover/run-live 를 언제 올릴지
- workbench acceptance 를 위해 temp consumer fixture 를 checked-in artifact 로 둘지, 현재처럼 smoke-test-owned synthetic repo 로 유지할지
- release adapter/surfaces manifest seam 을 product repo 에서 어디까지 first-class 로 관리할지

## References

- [README.md](../../README.md)
- [AGENTS.md](../../AGENTS.md)
- [docs/master-plan.md](../master-plan.md)
- [docs/contracts/adapter-contract.md](../contracts/adapter-contract.md)
- [docs/contracts/workbench-instance-discovery.md](../contracts/workbench-instance-discovery.md)
- [docs/contracts/live-run-invocation.md](../contracts/live-run-invocation.md)
- [docs/contracts/scenario-conversation-review.md](../contracts/scenario-conversation-review.md)
- [examples/adapter.example.yaml](../../examples/adapter.example.yaml)
