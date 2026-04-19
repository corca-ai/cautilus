# Cautilus Handoff

## Workflow Trigger

다음 세션은 workbench contract follow-up implementation 을 시작한다.
먼저 GitHub issue `#17`, `#18`, [docs/contracts/workbench-instance-discovery.md](../contracts/workbench-instance-discovery.md), [docs/contracts/live-run-invocation.md](../contracts/live-run-invocation.md), [AGENTS.md](../../AGENTS.md) 를 읽고 contract-only 이후 첫 runtime proof 를 어디에 둘지 결정한다.

## Current State

- public release 는 `v0.6.1` 이고 tag 는 `0f53d81` 에 있다.
- `#16` 은 `v0.6.0` 로 이미 닫혀 있었다.
- `#17` workbench instance discovery/data roots seam 은 commit `f02a8ee` 로 contract/schema/test 기준 closeable 상태다.
- `#18` generic live-run invocation seam 은 이번 세션 커밋으로 contract/schema/test 기준 closeable 상태다.
- adapter schema 는 이제 optional `instance_discovery` 와 `live_run_invocation` stanza 를 검증한다.
- canonical discovery packet 은 `cautilus.workbench_instance_catalog.v1` 이고 fixture proof 는 [fixtures/workbench-instance-discovery/](../../fixtures/workbench-instance-discovery) 아래에 있다.
- canonical live invocation packets 은 `cautilus.live_run_invocation_request.v1` / `cautilus.live_run_invocation_result.v1` 이고 fixture proof 는 [fixtures/live-run-invocation/](../../fixtures/live-run-invocation) 아래에 있다.
- contract docs 는 [docs/contracts/workbench-instance-discovery.md](../contracts/workbench-instance-discovery.md) 와 [docs/contracts/live-run-invocation.md](../contracts/live-run-invocation.md) 로 고정됐다.
- 이번 slice 는 여전히 contract-first 이다.
  실제 discovery runner 나 live invocation wrapper CLI 는 아직 product-owned 로 만들지 않았다.

## Next Session

1. `#17`, `#18` 을 이미 닫지 않았다면 close comment 와 함께 닫는다.
2. workbench follow-up 의 첫 executable slice 를 고른다.
   후보는 adapter-owned helper script template, thin CLI wrapper, 또는 fixture-backed proof runner 다.
3. runtime surface 를 시작하면 local-first / one-instance-per-invocation / bounded packet 원칙을 유지한다.

## Discuss

- discovery 를 product-owned helper command 로 감쌀지, adapter command contract 로 한 턴 더 둘지
- live invocation request 의 scenario subset 을 장기적으로 `cautilus.scenario.v1` 전체와 합칠지
- first runnable proof 를 Ceal consumer experiment 로 먼저 할지, repo-local synthetic fixture runner 로 먼저 할지

## References

- [README.md](../../README.md)
- [AGENTS.md](../../AGENTS.md)
- [docs/master-plan.md](../master-plan.md)
- [docs/contracts/workbench-instance-discovery.md](../contracts/workbench-instance-discovery.md)
- [docs/contracts/live-run-invocation.md](../contracts/live-run-invocation.md)
- [docs/contracts/scenario-conversation-review.md](../contracts/scenario-conversation-review.md)
